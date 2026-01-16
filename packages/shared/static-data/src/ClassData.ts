import type { BaseMap, ClassTypeMap, CoreComponent } from './types';

// Variant Class Override Types
export const OverrideType = {
    Replace: 0,
    Add: 1,
    Remove: 2,
    Modify: 3,
} as const;

export type OverrideType = typeof OverrideType[keyof typeof OverrideType];

export const OVERRIDE_TYPES: BaseMap<CoreComponent> = {
    [OverrideType.Replace]: { id: OverrideType.Replace, name: 'Replace' },
    [OverrideType.Add]: { id: OverrideType.Add, name: 'Add' },
    [OverrideType.Remove]: { id: OverrideType.Remove, name: 'Remove' },
    [OverrideType.Modify]: { id: OverrideType.Modify, name: 'Modify' },
};

export const OVERRIDE_TYPE_LIST = Object.values(OVERRIDE_TYPES);

// Variant Class Entity Override Types
export const EntityOverrideType = {
    Replace: 0,
    Add: 1,
    Remove: 2,
} as const;

export type EntityOverrideType = typeof EntityOverrideType[keyof typeof EntityOverrideType];

export const ENTITY_OVERRIDE_TYPES: BaseMap<CoreComponent> = {
    [EntityOverrideType.Replace]: { id: EntityOverrideType.Replace, name: 'Replace' },
    [EntityOverrideType.Add]: { id: EntityOverrideType.Add, name: 'Add' },
    [EntityOverrideType.Remove]: { id: EntityOverrideType.Remove, name: 'Remove' },
};

export const ENTITY_OVERRIDE_TYPE_LIST = Object.values(ENTITY_OVERRIDE_TYPES);


export const ClassType = {
    BASE: 0,
    VARIANT: 1,
} as const;

export type ClassType = typeof ClassType[keyof typeof ClassType];

export const CLASS_TYPE_MAP: ClassTypeMap = {
    [ClassType.BASE]: { id: ClassType.BASE, name: 'Base' },
    [ClassType.VARIANT]: { id: ClassType.VARIANT, name: 'Variant' },
};

export const CLASS_TYPE_LIST = Object.values(CLASS_TYPE_MAP);

/**
 * Starting gold dice notation mapping by class name
 * 
 * Based on D&D 3.5e Player's Handbook Table 4-1: Starting Gold.
 * This table maps normalized class names (lowercase) to dice notation strings
 * that define how much starting gold a character of that class receives.
 * 
 * Format: "XdY × Z" where XdY is the dice roll and Z is the multiplier (optional).
 * Example: "4d4 × 10" means roll 4d4 and multiply by 10.
 * 
 * Special case: "monk" has no multiplier (just "5d4").
 * 
 * @see startingGold.ts - Frontend hook that uses this table
 */
export const STARTING_GOLD_TABLE: Record<string, string> = {
    'barbarian': '4d4 × 10',
    'paladin': '6d4 × 10',
    'bard': '4d4 × 10',
    'ranger': '6d4 × 10',
    'cleric': '5d4 × 10',
    'rogue': '5d4 × 10',
    'druid': '2d4 × 10',
    'sorcerer': '3d4 × 10',
    'fighter': '6d4 × 10',
    'wizard': '3d4 × 10',
    'monk': '5d4', // Note: no × 10 multiplier
};
