import type { DiceThemeMap } from './types';

export const ThreeDDiceTheme = {
    DEFAULT: 1,
    ROCK: 2,
    DICE_OF_ROLLING: 3,
    BLUE_GREEN_METAL: 4,
    GEMSTONE: 5,
    RUST: 6,
    SMOOTH: 7,
    WOODEN: 8
} as const;

export type ThreeDDiceTheme = typeof ThreeDDiceTheme[keyof typeof ThreeDDiceTheme];

export const THREE_D_DICE_THEMES: DiceThemeMap = {
    [ThreeDDiceTheme.DEFAULT]: {
        id: ThreeDDiceTheme.DEFAULT,
        name: 'Default',
        systemName: 'default',
        description: 'Default dice theme with standard colors',
        ignoresThemeColor: false
    },
    [ThreeDDiceTheme.ROCK]: {
        id: ThreeDDiceTheme.ROCK,
        name: 'Rock',
        systemName: 'rock',
        description: 'Rock-textured dice with natural stone appearance',
        ignoresThemeColor: false
    },
    [ThreeDDiceTheme.DICE_OF_ROLLING]: {
        id: ThreeDDiceTheme.DICE_OF_ROLLING,
        name: 'Dice of Rolling',
        systemName: 'dice-of-rolling',
        description: 'Multicolored dice based on Dice of Rolling',
        ignoresThemeColor: true
    },
    [ThreeDDiceTheme.BLUE_GREEN_METAL]: {
        id: ThreeDDiceTheme.BLUE_GREEN_METAL,
        name: 'Blue Green Metal',
        systemName: 'blue-green-metal',
        description: 'Metallic dice with blue-green finish',
        ignoresThemeColor: true
    },
    [ThreeDDiceTheme.GEMSTONE]: {
        id: ThreeDDiceTheme.GEMSTONE,
        name: 'Gemstone',
        systemName: 'gemstone',
        description: 'Gemstone-textured dice with precious stone appearance',
        ignoresThemeColor: false
    },
    [ThreeDDiceTheme.RUST]: {
        id: ThreeDDiceTheme.RUST,
        name: 'Rust',
        systemName: 'rust',
        description: 'Weathered dice with rust texture',
        ignoresThemeColor: false
    },
    [ThreeDDiceTheme.SMOOTH]: {
        id: ThreeDDiceTheme.SMOOTH,
        name: 'Smooth',
        systemName: 'smooth',
        description: 'Smooth, polished dice with clean surfaces',
        ignoresThemeColor: false
    },
    [ThreeDDiceTheme.WOODEN]: {
        id: ThreeDDiceTheme.WOODEN,
        name: 'Wooden',
        systemName: 'wooden',
        description: 'Wooden-textured dice with natural grain',
        ignoresThemeColor: true
    }
};

export const THREE_D_DICE_THEME_LIST = Object.values(THREE_D_DICE_THEMES);

// Theme names array for API responses and dropdowns
export const THREE_D_DICE_THEME_NAMES: string[] = Object.values(THREE_D_DICE_THEMES).map(theme => theme.systemName);

