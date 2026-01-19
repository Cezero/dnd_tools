/**
 * Numeric enum for class update operation types.
 * Used in discriminated unions for type-safe update operations.
 */
export const ClassUpdateType = {
    LinkProgression: 0,
    UnlinkProgression: 1,
    AddProgression: 2,
    UpdateProgression: 3,
    RemoveProgression: 4,
    AddEntity: 5,
    UpdateEntity: 6,
    RemoveEntity: 7,
    UpdateClassField: 8,
    SetSpellcastingProgression: 9,
    SetSpellsKnownProgression: 10,
} as const;

export type ClassUpdateType = typeof ClassUpdateType[keyof typeof ClassUpdateType];

/**
 * Numeric enum for race update operation types.
 * Used in discriminated unions for type-safe update operations.
 */
export const RaceUpdateType = {
    LinkProgression: 0,
    UnlinkProgression: 1,
    AddProgression: 2,
    UpdateProgression: 3,
    RemoveProgression: 4,
    AddEntity: 5,
    UpdateEntity: 6,
    RemoveEntity: 7,
    UpdateRaceField: 8,
} as const;

export type RaceUpdateType = typeof RaceUpdateType[keyof typeof RaceUpdateType];
