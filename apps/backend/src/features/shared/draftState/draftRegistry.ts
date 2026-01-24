import {
    AdvancementEditStateSchema,
    CharacterEditStateSchema,
    ClassDraftStateSchema,
    FeatureDraftStateSchema,
    RaceDraftStateSchema,
    type AdvancementEditState,
    type CharacterEditState,
    type CharacterWithAllDetailsResponse,
    type ClassDraftState,
    type FeatureDraftState,
    type RaceDraftState,
    type ResolvedCharacterResult,
} from '@shared/schema';
import { DraftType, EditionId, FeatureSourceType } from '@shared/static-data';

import type { DraftConfig } from './types';
import { prisma } from '@/lib/prisma';
import { characterService } from '../../character/characterService';
import { AdvancementSaveService } from '../../advancementDraft/advancementSaveService';
import { CharacterSaveService } from '../../characterDraft/characterSaveService';
import { AvailableFeatService } from '../../characterResolution/availableFeatService';
import { buildCharacterEditState } from '../../characterResolution/characterEditStateBuilder';
import { calculateSpellSelection, filterInvalidAppliesToEntities } from '../../characterResolution/characterResolutionController';
import { characterResolutionProjectionService } from '../../characterResolution/characterResolutionProjectionService';
import { CharacterResolutionService } from '../../characterResolution/characterResolutionService';
import { GestaltMechanicsResolver } from '../../characterResolution/gestaltMechanicsResolver';
import { ResolvedFeatureService } from '../../characterResolution/resolvedFeatureService';
import { classService } from '../../class/classService';
import { ClassSaveService } from '../../classDraft/classSaveService';
import { featService } from '../../feat/featService';
import { FeatureStateService } from '../../featureSystem/featureStateService';
import { featureSystemService, featureSystemService as _featureSystemService } from '../../featureSystem/featureSystemService';
import { raceService } from '../../race/raceService';
import { RaceSaveService } from '../../raceDraft/raceSaveService';

/**
 * Draft type registry mapping draft type enum values to their configurations.
 */
const draftRegistry = new Map<DraftType, DraftConfig>();

// Helper function to build initial class state
async function buildClassInitialState(classId: number): Promise<ClassDraftState> {
    const cls = await classService.getClassById({ id: classId });
    if (!cls) {
        throw new Error(`Class ${classId} not found`);
    }
    return {
        classId,
        name: cls.name,
        abbreviation: cls.abbreviation,
        editionId: cls.editionId,
        isPrestige: cls.isPrestige,
        isVisible: cls.isVisible,
        canCastSpells: cls.canCastSpells,
        spellsKnown: cls.spellsKnown,
        isDivine: cls.isDivine,
        description: cls.description ?? null,
        sourceBookInfo: cls.sourceBookInfo !== undefined ? cls.sourceBookInfo : null,
        featureIds: cls.featureIds || [],
        spellcastingProgression: cls.spellcastingProgression || [],
        spellsKnownProgression: cls.spellsKnownProgression || []
    };
}

// Helper function to build initial race state
async function buildRaceInitialState(raceId: number): Promise<RaceDraftState> {
    const race = await raceService.getRaceById({ id: raceId });
    if (!race) {
        throw new Error(`Race ${raceId} not found`);
    }
    return {
        raceId,
        name: race.name,
        editionId: race.editionId,
        isVisible: race.isVisible,
        description: race.description ?? null,
        sourceBookInfo: race.sourceBookInfo || null,
        featureIds: race.featureIds || []
    };
}

// Helper function to build initial feature state
async function buildFeatureInitialState(featureId: number): Promise<FeatureDraftState> {
    const feature = await _featureSystemService.getFeatureById({ id: featureId });
    if (!feature) {
        throw new Error(`Feature ${featureId} not found`);
    }
    return feature as FeatureDraftState;
}

// Wrapper for FeatureStateService to match the DraftConfig interface
class FeatureSaveServiceAdapter {
    private featureStateService: FeatureStateService;

    constructor() {
        this.featureStateService = new FeatureStateService(featureSystemService);
    }

    async saveSessionToMySQL(featureId: number, _state: FeatureDraftState | Record<string, unknown>, userId: number, _context?: unknown): Promise<number> {
        return await this.featureStateService.saveFeatureStateToDatabase(featureId, userId);
    }
}

// Wrapper for ClassSaveService to match the updated interface
class ClassSaveServiceAdapter {
    private classSaveService: ClassSaveService;

    constructor() {
        this.classSaveService = new ClassSaveService();
    }

    async saveSessionToMySQL(classId: number, state: ClassDraftState | Record<string, unknown>, userId: number, _context?: unknown): Promise<number> {
        return await this.classSaveService.saveSessionToMySQL(classId, state, userId);
    }
}

// Wrapper for RaceSaveService to match the updated interface
class RaceSaveServiceAdapter {
    private raceSaveService: RaceSaveService;

    constructor() {
        this.raceSaveService = new RaceSaveService();
    }

    async saveSessionToMySQL(raceId: number, state: RaceDraftState | Record<string, unknown>, userId: number, _context?: unknown): Promise<number> {
        return await this.raceSaveService.saveSessionToMySQL(raceId, state, userId);
    }
}

// Wrapper for AdvancementSaveService to match the DraftConfig interface
class AdvancementSaveServiceAdapter {
    private advancementSaveService: AdvancementSaveService;

    constructor() {
        this.advancementSaveService = new AdvancementSaveService();
    }

    async saveSessionToMySQL(advancementId: number, state: unknown, userId: number, _context?: unknown): Promise<number> {
        return await this.advancementSaveService.saveSessionToMySQL(
            advancementId,
            state as Record<string, unknown>,
            userId
        );
    }
}

// Register draft configurations
draftRegistry.set(DraftType.Class, {
    editStateSchema: ClassDraftStateSchema,
    saveService: new ClassSaveServiceAdapter(),
    getInitialState: buildClassInitialState,
    getInitialCreateState: async (draftId: number, _userId: number, _context?: unknown) => {
        return {
            classId: draftId,
            name: '',
            abbreviation: '',
            editionId: 1,
            isPrestige: false,
            isVisible: true,
            canCastSpells: false,
            spellsKnown: false,
            isDivine: false,
            description: null,
            sourceBookInfo: null,
            featureIds: [],
            spellcastingProgression: [],
            spellsKnownProgression: [],
        };
    },
});

draftRegistry.set(DraftType.Race, {
    editStateSchema: RaceDraftStateSchema,
    saveService: new RaceSaveServiceAdapter(),
    getInitialState: buildRaceInitialState,
    getInitialCreateState: async (draftId: number, _userId: number, _context?: unknown) => {
        return {
            raceId: draftId,
            name: '',
            editionId: 1,
            isVisible: true,
            description: null,
            sourceBookInfo: null,
            featureIds: [],
        };
    },
});

draftRegistry.set(DraftType.Feature, {
    editStateSchema: FeatureDraftStateSchema,
    saveService: new FeatureSaveServiceAdapter(),
    getInitialState: buildFeatureInitialState,
    getInitialCreateState: async (draftId: number, _userId: number, _context?: unknown) => {
        return {
            id: draftId,
            slug: '',
            name: '',
            description: '',
            summary: null,
            displayInCharacterSheet: true,
            sourceType: FeatureSourceType.None,
            level: 1,
            domainId: null,
            featId: null,
            companionId: null,
            editionId: null,
            prerequisites: [],
            entities: [],
            displayConditions: [],
            classes: [],
            races: [],
        };
    },
});

async function buildAdvancementInitialState(advancementId: number): Promise<AdvancementEditState> {
    const advancement = await prisma.characterAdvancement.findUnique({
        where: { id: advancementId },
        include: {
            skills: true,
            feats: true,
            spellsKnown: true,
            featureChoices: true,
        },
    });

    if (!advancement) {
        throw new Error(`Advancement ${advancementId} not found`);
    }

    return {
        advancementId: advancement.id,
        characterId: advancement.characterId,
        level: advancement.level,
        version: advancement.version,
        classId: advancement.classId,
        secondaryClassId: advancement.secondaryClassId ?? null,
        hitPoints: advancement.hitPoints,
        abilityId: advancement.abilityId ?? null,
        notes: advancement.notes ?? null,
        skills: advancement.skills.map((s) => ({
            skillId: s.skillId,
            skillSubId: s.skillSubId ?? null,
            pointsSpent: s.pointsSpent,
            customSubtype: s.customSubtype ?? null,
        })),
        feats: advancement.feats.map((f) => ({
            featId: f.featId,
            featSubId: f.featSubId ?? null,
        })),
        spellsKnown: advancement.spellsKnown.map((s) => ({
            spellId: s.spellId,
            isFreeGrant: s.isFreeGrant ?? false,
        })),
        featureChoices: advancement.featureChoices.map((c) => ({
            id: c.id,
            characterId: c.characterId,
            featureId: c.featureId,
            advancementId: c.advancementId,
            featureEntityId: c.featureEntityId,
            appliesToId: c.appliesToId,
            appliesToSubId: c.appliesToSubId ?? null,
            choiceIndex: c.choiceIndex ?? null,
            choiceGroupId: c.choiceGroupId ?? null,
            choiceData: c.choiceData ?? null,
            linkedChoiceGroupId: c.linkedChoiceGroupId ?? null,
        })),
    };
}

draftRegistry.set(DraftType.Advancement, {
    editStateSchema: AdvancementEditStateSchema,
    saveService: new AdvancementSaveServiceAdapter(),
    getInitialState: buildAdvancementInitialState,
    getInitialCreateState: async (draftId: number, _userId: number, context?: unknown) => {
        // Context is required for new advancement drafts (create / level-up).
        if (!context || typeof context !== 'object') {
            throw new Error('Advancement draft requires context: { characterId, level, mode }');
        }

        const maybe = context as { characterId?: unknown; level?: unknown; mode?: unknown };
        const characterId = typeof maybe.characterId === 'number' ? maybe.characterId : NaN;
        const level = typeof maybe.level === 'number' ? maybe.level : NaN;
        const mode = typeof maybe.mode === 'string' ? maybe.mode : 'unknown';

        if (Number.isNaN(characterId) || Number.isNaN(level)) {
            throw new Error('Advancement draft context must include numeric characterId and level');
        }

        if (mode === 'edit-current') {
            // For persisted characters, edit-current should startEditing using the persisted advancementId.
            // Frontend should use UserCharacter.currentAdvancementId for this.
            // TODO(retrain): consider allowing id=0 + mode=edit-current to resolve to currentAdvancementId server-side.
            throw new Error('Advancement edit-current requires startEditing with a persisted advancement id');
        }

        return {
            advancementId: draftId,
            characterId,
            level,
            version: 1,
            classId: 0,
            secondaryClassId: null,
            hitPoints: 0,
            abilityId: null,
            notes: null,
            skills: [],
            feats: [],
            spellsKnown: [],
            featureChoices: [],
        };
    },
    onStateUpdate: async (_id, state, _userId, _update) => {
        characterResolutionProjectionService.scheduleFromAdvancementDraft(state as AdvancementEditState);
    },
});

// Helper function to build initial character state
async function buildCharacterInitialState(characterId: number): Promise<CharacterEditState> {
    const character = await characterService.getCharacterWithAllDetails({ id: characterId });
    if (!character) {
        throw new Error(`Character ${characterId} not found`);
    }
    const targetLevel = character.advancements?.length || 1;
    const isGestalt = character.advancements?.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0) || false;
    return buildCharacterEditState(character, targetLevel, isGestalt);
}

type CharacterAdvancementWithDetails = NonNullable<CharacterWithAllDetailsResponse['advancements']>[number];

function selectEffectiveAdvancements(
    advancements: CharacterWithAllDetailsResponse['advancements'] | undefined
): CharacterAdvancementWithDetails[] {
    if (!advancements || advancements.length === 0) {
        return [];
    }

    const byLevel = new Map<number, CharacterAdvancementWithDetails>();
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

/** Compute ResolvedCharacterResult from characterId and edit state. Used by triggerCharacterResolution and resolveCharacterToResult. */
async function computeResolvedCharacterResult(characterId: number, characterState: CharacterEditState): Promise<ResolvedCharacterResult> {
    const character = await characterService.getCharacterWithAllDetails({ id: characterId });
    if (!character) {
        throw new Error(`Character ${characterId} not found`);
    }
    const effectiveAdvancements = selectEffectiveAdvancements(character.advancements);
    const effectiveCharacter = {
        ...character,
        advancements: effectiveAdvancements,
    };

    const raceDetails = characterState.raceId ? await raceService.getRaceById({ id: characterState.raceId }) : null;
    const classDetails = characterState.classId ? await classService.getClassById({ id: characterState.classId }) : null;
    const secondaryClassDetails = characterState.secondaryClassId ? await classService.getClassById({ id: characterState.secondaryClassId }) : null;
    const userChoices: Record<number, number[]> = {};

    const context = {
        character: effectiveCharacter,
        targetLevel: characterState.level,
        advancement: effectiveAdvancements.find(adv => adv.level === characterState.level),
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
    if (effectiveAdvancements.length > 0) {
        for (const adv of effectiveAdvancements) {
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

    if (characterState.isGestalt || effectiveAdvancements.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0)) {
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

/**
 * Resolve a character to ResolvedCharacterResult (read-only, no lock/session).
 * Used by GET /characters/:id/resolve for admin character explorer.
 */
export async function resolveCharacterToResult(characterId: number): Promise<ResolvedCharacterResult> {
    const state = await buildCharacterInitialState(characterId);
    return computeResolvedCharacterResult(characterId, state);
}

// Character save service placeholder
class CharacterSaveServiceAdapter {
    private characterSaveService: CharacterSaveService;

    constructor() {
        this.characterSaveService = new CharacterSaveService();
    }

    async saveSessionToMySQL(characterId: number, state: unknown, userId: number, context?: unknown): Promise<number> {
        return await this.characterSaveService.saveSessionToMySQL(
            characterId,
            state as Record<string, unknown>,
            userId,
            context
        );
    }
}

// Register character configuration
draftRegistry.set(DraftType.Character, {
    editStateSchema: CharacterEditStateSchema,
    saveService: new CharacterSaveServiceAdapter(),
    getInitialState: buildCharacterInitialState,
    getInitialCreateState: async (draftId: number, _userId: number, _context?: unknown) => {
        return {
            characterId: draftId,
            name: '',
            abilityScores: [],
            skillRanks: [],
            raceId: null,
            classId: null,
            secondaryClassId: null,
            level: 1,
            editionId: EditionId.DND_3_5E,
            isGestalt: false,
            allowVariantClasses: false,
            ignoreLevelAdjustment: false,
            featureChoices: [],
            selectedFeats: [],
            disallowedSources: [],
        };
    },
    onStateUpdate: async (id, state, _userId, _update) => {
        characterResolutionProjectionService.scheduleFromCharacterDraft(id, state as CharacterEditState);
    },
});

/**
 * Get draft configuration for a given draft type.
 * 
 * @param draftType - The draft type (numeric enum value, e.g., DraftType.Class, DraftType.Feature)
 * @returns The draft configuration
 * @throws Error if draft type is not registered
 */
export function getDraftConfig<TState = unknown>(draftType: DraftType): DraftConfig<TState> {
    const config = draftRegistry.get(draftType);
    if (!config) {
        throw new Error(`Unknown draft type: ${draftType}`);
    }
    return config as DraftConfig<TState>;
}

/**
 * Check if a draft type is valid (registered in the registry).
 * 
 * @param draftType - The draft type (numeric enum value) to check
 * @returns True if the draft type is registered, false otherwise
 */
export function isValidDraftType(draftType: DraftType): boolean {
    return draftRegistry.has(draftType);
}

/**
 * Get all registered draft types.
 * 
 * @returns Array of registered draft type enum values
 */
export function getRegisteredDraftTypes(): DraftType[] {
    return Array.from(draftRegistry.keys());
}
