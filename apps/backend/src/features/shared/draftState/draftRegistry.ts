import { z } from 'zod';

import { ClassDraftStateSchema, FeatureDraftStateSchema, RaceDraftStateSchema } from '@shared/schema';
import type { ClassDraftState, FeatureDraftState, RaceDraftState, ResolvedCharacterResult, DnDClass, Race } from '@shared/schema';
import { DraftType, FeatureSourceType } from '@shared/static-data';

import { DraftStatePubSub } from './DraftStatePubSub';
import { characterService } from '../../character/characterService';
import { AvailableFeatService } from '../../characterResolution/availableFeatService';
import { buildCharacterEditState } from '../../characterResolution/characterEditStateBuilder';
import { calculateSpellSelection, filterInvalidAppliesToEntities } from '../../characterResolution/characterResolutionController';
import { CharacterResolutionService } from '../../characterResolution/characterResolutionService';
import { GestaltMechanicsResolver } from '../../characterResolution/gestaltMechanicsResolver';
import { ResolvedFeatureService } from '../../characterResolution/resolvedFeatureService';
import type { CharacterEditState } from '../../characterResolution/types';
import { classService } from '../../class/classService';
import { ClassSaveService } from '../../classResolution/classSaveService';
import { featService } from '../../feat/featService';
import { FeatureStateService } from '../../featureSystem/featureStateService';
import { featureSystemService, featureSystemService as _featureSystemService } from '../../featureSystem/featureSystemService';
import { raceService } from '../../race/raceService';
import { RaceSaveService } from '../../raceResolution/raceSaveService';

/**
 * Draft configuration interface for the draft registry.
 * Maps draft types to their schemas, save services, and initialization logic.
 */
export interface DraftConfig<TState = unknown> {
    /**
     * Zod schema for validating edit state.
     */
    editStateSchema: z.ZodSchema<TState>;

    /**
     * Save service that handles persisting state to the database.
     * Must have a saveSessionToMySQL method that takes (id: number, state: TState, userId: number) and returns Promise<number>.
     * Returns the draft ID (may be newly created for new drafts).
     */
    saveService: {
        saveSessionToMySQL(id: number, state: TState | Record<string, unknown>, userId: number): Promise<number>;
    };

    /**
     * Function that builds initial draft state from database record.
     * Accepts id, fetches record using existing service, and returns initial draft state.
     */
    getInitialState: (id: number) => Promise<TState>;

    /**
     * Function that builds initial draft state for new draft instances.
     * Called when the client requests `startEditing` with `id = 0` and the backend mints a new negative draft id.
     */
    getInitialCreateState: (draftId: number, userId: number) => Promise<TState>;

    /**
     * Optional callback that is called after state updates.
     * For character, this triggers resolution and WebSocket publish.
     */
    onStateUpdate?: (id: number, state: TState, userId: number) => Promise<void>;
}

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

    async saveSessionToMySQL(featureId: number, _state: FeatureDraftState | Record<string, unknown>, userId: number): Promise<number> {
        return await this.featureStateService.saveFeatureStateToDatabase(featureId, userId);
    }
}

// Wrapper for ClassSaveService to match the updated interface
class ClassSaveServiceAdapter {
    private classSaveService: ClassSaveService;

    constructor() {
        this.classSaveService = new ClassSaveService();
    }

    async saveSessionToMySQL(classId: number, state: ClassDraftState | Record<string, unknown>, userId: number): Promise<number> {
        return await this.classSaveService.saveSessionToMySQL(classId, state, userId);
    }
}

// Wrapper for RaceSaveService to match the updated interface
class RaceSaveServiceAdapter {
    private raceSaveService: RaceSaveService;

    constructor() {
        this.raceSaveService = new RaceSaveService();
    }

    async saveSessionToMySQL(raceId: number, state: RaceDraftState | Record<string, unknown>, userId: number): Promise<number> {
        return await this.raceSaveService.saveSessionToMySQL(raceId, state, userId);
    }
}

// Register draft configurations
draftRegistry.set(DraftType.Class, {
    editStateSchema: ClassDraftStateSchema,
    saveService: new ClassSaveServiceAdapter(),
    getInitialState: buildClassInitialState,
    getInitialCreateState: async (draftId: number) => {
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
    getInitialCreateState: async (draftId: number) => {
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
    getInitialCreateState: async (draftId: number) => {
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

/** Compute ResolvedCharacterResult from characterId and edit state. Used by triggerCharacterResolution and resolveCharacterToResult. */
async function computeResolvedCharacterResult(characterId: number, characterState: CharacterEditState): Promise<ResolvedCharacterResult> {
    const character = await characterService.getCharacterWithAllDetails({ id: characterId });
    if (!character) {
        throw new Error(`Character ${characterId} not found`);
    }

    const raceDetails = characterState.raceId ? await raceService.getRaceById({ id: characterState.raceId }) : null;
    const classDetails = characterState.classId ? await classService.getClassById({ id: characterState.classId }) : null;
    const secondaryClassDetails = characterState.secondaryClassId ? await classService.getClassById({ id: characterState.secondaryClassId }) : null;
    const userChoices: Record<number, number[]> = {};

    const context = {
        character,
        targetLevel: characterState.level,
        advancement: character.advancements?.find(adv => adv.level === characterState.level),
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
        character,
        characterState.level,
        context
    );

    const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
    const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
    const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

    const classLevels = new Map<number, number>();
    if (character.advancements) {
        for (const adv of character.advancements) {
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
        character,
        resolutionResult.resolvedProgressions,
        classDetails,
        raceDetails,
        allFeatsResponse.results
    );

    const spellSelection = await calculateSpellSelection(
        characterId,
        character,
        resolutionResult.resolvedProgressions
    );

    let enrichedProgressions = resolutionResult.resolvedProgressions;
    enrichedProgressions = filterInvalidAppliesToEntities(enrichedProgressions);

    let resolvedFormulaValues = ResolvedFeatureService.resolveFormulaValues(
        enrichedProgressions,
        character,
        characterState.level
    );

    if (characterState.isGestalt || character.advancements?.some(adv => adv.secondaryClassId !== null && adv.secondaryClassId !== 0)) {
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
 * Resolve a character to ResolvedCharacterResult (read-only, no lock/session).
 * Used by GET /characters/:id/resolve for admin character explorer.
 */
export async function resolveCharacterToResult(characterId: number): Promise<ResolvedCharacterResult> {
    const state = await buildCharacterInitialState(characterId);
    return computeResolvedCharacterResult(characterId, state);
}

// Helper function to trigger character resolution and publish via WebSocket
async function triggerCharacterResolution(characterId: number, state: unknown, _userId: number): Promise<void> {
    const characterState = state as CharacterEditState;
    try {
        const resolvedCharacterResult = await computeResolvedCharacterResult(characterId, characterState);
        const pubSub = new DraftStatePubSub();
        await pubSub.initialize();
        await pubSub.publish(DraftType.Character, characterId, {
            type: 'characterResolution',
            resolvedCharacter: resolvedCharacterResult,
        });
    } catch (error) {
        console.error(`Error triggering character resolution for character ${characterId}:`, error);
    }
}

// Character save service placeholder
class CharacterSaveServiceAdapter {
    async saveSessionToMySQL(characterId: number, _state: unknown, _userId: number): Promise<number> {
        // TODO: Implement character save service
        // For now, just return the characterId
        console.warn('Character save service not yet implemented - returning characterId without saving');
        return characterId;
    }
}

// Register character configuration
draftRegistry.set(DraftType.Character, {
    editStateSchema: z.any() as z.ZodSchema<CharacterEditState>, // TODO: Create CharacterEditStateSchema
    saveService: new CharacterSaveServiceAdapter(),
    getInitialState: buildCharacterInitialState,
    getInitialCreateState: async () => {
        throw new Error('DraftType.Character does not support startEditing(id=0) at this time.');
    },
    onStateUpdate: triggerCharacterResolution,
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
