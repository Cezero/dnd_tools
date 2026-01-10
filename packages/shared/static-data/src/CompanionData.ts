import type { CoreComponent, BaseMap } from './types';

// Lighting condition values
export const LightingConditionType = {
    bright_light: 0,
    shadows: 1,
    dim_light: 2,
    darkness: 3,
} as const;

export type LightingConditionType = typeof LightingConditionType[keyof typeof LightingConditionType];

export const LIGHTING_CONDITION_TYPES: BaseMap<CoreComponent> = {
    [LightingConditionType.bright_light]: { id: LightingConditionType.bright_light, name: 'Bright Light' },
    [LightingConditionType.shadows]: { id: LightingConditionType.shadows, name: 'Shadows' },
    [LightingConditionType.dim_light]: { id: LightingConditionType.dim_light, name: 'Dim Light' },
    [LightingConditionType.darkness]: { id: LightingConditionType.darkness, name: 'Darkness' },
};

export const LIGHTING_CONDITION_LIST = Object.values(LIGHTING_CONDITION_TYPES);

