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
