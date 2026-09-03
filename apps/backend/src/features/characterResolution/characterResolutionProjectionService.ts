import { createHash } from 'crypto';

import type { AdvancementEditState, CharacterEditState, CharacterWithAllDetailsResponse, ResolvedCharacterResult } from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { AvailableFeatService } from './availableFeatService';
import { attachResolvedAnimals } from './characterAnimalsResolution';
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
import { UserSessionService } from '../shared/session/UserSessionService';

/* TODO this should be in types.ts
*/
type PendingResolutionInput = {
    characterDraftState?: CharacterEditState;
    advancementDraftState?: AdvancementEditState;
    userId?: number;
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

    const resolvedRaceId = characterState.raceId ?? effectiveCharacter.raceId;
    const resolvedCharacter: CharacterWithAllDetailsResponse = {
        ...effectiveCharacter,
        name: characterState.name,
        raceId: resolvedRaceId,
        editionId: characterState.editionId,
        alignmentId: characterState.alignmentId ?? null,
        deityId: characterState.deityId ?? null,
        age: characterState.age ?? null,
        height: characterState.height ?? null,
        weight: characterState.weight ?? null,
        eyes: characterState.eyes ?? null,
        hair: characterState.hair ?? null,
        gender: characterState.gender ?? null,
        notes: characterState.notes ?? null,
        config: {
            characterId,
            allowVariantClasses: characterState.allowVariantClasses,
            isGestalt: characterState.isGestalt,
            ignoreLevelAdjustment: characterState.ignoreLevelAdjustment,
            maxHpAtFirstLevel: characterState.maxHpAtFirstLevel,
        },
        abilityScores: characterState.abilityScores.map((a) => ({
            id: 0,
            characterId,
            abilityId: a.abilityId,
            value: a.value,
        })),
        disallowedSources: characterState.disallowedSources.map((ds) => ({
            id: 0,
            characterId,
            sourceBookId: ds.sourceBookId,
        })),
        wealth: characterState.wealth ?? effectiveCharacter.wealth,
        characterItems: characterState.characterItems ?? effectiveCharacter.characterItems,
        attackDefinitions: characterState.attackDefinitions ?? effectiveCharacter.attackDefinitions,
        characterLanguages:
            characterState.characterLanguages?.map((l) => ({ characterId, languageId: l.languageId })) ??
            effectiveCharacter.characterLanguages,
        companions: characterState.companions ?? effectiveCharacter.companions,
        selectedForms: characterState.selectedForms ?? effectiveCharacter.selectedForms,
    };

    const targetLevel =
        (resolvedCharacter.advancements?.length ?? 0) > 0
            ? Math.max(...(resolvedCharacter.advancements ?? []).map((a) => a.level))
            : 1;

    const advancementForLevel = resolvedCharacter.advancements?.find((adv) => adv.level === targetLevel);

    const raceDetails = resolvedRaceId ? await raceService.getRaceById({ id: resolvedRaceId }) : null;
    const classDetails = advancementForLevel?.classId ? await classService.getClassById({ id: advancementForLevel.classId }) : null;
    const secondaryClassDetails =
        advancementForLevel?.secondaryClassId ? await classService.getClassById({ id: advancementForLevel.secondaryClassId }) : null;
    const userChoices: Record<number, number[]> = {};

    const context = {
        character: resolvedCharacter,
        targetLevel,
        advancement: advancementForLevel,
        raceDetails,
        classDetails,
        secondaryClassDetails,
        isGestalt:
            (resolvedCharacter.config?.isGestalt ?? false) ||
            !!advancementForLevel?.secondaryClassId,
        userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
        includePendingChoices: true,
        resolveCascading: true,
        maxResolutionDepth: 10,
    };

    const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
        resolvedCharacter,
        targetLevel,
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
        targetLevel,
        classLevels
    );
    const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
        resolutionResult.resolvedProgressions
    );

    const allFeatsResponse = await featService.getAllFeats();
    const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
        resolvedCharacter,
        resolutionResult.resolvedProgressions,
        classDetails,
        raceDetails,
        allFeatsResponse.results
    );

    const spellSelection = await calculateSpellSelection(
        characterId,
        resolvedCharacter,
        resolutionResult.resolvedProgressions
    );

    let enrichedProgressions = resolutionResult.resolvedProgressions;
    enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

    let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
        enrichedProgressions,
        resolvedCharacter,
        targetLevel
    );

    if (
        (resolvedCharacter.config?.isGestalt ?? false) ||
        resolvedCharacter.advancements?.some((adv) => adv.secondaryClassId !== null && adv.secondaryClassId !== 0)
    ) {
        resolvedFormulaValues = GestaltMechanicsResolver.resolveGestaltMechanics(
            resolvedCharacter,
            enrichedProgressions,
            resolvedFormulaValues
        );
    }

    return attachResolvedAnimals({
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
    }, resolvedCharacter);
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
        (effectiveCharacter.config?.isGestalt ?? false) ||
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

    return attachResolvedAnimals({
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
    }, effectiveCharacter);
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
        name: characterDraftState.name,
        raceId: characterDraftState.raceId ?? 0,
        alignmentId: characterDraftState.alignmentId ?? null,
        deityId: characterDraftState.deityId ?? null,
        age: characterDraftState.age ?? null,
        height: characterDraftState.height ?? null,
        weight: characterDraftState.weight ?? null,
        eyes: characterDraftState.eyes ?? null,
        hair: characterDraftState.hair ?? null,
        gender: characterDraftState.gender ?? null,
        notes: characterDraftState.notes ?? null,
        editionId: characterDraftState.editionId,
        config: {
            characterId: characterDraftState.characterId,
            allowVariantClasses: characterDraftState.allowVariantClasses,
            isGestalt: characterDraftState.isGestalt,
            ignoreLevelAdjustment: characterDraftState.ignoreLevelAdjustment,
            maxHpAtFirstLevel: characterDraftState.maxHpAtFirstLevel,
        },
        wealth: characterDraftState.wealth ?? [],
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
            characterId: characterDraftState.characterId,
            abilityId: a.abilityId,
            value: a.value,
        })),
        preparedSpells: [],
        disallowedSources: characterDraftState.disallowedSources.map((d) => ({
            id: 0,
            characterId: characterDraftState.characterId,
            sourceBookId: d.sourceBookId,
        })),
        characterItems: characterDraftState.characterItems ?? [],
        attackDefinitions: characterDraftState.attackDefinitions ?? [],
        characterLanguages: characterDraftState.characterLanguages?.map((l) => ({
            characterId: characterDraftState.characterId,
            languageId: l.languageId,
        })) ?? [],
        companions: characterDraftState.companions ?? [],
        selectedForms: characterDraftState.selectedForms ?? [],
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

    return attachResolvedAnimals({
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
    }, character);
}

/**
 * Character resolution projection service.
 *
 * Listens to draft updates (character + advancement) and publishes resolved character snapshots
 * over a dedicated pub/sub topic only when the resolved output actually changes.
 *
 * Redis pub/sub channel:
 * - `channel:character:resolved:{characterId}`
 * 
 * **TODO: Resolution on Session Restore**:
 * - When a user's session is restored (page refresh), drafts are loaded from Redis but
 *   resolution is not automatically triggered. This means resolved character data won't be
 *   available until the user makes a change that triggers onStateUpdate.
 * - Consider triggering resolution when drafts are initially loaded from Redis during
 *   session restore, or when GET /characters/:id/details is called for a draft-only character.
 */
export class CharacterResolutionProjectionService {
    private pubSub = new DraftStatePubSub();
    private resolvedResultsService = new CharacterResolvedResultsService();
    private draftStateService = new DraftStateService();
    private userSessionService = new UserSessionService();
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

    scheduleFromCharacterDraft(characterId: number, characterDraftState: CharacterEditState, userId?: number): void {
        const pending = this.pendingByCharacter.get(characterId) ?? {};
        if (pending.timer) {
            clearTimeout(pending.timer);
        }

        pending.characterDraftState = characterDraftState;
        if (userId !== undefined) {
            pending.userId = userId;
        }
        
        // For draft-only characters, ensure we have both states before scheduling resolution
        const scheduleResolution = () => {
            pending.timer = setTimeout(() => {
                this.run(characterId).catch((error) => {
                    console.error(`Error projecting resolved character for ${characterId}:`, error);
                });
            }, RESOLUTION_DEBOUNCE_MS);
        };
        
        if (characterId < 1 && !pending.advancementDraftState && pending.userId) {
            // Try to load the linked advancement draft before scheduling
            this.loadLinkedAdvancementDraft(characterId, pending.userId)
                .then((advancementState) => {
                    if (advancementState) {
                        pending.advancementDraftState = advancementState;
                    }
                    scheduleResolution();
                })
                .catch((error) => {
                    console.warn(`Failed to load linked advancement draft for character ${characterId}:`, error);
                    // Schedule anyway - run() will try to load it again
                    scheduleResolution();
                });
        } else {
            scheduleResolution();
        }

        this.pendingByCharacter.set(characterId, pending);
    }

    scheduleFromAdvancementDraft(advancementDraftState: AdvancementEditState, userId?: number): void {
        const characterId = advancementDraftState.characterId;
        const pending = this.pendingByCharacter.get(characterId) ?? {};
        if (pending.timer) {
            clearTimeout(pending.timer);
        }

        pending.advancementDraftState = advancementDraftState;
        if (userId !== undefined) {
            pending.userId = userId;
        }
        
        // For draft-only characters, ensure we have both states before scheduling resolution
        const scheduleResolution = () => {
            pending.timer = setTimeout(() => {
                this.run(characterId).catch((error) => {
                    console.error(`Error projecting resolved character for ${characterId}:`, error);
                });
            }, RESOLUTION_DEBOUNCE_MS);
        };
        
        if (characterId < 1 && !pending.characterDraftState) {
            // Try to load the linked character draft before scheduling
            this.draftStateService.getState<CharacterEditState>(DraftType.Character, characterId)
                .then((characterState) => {
                    if (characterState) {
                        pending.characterDraftState = characterState;
                    }
                    scheduleResolution();
                })
                .catch((error) => {
                    console.warn(`Failed to load linked character draft for character ${characterId}:`, error);
                    // Schedule anyway - run() will try to load it again
                    scheduleResolution();
                });
        } else {
            scheduleResolution();
        }

        this.pendingByCharacter.set(characterId, pending);
    }
    
    /**
     * Attempts to find and load the advancement draft linked to a draft-only character.
     * 
     * Uses the user's session to find advancement draft IDs, then loads their states from Redis
     * and returns the one that matches the characterId.
     * 
     * @param characterId - The character draft ID (negative for draft-only)
     * @param userId - The user ID who owns the drafts
     * @returns The advancement draft state, or null if not found
     */
    private async loadLinkedAdvancementDraft(characterId: number, userId: number): Promise<AdvancementEditState | null> {
        try {
            // Get the user's session to find advancement drafts they're editing
            const session = await this.userSessionService.getUserSession(userId);
            if (!session) {
                return null;
            }

            // Find all advancement drafts in the user's editing session (draft-only have negative IDs)
            const advancementDraftRefs = session.editing.filter(
                (ref) => ref.draftType === DraftType.Advancement && ref.id < 0
            );

            if (advancementDraftRefs.length === 0) {
                return null;
            }

            // Try each advancement draft to find the one that matches this characterId
            for (const advancementDraftRef of advancementDraftRefs) {
                const advancementState = await this.draftStateService.getState<AdvancementEditState>(
                    DraftType.Advancement,
                    advancementDraftRef.id
                );

                if (advancementState && advancementState.characterId === characterId) {
                    return advancementState;
                }
            }

            return null;
        } catch (error) {
            console.error(`Error loading linked advancement draft for character ${characterId}:`, error);
            return null;
        }
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

            // For draft-only characters, we need both states. Try to load the missing one from Redis.
            let effectiveAdvancementDraftState = advancementDraftState;
            if (!effectiveAdvancementDraftState && pending.userId) {
                const loaded = await this.loadLinkedAdvancementDraft(characterId, pending.userId);
                if (loaded) {
                    effectiveAdvancementDraftState = loaded;
                }
            }

            if (!effectiveCharacterState || !effectiveAdvancementDraftState) {
                // If we still don't have both states, we can't resolve yet.
                // This can happen if one draft hasn't been created yet or if the link can't be found.
                console.log(
                    `[Resolution] Cannot resolve draft-only character ${characterId}: ` +
                    `characterState=${!!effectiveCharacterState}, advancementState=${!!effectiveAdvancementDraftState}, userId=${pending.userId}`
                );
                return;
            }

            // For draft-only characters, only resolve if a class has been selected
            // (classId > 0). If classId is 0, the class hasn't been selected yet.
            if (effectiveAdvancementDraftState.classId <= 0) {
                console.log(
                    `[Resolution] Skipping resolution for draft-only character ${characterId}: ` +
                    `classId=${effectiveAdvancementDraftState.classId} (class not selected yet)`
                );
                return;
            }

            resolved = await computeFromCreateDraft(effectiveCharacterState, effectiveAdvancementDraftState);
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
