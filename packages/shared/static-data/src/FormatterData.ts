import { BaseMap, CoreComponent } from "./types";
import { NameSelectOptionList } from "./Util";

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
export const DISPLAY_TYPE_SELECT_LIST = NameSelectOptionList(DISPLAY_TYPE_LIST);

// Breakdown component type enum for calculation breakdowns
export const BreakdownComponentType = {
  Base: 1,
  Bonus: 2,
  Penalty: 3,
  Cap: 4,
  Replacement: 5,
} as const;

export type BreakdownComponentType = typeof BreakdownComponentType[keyof typeof BreakdownComponentType];

export const BREAKDOWN_COMPONENT_TYPES: BaseMap<CoreComponent> = {
  [BreakdownComponentType.Base]: { id: BreakdownComponentType.Base, name: 'Base' },
  [BreakdownComponentType.Bonus]: { id: BreakdownComponentType.Bonus, name: 'Bonus' },
  [BreakdownComponentType.Penalty]: { id: BreakdownComponentType.Penalty, name: 'Penalty' },
  [BreakdownComponentType.Cap]: { id: BreakdownComponentType.Cap, name: 'Cap' },
  [BreakdownComponentType.Replacement]: { id: BreakdownComponentType.Replacement, name: 'Replacement' },
};

export const BREAKDOWN_COMPONENT_TYPE_LIST = Object.values(BREAKDOWN_COMPONENT_TYPES);
export const BREAKDOWN_COMPONENT_TYPE_SELECT_LIST = NameSelectOptionList(BREAKDOWN_COMPONENT_TYPE_LIST);

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
export const TRANSITION_POINT_TYPE_SELECT_LIST = NameSelectOptionList(TRANSITION_POINT_TYPE_LIST);
