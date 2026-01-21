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
