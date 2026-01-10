import type {
    CharacterWithAllDetailsResponse,
    CharacterAdvancementWithDetailsResponse,
    Race,
    DnDClass,
    FeatureProgression,
    CharacterFeatureChoice,
} from '@shared/schema';
import type { EntityAppliesToType } from '@shared/static-data';

/**
 * User choices map: appliesTo type -> array of selected IDs
 */
export interface UserChoices {
    [appliesToType: number]: number[];
}

/**
 * Resolution context for character feature resolution
 */
export interface ResolutionContext {
    character: CharacterWithAllDetailsResponse;
    targetLevel: number;
    advancement: CharacterAdvancementWithDetailsResponse | undefined;

    // Source details
    raceDetails?: Race | null;
    classDetails?: DnDClass | null;
    secondaryClassDetails?: DnDClass | null;
    effectiveClassDetails?: DnDClass | null;

    // Gestalt configuration
    isGestalt: boolean;

    // User choices (if already made)
    userChoices?: UserChoices;

    // Resolution options
    includePendingChoices: boolean;
    resolveCascading: boolean;
    maxResolutionDepth: number;
}

/**
 * Pending choice that requires user input
 */
export interface PendingChoice {
    id: string;
    type: EntityAppliesToType;
    name: string;
    description: string;
    source: string;
    level: number;
    required: boolean;
    maxSelections: number;
    minSelections: number;
    options: Array<{
        id: string;
        name: string;
        description: string;
        value: number;
    }>;
}

/**
 * Resolution result containing resolved features and pending choices
 */
export interface ResolutionResult {
    resolvedProgressions: FeatureProgression[];
    pendingChoices: PendingChoice[];
    warnings: string[];
    errors: string[];
}

/**
 * Character edit state stored in session
 */
export interface CharacterEditState {
    characterId: number;
    abilityScores: Array<{
        abilityId: number;
        value: number;
    }>;
    skillRanks: Array<{
        skillId: number;
        skillSubId: number | null;
        customSubtype: string | null;
        pointsSpent: number;
    }>;
    raceId: number | null;
    classId: number | null;
    secondaryClassId: number | null;
    level: number;
    editionId: number;
    isGestalt: boolean;
    allowVariantClasses: boolean;
    ignoreLevelAdjustment: boolean;
    featureChoices: CharacterFeatureChoice[];
    selectedFeats: number[];
    disallowedSources: Array<{
        sourceBookId: number;
    }>;
}

/**
 * Character update operation
 */
export type CharacterUpdate =
    | { type: 'SET_ABILITY_SCORE'; payload: { abilityId: number; value: number } }
    | { type: 'SET_SKILL_RANK'; payload: { skillId: number; skillSubId: number | null; customSubtype: string | null; pointsSpent: number } }
    | { type: 'SET_RACE'; payload: { raceId: number } }
    | { type: 'SET_CLASS'; payload: { classId: number } }
    | { type: 'SET_SECONDARY_CLASS'; payload: { secondaryClassId: number | null } }
    | { type: 'SET_LEVEL'; payload: { level: number } }
    | { type: 'MAKE_CHOICE'; payload: { progressionId: number; featureEntityId: number; appliesToId: number; appliesToSubId: number | null } }
    | { type: 'SET_FEAT'; payload: { featId: number; featSubId: number | null } }
    | { type: 'REMOVE_FEAT'; payload: { featId: number } }
    | { type: 'SET_DISALLOWED_SOURCE'; payload: { sourceBookId: number } }
    | { type: 'REMOVE_DISALLOWED_SOURCE'; payload: { sourceBookId: number } };










