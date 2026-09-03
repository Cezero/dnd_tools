import type { CoreComponent, BaseMap } from './types';

/**
 * Handle Animal trained-trick slot caps by Intelligence (PHB).
 * Intelligence 3+ creatures are not trained with Handle Animal.
 */
export const HANDLE_ANIMAL_TRAINED_SLOTS_BY_INT: Readonly<Record<number, number>> = {
    1: 3,
    2: 6,
};

/** Extra Handle Animal DC for Int 1–2 creatures that are not Animals. */
export const HANDLE_ANIMAL_NON_ANIMAL_DC_ADJUSTMENT = 5;

/** A purpose whose package has more than this many tricks requires Int 2. */
export const HANDLE_ANIMAL_INT2_PURPOSE_TRICK_THRESHOLD = 3;

export const HandleAnimalTrickName = {
    Attack: 'Attack',
    Come: 'Come',
    Defend: 'Defend',
    Down: 'Down',
    Fetch: 'Fetch',
    Guard: 'Guard',
    Heel: 'Heel',
    Perform: 'Perform',
    Seek: 'Seek',
    Stay: 'Stay',
    Track: 'Track',
    Work: 'Work',
} as const;

export type HandleAnimalTrickName = typeof HandleAnimalTrickName[keyof typeof HandleAnimalTrickName];

export interface HandleAnimalPurposeDefinition {
    name: string;
    dc: number;
    trainingWeeks: number;
    trickNames: readonly HandleAnimalTrickName[];
    replacesPurposeName: string | null;
}

export const HandleAnimalPurposeName = {
    CombatRiding: 'Combat Riding',
    Fighting: 'Fighting',
    Guarding: 'Guarding',
    HeavyLabor: 'Heavy Labor',
    Hunting: 'Hunting',
    Performance: 'Performance',
    Riding: 'Riding',
} as const;

export type HandleAnimalPurposeName = typeof HandleAnimalPurposeName[keyof typeof HandleAnimalPurposeName];

/**
 * PHB general-purpose packages. Runtime resolves trick rows by name.
 * Combat Riding replaces Riding and wipes previously known tricks when applied over Riding.
 */
export const HANDLE_ANIMAL_PURPOSE_PACKAGES: readonly HandleAnimalPurposeDefinition[] = [
    {
        name: HandleAnimalPurposeName.CombatRiding,
        dc: 20,
        trainingWeeks: 3,
        trickNames: [
            HandleAnimalTrickName.Attack,
            HandleAnimalTrickName.Come,
            HandleAnimalTrickName.Defend,
            HandleAnimalTrickName.Down,
            HandleAnimalTrickName.Guard,
            HandleAnimalTrickName.Heel,
        ],
        replacesPurposeName: HandleAnimalPurposeName.Riding,
    },
    {
        name: HandleAnimalPurposeName.Fighting,
        dc: 20,
        trainingWeeks: 3,
        trickNames: [
            HandleAnimalTrickName.Attack,
            HandleAnimalTrickName.Down,
            HandleAnimalTrickName.Stay,
        ],
        replacesPurposeName: null,
    },
    {
        name: HandleAnimalPurposeName.Guarding,
        dc: 20,
        trainingWeeks: 4,
        trickNames: [
            HandleAnimalTrickName.Attack,
            HandleAnimalTrickName.Defend,
            HandleAnimalTrickName.Down,
            HandleAnimalTrickName.Guard,
        ],
        replacesPurposeName: null,
    },
    {
        name: HandleAnimalPurposeName.HeavyLabor,
        dc: 15,
        trainingWeeks: 2,
        trickNames: [
            HandleAnimalTrickName.Come,
            HandleAnimalTrickName.Down,
            HandleAnimalTrickName.Work,
        ],
        replacesPurposeName: null,
    },
    {
        name: HandleAnimalPurposeName.Hunting,
        dc: 20,
        trainingWeeks: 6,
        trickNames: [
            HandleAnimalTrickName.Attack,
            HandleAnimalTrickName.Down,
            HandleAnimalTrickName.Fetch,
            HandleAnimalTrickName.Heel,
            HandleAnimalTrickName.Seek,
            HandleAnimalTrickName.Track,
        ],
        replacesPurposeName: null,
    },
    {
        name: HandleAnimalPurposeName.Performance,
        dc: 15,
        trainingWeeks: 4,
        trickNames: [
            HandleAnimalTrickName.Come,
            HandleAnimalTrickName.Fetch,
            HandleAnimalTrickName.Heel,
            HandleAnimalTrickName.Perform,
            HandleAnimalTrickName.Stay,
        ],
        replacesPurposeName: null,
    },
    {
        name: HandleAnimalPurposeName.Riding,
        dc: 15,
        trainingWeeks: 3,
        trickNames: [
            HandleAnimalTrickName.Come,
            HandleAnimalTrickName.Down,
            HandleAnimalTrickName.Stay,
        ],
        replacesPurposeName: null,
    },
];

export const HANDLE_ANIMAL_PURPOSE_MAP: BaseMap<CoreComponent> = Object.fromEntries(
    HANDLE_ANIMAL_PURPOSE_PACKAGES.map((purpose, index) => [
        index + 1,
        { id: index + 1, name: purpose.name },
    ])
);

/**
 * Maximum Handle Animal trained slots for a creature's Intelligence score.
 * Returns 0 when Handle Animal does not apply (Int missing, ≤0, or ≥3).
 */
export function getHandleAnimalTrainedSlots(intelligence: number | null | undefined): number {
    if (intelligence === null || intelligence === undefined) {
        return 0;
    }
    const rounded = Math.floor(intelligence);
    if (rounded <= 0 || rounded >= 3) {
        return 0;
    }
    return HANDLE_ANIMAL_TRAINED_SLOTS_BY_INT[rounded] ?? 0;
}

/**
 * True when a creature of this Intelligence can be trained with Handle Animal.
 */
export function canUseHandleAnimal(intelligence: number | null | undefined): boolean {
    return getHandleAnimalTrainedSlots(intelligence) > 0;
}
