import { CoreComponent } from "./types";

// Page limits for pagination
export const PAGE_LIMITS: CoreComponent[] = [
    { id: 10, name: '10' },
    { id: 20, name: '20' },
    { id: 40, name: '40' },
    { id: 80, name: '80' },
    { id: 160, name: '160' }
];

// Filter types for generic list components
export const FilterType = {
    TEXT_INPUT: 1,
    SINGLE_SELECT: 2,
    MULTI_SELECT: 3,
    BOOLEAN: 4
} as const;

export type FilterType = typeof FilterType[keyof typeof FilterType];
