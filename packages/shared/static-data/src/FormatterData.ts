import { BaseMap, CoreComponent } from "./types";

// Display type enum for formatter context
export const DisplayType = {
    Detail: 1,
    Edit: 2,
    CharacterSheet: 3,
} as const;

export type DisplayType = typeof DisplayType[keyof typeof DisplayType];

export const DISPLAY_TYPES: BaseMap<CoreComponent> = {
    [DisplayType.Detail]: { id: DisplayType.Detail, name: 'Detail' },
    [DisplayType.Edit]: { id: DisplayType.Edit, name: 'Edit' },
    [DisplayType.CharacterSheet]: { id: DisplayType.CharacterSheet, name: 'Character Sheet' },
};

export const DISPLAY_TYPE_LIST = Object.values(DISPLAY_TYPES);

// Breakdown component type enum for calculation breakdowns
export const BreakdownComponentType = {
    base: 1,
    formula: 2,
    choice: 3,
    conditional: 4,
} as const;

export type BreakdownComponentType = typeof BreakdownComponentType[keyof typeof BreakdownComponentType];

export const BREAKDOWN_COMPONENT_TYPES: BaseMap<CoreComponent> = {
    [BreakdownComponentType.base]: { id: BreakdownComponentType.base, name: 'Base' },
    [BreakdownComponentType.formula]: { id: BreakdownComponentType.formula, name: 'Formula' },
    [BreakdownComponentType.choice]: { id: BreakdownComponentType.choice, name: 'Choice' },
    [BreakdownComponentType.conditional]: { id: BreakdownComponentType.conditional, name: 'Conditional' },
};

export const BREAKDOWN_COMPONENT_TYPE_LIST = Object.values(BREAKDOWN_COMPONENT_TYPES);

// Transition point type enum for progression transitions
export const TransitionPointType = {
    Addition: 1,
    Removal: 2,
    Change: 3,
} as const;

export type TransitionPointType = typeof TransitionPointType[keyof typeof TransitionPointType];

export const TRANSITION_POINT_TYPES: BaseMap<CoreComponent> = {
    [TransitionPointType.Addition]: { id: TransitionPointType.Addition, name: 'Addition' },
    [TransitionPointType.Removal]: { id: TransitionPointType.Removal, name: 'Removal' },
    [TransitionPointType.Change]: { id: TransitionPointType.Change, name: 'Change' },
};

export const TRANSITION_POINT_TYPE_LIST = Object.values(TRANSITION_POINT_TYPES);
