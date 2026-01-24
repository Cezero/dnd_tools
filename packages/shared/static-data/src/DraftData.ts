import { BaseMap, CoreComponent } from './types';

/**
 * Numeric enum for draft types.
 * 
 * Drafts are transient editing states stored in Redis that represent
 * entities being edited (classes, races, features, characters, etc.).
 * 
 * Uses numeric enum values to avoid string comparisons and maintain consistency
 * with the rest of the codebase.
 * 
 * @example
 * ```typescript
 * import { DraftType } from '@shared/static-data';
 * 
 * // Use in API calls
 * await DraftApi.startEditing(DraftType.Class, 123);
 * await DraftApi.startEditing(DraftType.Feature, 456);
 * ```
 */
export const DraftType = {
    Class: 1,
    Race: 2,
    Feature: 3,
    Character: 4,
    Advancement: 5,
} as const;

export type DraftType = typeof DraftType[keyof typeof DraftType];

/**
 * DraftAction controls how updateValue applies a scalar value at a path.
 *
 * - Update: set/overwrite a value at the path (default)
 * - Remove: remove a value (delete key / remove element)
 * - Add: add a value (append to array, or create missing path)
 *
 * This is a numeric enum to match existing DraftType patterns.
 */
export const DraftAction = {
    Update: 0,
    Remove: 1,
    Add: 2,
} as const;

export type DraftAction = typeof DraftAction[keyof typeof DraftAction];

/**
 * Map of array field names (or field paths) to the key field used by `byId.<value>` selectors.
 *
 * Default key field is `id`. Use this map only when the stable unique key is named differently.
 *
 * Examples:
 * - `sourceBookInfo[]` elements are `SourceMap` objects keyed by `sourceBookId` (unique per parent object).
 */
export const DRAFT_ARRAY_SELECTOR_KEY_FIELD_MAP: Record<string, string> = {
    sourceBookInfo: 'sourceBookId',
};

/**
 * Map from draft type ID to CoreComponent (for admin tools and display).
 * 
 * Follows the standard BaseMap<CoreComponent> pattern used throughout static-data.
 */
export const DRAFT_TYPE_MAP: BaseMap<CoreComponent> = {
    [DraftType.Class]: { id: DraftType.Class, name: 'Class' },
    [DraftType.Race]: { id: DraftType.Race, name: 'Race' },
    [DraftType.Feature]: { id: DraftType.Feature, name: 'Feature' },
    [DraftType.Character]: { id: DraftType.Character, name: 'Character' },
    [DraftType.Advancement]: { id: DraftType.Advancement, name: 'Advancement' },
};

/**
 * Array of all draft type components.
 * Useful for validation, iteration, and admin tools.
 */
export const DRAFT_TYPE_LIST = Object.values(DRAFT_TYPE_MAP);

/**
 * Map from string name to draft type ID.
 * Used for converting string identifiers (from API paths, Redis keys) to numeric enum values.
 */
export const DRAFT_TYPE_NAME_TO_ID_MAP: Record<string, DraftType> = {
    'class': DraftType.Class,
    'race': DraftType.Race,
    'feature': DraftType.Feature,
    'character': DraftType.Character,
    'advancement': DraftType.Advancement,
};

/**
 * Map from draft type ID to string name.
 * Used for converting numeric enum values to string identifiers (for API paths, Redis keys).
 */
export const DRAFT_TYPE_ID_TO_NAME_MAP: Record<DraftType, string> = {
    [DraftType.Class]: 'class',
    [DraftType.Race]: 'race',
    [DraftType.Feature]: 'feature',
    [DraftType.Character]: 'character',
    [DraftType.Advancement]: 'advancement',
};

/**
 * Convert string name to draft type ID.
 * 
 * @param name - The string name (e.g., 'class', 'race', 'feature', 'character')
 * @returns The draft type ID, or undefined if invalid
 */
export function getDraftTypeIdFromName(name: string): DraftType | undefined {
    return DRAFT_TYPE_NAME_TO_ID_MAP[name];
}

/**
 * Convert draft type ID to string name.
 * 
 * @param draftType - The draft type ID
 * @returns The string name (e.g., 'class', 'race', 'feature', 'character')
 */
export function getDraftTypeNameFromId(draftType: DraftType): string {
    return DRAFT_TYPE_ID_TO_NAME_MAP[draftType];
}

/**
 * Type guard to check if a number is a valid draft type.
 * 
 * @param value - The value to check
 * @returns True if the value is a valid draft type
 */
export function isValidDraftType(value: number): value is DraftType {
    return value in DRAFT_TYPE_ID_TO_NAME_MAP;
}

/**
 * Numeric enum for class update operation types.
 * Used in discriminated unions for type-safe update operations.
 */
export const ClassUpdateType = {
    LinkFeature: 0,
    UnlinkFeature: 1,
    UpdateClassField: 2,
    SetSpellcastingProgression: 3,
    SetSpellsKnownProgression: 4,
} as const;

export type ClassUpdateType = typeof ClassUpdateType[keyof typeof ClassUpdateType];

/**
 * Numeric enum for race update operation types.
 * Used in discriminated unions for type-safe update operations.
 */
export const RaceUpdateType = {
    LinkFeature: 0,
    UnlinkFeature: 1,
    UpdateRaceField: 2,
} as const;

export type RaceUpdateType = typeof RaceUpdateType[keyof typeof RaceUpdateType];

/**
 * Numeric enum for feature update operation types.
 * Used in discriminated unions for type-safe update operations.
 */
export const FeatureUpdateType = {
    UpdateFeatureField: 0,
    AddEntity: 1,
    UpdateEntity: 2,
    RemoveEntity: 3,
    AddPrerequisite: 4,
    UpdatePrerequisite: 5,
    RemovePrerequisite: 6,
} as const;

export type FeatureUpdateType = typeof FeatureUpdateType[keyof typeof FeatureUpdateType];
