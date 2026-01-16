export const SourceType = {
    Core: 0,
    Classes: 1,
    Spells: 2,
    Races: 3,
    Domains: 4,
    Deities: 5,
    Items: 6,
    All: 7,
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];
