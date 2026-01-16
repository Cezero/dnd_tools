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

/**
 * Calculation method type enum for formatter system breakdown components.
 * 
 * This enum represents **HOW** a value is calculated or determined in the feature system,
 * NOT what the source of the value is. It categorizes the method by which a breakdown
 * component's value was derived.
 * 
 * **Important Distinction:**
 * - This enum (`CalculationMethodType`) represents the **calculation method** (HOW)
 * - `BreakdownSourceType` in the character-calculation system represents the **source** (WHAT)
 * 
 * **Values:**
 * - `base`: Base values in formulas (e.g., base value parameter, level values)
 * - `formula`: Formula-based calculations (e.g., ability modifiers used in formulas, formula results)
 * - `choice`: Choice-based values (e.g., feats, features, items - things the player chooses)
 * - `conditional`: Conditional values that depend on specific conditions being met
 * 
 * **Usage:**
 * Used in the formatter system's `BreakdownComponent` interface to categorize how each
 * component in a calculation breakdown was determined. This helps the formatting system
 * display and group breakdown components appropriately.
 * 
 * **Mapping from Character Calculation System:**
 * When converting from character-calculation system's `BreakdownSourceType` to this enum,
 * use the following mapping (see `characterSheetDisplayStrategy.ts`):
 * - `'ability'` → `formula` (ability modifiers are used in formulas)
 * - `'feat'` → `choice` (feats are player choices)
 * - `'feature'` → `choice` (features are player choices)
 * - `'item'` → `choice` (items are player choices)
 * - `'base'` → `base` (base values)
 * - `'penalty'` → `base` (penalties are base adjustments)
 * 
 * @see {@link BreakdownSourceType} in `@/lib/character-calculation/types` for the source type system
 * @see {@link BreakdownComponent} in `@/lib/formatters/types` for usage in breakdown components
 */
export const CalculationMethodType = {
    base: 1,
    formula: 2,
    choice: 3,
    conditional: 4,
} as const;

export type CalculationMethodType = typeof CalculationMethodType[keyof typeof CalculationMethodType];

export const CALCULATION_METHOD_TYPES: BaseMap<CoreComponent> = {
    [CalculationMethodType.base]: { id: CalculationMethodType.base, name: 'Base' },
    [CalculationMethodType.formula]: { id: CalculationMethodType.formula, name: 'Formula' },
    [CalculationMethodType.choice]: { id: CalculationMethodType.choice, name: 'Choice' },
    [CalculationMethodType.conditional]: { id: CalculationMethodType.conditional, name: 'Conditional' },
};

export const CALCULATION_METHOD_TYPE_LIST = Object.values(CALCULATION_METHOD_TYPES);

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
