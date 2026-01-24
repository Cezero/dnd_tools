import { createHash } from 'crypto';

import type { AdvancementEditState, CharacterEditState, CharacterWithAllDetailsResponse, ResolvedCharacterResult } from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { AvailableFeatService } from './availableFeatService';
import { calculateSpellSelection, filterInvalidAppliesToEntities } from './characterResolutionController';
import { CharacterResolutionService } from './characterResolutionService';
import { CharacterResolvedResultsService } from './characterResolvedResultsService';
import { GestaltMechanicsResolver } from './gestaltMechanicsResolver';
import { ResolvedFeatureService } from './resolvedFeatureService';
import { characterService } from '../character/characterService';
import { classService } from '../class/classService';
import { featService } from '../feat/featService';
import { raceService } from '../race/raceService';
import { DraftStatePubSub } from '../shared/draftState/DraftStatePubSub';
import { DraftStateService } from '../shared/draftState/DraftStateService';

/* TODO this should be in types.ts
*/
type PendingResolutionInput = {
    characterDraftState?: CharacterEditState;
    advancementDraftState?: AdvancementEditState;
    targetLevel?: number;
    timer?: ReturnType<typeof setTimeout>;
};

const RESOLUTION_DEBOUNCE_MS = 75;

function hashJson(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function selectEffectiveAdvancements(
    advancements: CharacterWithAllDetailsResponse['advancements'] | undefined
): NonNullable<CharacterWithAllDetailsResponse['advancements']> {
    if (!advancements || advancements.length === 0) {
        return [];
    }

    const byLevel = new Map<number, CharacterWithAllDetailsResponse['advancements'][number]>();

    for (const adv of advancements) {
        const existing = byLevel.get(adv.level);
        if (!existing) {
            byLevel.set(adv.level, adv);
            continue;
        }

        const existingVersion = existing.version ?? 0;
        const nextVersion = adv.version ?? 0;
        if (nextVersion >= existingVersion) {
            byLevel.set(adv.level, adv);
        }
    }

    return Array.from(byLevel.values()).sort((a, b) => a.level - b.level);
}

function withAdvancementDraftApplied(
    character: CharacterWithAllDetailsResponse,
    advancementDraftState: AdvancementEditState
): CharacterWithAllDetailsResponse {
    const effective = selectEffectiveAdvancements(character.advancements);

    const replacement = {
        id: advancementDraftState.advancementId,
        characterId: advancementDraftState.characterId,
        level: advancementDraftState.level,
        version: advancementDraftState.version ?? 1,
        classId: advancementDraftState.classId,
        secondaryClassId: advancementDraftState.secondaryClassId ?? null,
        hitPoints: advancementDraftState.hitPoints,
        abilityId: advancementDraftState.abilityId ?? null,
        notes: advancementDraftState.notes ?? null,
        createdAt: new Date(),
        skills: advancementDraftState.skills.map((s) => ({
            id: 0,
            advancementId: advancementDraftState.advancementId,
            skillId: s.skillId,
            skillSubId: s.skillSubId ?? null,
            pointsSpent: s.pointsSpent,
            customSubtype: s.customSubtype ?? null,
        })),
        feats: advancementDraftState.feats.map((f) => ({
            id: 0,
            advancementId: advancementDraftState.advancementId,
            featId: f.featId,
            featSubId: f.featSubId ?? null,
        })),
        spellsKnown: advancementDraftState.spellsKnown.map((s) => ({
            id: 0,
            advancementId: advancementDraftState.advancementId,
            spellId: s.spellId,
            isFreeGrant: s.isFreeGrant ?? false,
        })),
        featureChoices: advancementDraftState.featureChoices.map((c) => ({
            ...c,
        })),
    } satisfies CharacterWithAllDetailsResponse['advancements'][number];

    const existingIdx = effective.findIndex((a) => a.level === replacement.level);
    if (existingIdx >= 0) {
        effective[existingIdx] = replacement;
    } else {
        effective.push(replacement);
        effective.sort((a, b) => a.level - b.level);
    }

    return {
        ...character,
        advancements: effective,
    };
}

async function computeFromCharacterDraft(characterId: number, characterState: CharacterEditState): Promise<ResolvedCharacterResult> {
    const character = await characterService.getCharacterWithAllDetails({ id: characterId });
    if (!character) {
        throw new Error(`Character ${characterId} not found`);
    }
    const effectiveCharacter: CharacterWithAllDetailsResponse = {
        ...character,
        advancements: selectEffectiveAdvancements(character.advancements),
    };

    const raceDetails = characterState.raceId ? await raceService.getRaceById({ id: characterState.raceId }) : null;
    const classDetails = characterState.classId ? await classService.getClassById({ id: characterState.classId }) : null;
    const secondaryClassDetails = characterState.secondaryClassId ? await classService.getClassById({ id: characterState.secondaryClassId }) : null;
    const userChoices: Record<number, number[]> = {};

    const context = {
        character: effectiveCharacter,
        targetLevel: characterState.level,
        advancement: effectiveCharacter.advancements?.find(adv => adv.level === characterState.level),
        raceDetails,
        classDetails,
        secondaryClassDetails,
        isGestalt: characterState.isGestalt,
        userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
        includePendingChoices: true,
        resolveCascading: true,
        maxResolutionDepth: 10,
    };

    const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
        effectiveCharacter,
        characterState.level,
        context
    );

    const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
    const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
    const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

    const classLevels = new Map<number, number>();
    if (effectiveCharacter.advancements) {
        for (const adv of effectiveCharacter.advancements) {
            const currentLevel = classLevels.get(adv.classId) ?? 0;
            classLevels.set(adv.classId, currentLevel + 1);
            if (adv.secondaryClassId) {
                const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
            }
        }
    }

    const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
        resolutionResult.resolvedProgressions,
        characterState.level,
        classLevels
    );
    const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
        resolutionResult.resolvedProgressions
    );

    const allFeatsResponse = await featService.getAllFeats();
    const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
        effectiveCharacter,
        resolutionResult.resolvedProgressions,
        classDetails,
        raceDetails,
        allFeatsResponse.results
    );

    const spellSelection = await calculateSpellSelection(
        characterId,
        effectiveCharacter,
        resolutionResult.resolvedProgressions
    );

    let enrichedProgressions = resolutionResult.resolvedProgressions;
    enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

    let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
        enrichedProgressions,
        effectiveCharacter,
        characterState.level
    );

    if (characterState.isGestalt || effectiveCharacter.advancements?.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0)) {
        resolvedFormulaValues = GestaltMechanicsResolver.resolveGestaltMechanics(
            effectiveCharacter,
            enrichedProgressions,
            resolvedFormulaValues
        );
    }

    return {
        resolvedProgressions: enrichedProgressions,
        pendingChoices: resolutionResult.pendingChoices,
        classSkills,
        skillBonuses,
        grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
        availableFeatsCount,
        availableFighterBonusFeats,
        qualifiedFeats,
        ...(Object.keys(spellSelection).length > 0 && { spellSelection }),
        ...(Object.keys(resolvedFormulaValues).length > 0 && { resolvedFormulaValues }),
        warnings: resolutionResult.warnings,
        errors: resolutionResult.errors
    };
}

async function computeFromAdvancementDraft(characterId: number, advancementDraftState: AdvancementEditState): Promise<ResolvedCharacterResult> {
    const character = await characterService.getCharacterWithAllDetails({ id: characterId });
    if (!character) {
        throw new Error(`Character ${characterId} not found`);
    }

    const effectiveCharacter = withAdvancementDraftApplied(character, advancementDraftState);
    const effectiveAdvancements = effectiveCharacter.advancements ?? [];

    const raceDetails = effectiveCharacter.raceId ? await raceService.getRaceById({ id: effectiveCharacter.raceId }) : null;
    const classDetails = advancementDraftState.classId > 0 ? await classService.getClassById({ id: advancementDraftState.classId }) : null;
    const secondaryClassDetails =
        advancementDraftState.secondaryClassId && advancementDraftState.secondaryClassId > 0
            ? await classService.getClassById({ id: advancementDraftState.secondaryClassId })
            : null;

    const isGestalt =
        effectiveCharacter.isGestalt ||
        (advancementDraftState.secondaryClassId !== null && advancementDraftState.secondaryClassId !== 0);

    const userChoices: Record<number, number[]> = {};

    const context = {
        character: effectiveCharacter,
        targetLevel: advancementDraftState.level,
        advancement: effectiveAdvancements.find((adv) => adv.level === advancementDraftState.level),
        raceDetails,
        classDetails,
        secondaryClassDetails,
        isGestalt,
        userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
        includePendingChoices: true,
        resolveCascading: true,
        maxResolutionDepth: 10,
    };

    const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
        effectiveCharacter,
        advancementDraftState.level,
        context
    );

    const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
    const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
    const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

    const classLevels = new Map<number, number>();
    for (const adv of effectiveAdvancements) {
        if (adv.level > advancementDraftState.level) {
            continue;
        }
        const currentLevel = classLevels.get(adv.classId) ?? 0;
        classLevels.set(adv.classId, currentLevel + 1);
        if (adv.secondaryClassId) {
            const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
            classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
        }
    }

    const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
        resolutionResult.resolvedProgressions,
        advancementDraftState.level,
        classLevels
    );
    const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
        resolutionResult.resolvedProgressions
    );

    const allFeatsResponse = await featService.getAllFeats();
    const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
        effectiveCharacter,
        resolutionResult.resolvedProgressions,
        classDetails,
        raceDetails,
        allFeatsResponse.results
    );

    const spellSelection = await calculateSpellSelection(
        characterId,
        effectiveCharacter,
        resolutionResult.resolvedProgressions
    );

    let enrichedProgressions = resolutionResult.resolvedProgressions;
    enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

    let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
        enrichedProgressions,
        effectiveCharacter,
        advancementDraftState.level
    );

    if (isGestalt) {
        resolvedFormulaValues = GestaltMechanicsResolver.resolveGestaltMechanics(
            effectiveCharacter,
            enrichedProgressions,
            resolvedFormulaValues
        );
    }

    return {
        resolvedProgressions: enrichedProgressions,
        pendingChoices: resolutionResult.pendingChoices,
        classSkills,
        skillBonuses,
        grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
        availableFeatsCount,
        availableFighterBonusFeats,
        qualifiedFeats,
        ...(Object.keys(spellSelection).length > 0 && { spellSelection }),
        ...(Object.keys(resolvedFormulaValues).length > 0 && { resolvedFormulaValues }),
        warnings: resolutionResult.warnings,
        errors: resolutionResult.errors
    };
}

async function computeFromCreateDraft(
    characterDraftState: CharacterEditState,
    advancementDraftState: AdvancementEditState
): Promise<ResolvedCharacterResult> {
    // Build a minimal CharacterWithAllDetailsResponse-like object that satisfies the resolver.
    // Many gameplay/runtime fields are intentionally empty during draft-only creation.
    const character = {
        id: characterDraftState.characterId,
        userId: 0,
        name: '',
        raceId: characterDraftState.raceId ?? 0,
        alignmentId: null,
        deityId: null,
        age: null,
        height: null,
        weight: null,
        eyes: null,
        hair: null,
        gender: null,
        notes: null,
        editionId: characterDraftState.editionId,
        allowVariantClasses: characterDraftState.allowVariantClasses,
        isGestalt: characterDraftState.isGestalt,
        ignoreLevelAdjustment: characterDraftState.ignoreLevelAdjustment,
        platinum: 0,
        gold: 0,
        silver: 0,
        copper: 0,
        xp: 0,
        advancements: [
            {
                id: advancementDraftState.advancementId,
                characterId: characterDraftState.characterId,
                level: advancementDraftState.level,
                version: advancementDraftState.version ?? 1,
                classId: advancementDraftState.classId,
                secondaryClassId: advancementDraftState.secondaryClassId ?? null,
                hitPoints: advancementDraftState.hitPoints,
                abilityId: advancementDraftState.abilityId ?? null,
                notes: advancementDraftState.notes ?? null,
                createdAt: new Date(),
                skills: advancementDraftState.skills.map((s) => ({
                    id: 0,
                    advancementId: advancementDraftState.advancementId,
                    skillId: s.skillId,
                    skillSubId: s.skillSubId ?? null,
                    pointsSpent: s.pointsSpent,
                    customSubtype: s.customSubtype ?? null,
                })),
                feats: advancementDraftState.feats.map((f) => ({
                    id: 0,
                    advancementId: advancementDraftState.advancementId,
                    featId: f.featId,
                    featSubId: f.featSubId ?? null,
                })),
                spellsKnown: advancementDraftState.spellsKnown.map((s) => ({
                    id: 0,
                    advancementId: advancementDraftState.advancementId,
                    spellId: s.spellId,
                    isFreeGrant: s.isFreeGrant ?? false,
                })),
                featureChoices: advancementDraftState.featureChoices.map((c) => ({
                    ...c,
                })),
            }
        ],
        abilityScores: characterDraftState.abilityScores.map((a) => ({
            id: 0,
            characterId: 0,
            abilityId: a.abilityId,
            value: a.value,
        })),
        preparedSpells: [],
        disallowedSources: characterDraftState.disallowedSources.map((d) => ({
            id: 0,
            characterId: 0,
            sourceBookId: d.sourceBookId,
        })),
        characterItems: [],
        attackDefinitions: [],
        characterLanguages: [],
    } as unknown as CharacterWithAllDetailsResponse;

    const raceDetails = characterDraftState.raceId ? await raceService.getRaceById({ id: characterDraftState.raceId }) : null;
    const classDetails = advancementDraftState.classId > 0 ? await classService.getClassById({ id: advancementDraftState.classId }) : null;
    const secondaryClassDetails =
        advancementDraftState.secondaryClassId && advancementDraftState.secondaryClassId > 0
            ? await classService.getClassById({ id: advancementDraftState.secondaryClassId })
            : null;

    const isGestalt =
        characterDraftState.isGestalt ||
        (advancementDraftState.secondaryClassId !== null && advancementDraftState.secondaryClassId !== 0);

    const userChoices: Record<number, number[]> = {};

    const context = {
        character,
        targetLevel: advancementDraftState.level,
        advancement: character.advancements?.find((adv) => adv.level === advancementDraftState.level),
        raceDetails,
        classDetails,
        secondaryClassDetails,
        isGestalt,
        userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
        includePendingChoices: true,
        resolveCascading: true,
        maxResolutionDepth: 10,
    };

    const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
        character,
        advancementDraftState.level,
        context
    );

    const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
    const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
    const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

    const classLevels = new Map<number, number>();
    for (const adv of character.advancements ?? []) {
        if (adv.level > advancementDraftState.level) {
            continue;
        }
        const currentLevel = classLevels.get(adv.classId) ?? 0;
        classLevels.set(adv.classId, currentLevel + 1);
        if (adv.secondaryClassId) {
            const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
            classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
        }
    }

    const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
        resolutionResult.resolvedProgressions,
        advancementDraftState.level,
        classLevels
    );
    const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
        resolutionResult.resolvedProgressions
    );

    const allFeatsResponse = await featService.getAllFeats();
    const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
        character,
        resolutionResult.resolvedProgressions,
        classDetails,
        raceDetails,
        allFeatsResponse.results
    );

    const spellSelection = await calculateSpellSelection(
        characterDraftState.characterId,
        character,
        resolutionResult.resolvedProgressions
    );

    let enrichedProgressions = resolutionResult.resolvedProgressions;
    enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

    let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
        enrichedProgressions,
        character,
        advancementDraftState.level
    );

    if (isGestalt) {
        resolvedFormulaValues = GestaltMechanicsResolver.resolveGestaltMechanics(
            character,
            enrichedProgressions,
            resolvedFormulaValues
        );
    }

    return {
        resolvedProgressions: enrichedProgressions,
        pendingChoices: resolutionResult.pendingChoices,
        classSkills,
        skillBonuses,
        grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
        availableFeatsCount,
        availableFighterBonusFeats,
        qualifiedFeats,
        ...(Object.keys(spellSelection).length > 0 && { spellSelection }),
        ...(Object.keys(resolvedFormulaValues).length > 0 && { resolvedFormulaValues }),
        warnings: resolutionResult.warnings,
        errors: resolutionResult.errors
    };
}

/**
 * Character resolution projection service.
 *
 * Listens to draft updates (character + advancement) and publishes resolved character snapshots
 * over a dedicated pub/sub topic only when the resolved output actually changes.
 *
 * Redis pub/sub channel:
 * - `channel:character:resolved:{characterId}`
 */
export class CharacterResolutionProjectionService {
    private pubSub = new DraftStatePubSub();
    private resolvedResultsService = new CharacterResolvedResultsService();
    private draftStateService = new DraftStateService();
    private pendingByCharacter = new Map<number, PendingResolutionInput>();
    private lastHashByCharacter = new Map<number, string>();
    private isInitialized = false;

    private async ensureInitialized(): Promise<void> {
        if (this.isInitialized) {
            return;
        }
        await this.pubSub.initialize();
        this.isInitialized = true;
    }

    scheduleFromCharacterDraft(characterId: number, characterDraftState: CharacterEditState): void {
        const pending = this.pendingByCharacter.get(characterId) ?? {};
        if (pending.timer) {
            clearTimeout(pending.timer);
        }

        pending.characterDraftState = characterDraftState;
        pending.targetLevel = characterDraftState.level;
        pending.timer = setTimeout(() => {
            this.run(characterId).catch((error) => {
                console.error(`Error projecting resolved character for ${characterId}:`, error);
            });
        }, RESOLUTION_DEBOUNCE_MS);

        this.pendingByCharacter.set(characterId, pending);
    }

    scheduleFromAdvancementDraft(advancementDraftState: AdvancementEditState): void {
        const characterId = advancementDraftState.characterId;
        const pending = this.pendingByCharacter.get(characterId) ?? {};
        if (pending.timer) {
            clearTimeout(pending.timer);
        }

        pending.advancementDraftState = advancementDraftState;
        pending.targetLevel = advancementDraftState.level;
        pending.timer = setTimeout(() => {
            this.run(characterId).catch((error) => {
                console.error(`Error projecting resolved character for ${characterId}:`, error);
            });
        }, RESOLUTION_DEBOUNCE_MS);

        this.pendingByCharacter.set(characterId, pending);
    }

    private async run(characterId: number): Promise<void> {
        await this.ensureInitialized();

        const pending = this.pendingByCharacter.get(characterId);
        if (!pending) {
            return;
        }

        const { advancementDraftState, characterDraftState } = pending;

        let resolved: ResolvedCharacterResult;
        if (characterId < 1) {
            // Draft-only creation resolution (requires both character + advancement draft state).
            const effectiveCharacterState =
                characterDraftState ??
                (await this.draftStateService.getState<CharacterEditState>(DraftType.Character, characterId)) ??
                undefined;

            if (!effectiveCharacterState || !advancementDraftState) {
                return;
            }

            resolved = await computeFromCreateDraft(effectiveCharacterState, advancementDraftState);
        } else if (characterDraftState) {
            resolved = await computeFromCharacterDraft(characterId, characterDraftState);
        } else if (advancementDraftState) {
            resolved = await computeFromAdvancementDraft(characterId, advancementDraftState);
        } else {
            return;
        }

        const nextHash = hashJson(resolved);
        const prevHash = this.lastHashByCharacter.get(characterId);
        if (prevHash && prevHash === nextHash) {
            return;
        }

        this.lastHashByCharacter.set(characterId, nextHash);
        await this.resolvedResultsService.setResolvedResults(characterId, resolved);
        await this.pubSub.publishChannel(`channel:character:resolved:${characterId}`, resolved);
        // Backward compatibility: continue publishing the legacy characterResolution message
        // on the Character draft channel until the frontend is fully migrated to topic subscriptions.
        await this.pubSub.publish(DraftType.Character, characterId, {
            type: 'characterResolution',
            resolvedCharacter: resolved,
        });
    }
}

export const characterResolutionProjectionService = new CharacterResolutionProjectionService();
