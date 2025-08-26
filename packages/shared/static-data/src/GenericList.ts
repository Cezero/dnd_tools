import { SelectOption } from "./types";

// Page limits for pagination
export const PAGE_LIMITS: SelectOption[] = [
    { value: 10, label: '10' },
    { value: 20, label: '20' },
    { value: 40, label: '40' },
    { value: 80, label: '80' },
    { value: 160, label: '160' }
];

// Filter types for generic list components
export const FilterType = {
    TEXT_INPUT: 1,
    SINGLE_SELECT: 2,
    MULTI_SELECT: 3,
    BOOLEAN: 4
} as const;

export type FilterType = typeof FilterType[keyof typeof FilterType];
