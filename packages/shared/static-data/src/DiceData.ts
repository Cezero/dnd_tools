import type { DiceThemeMap, SelectOption } from './types';
import { NameSelectOptionList } from './Util';

export enum DiceTheme {
    DEFAULT = 1,
    ROCK = 2,
    DICE_OF_ROLLING = 3,
    BLUE_GREEN_METAL = 4,
    GEMSTONE = 5,
    RUST = 6,
    SMOOTH = 7,
    WOODEN = 8
}

export const DICE_THEMES: DiceThemeMap = {
    [DiceTheme.DEFAULT]: {
        id: DiceTheme.DEFAULT,
        name: 'Default',
        systemName: 'default',
        description: 'Default dice theme with standard colors',
        ignoresThemeColor: false
    },
    [DiceTheme.ROCK]: {
        id: DiceTheme.ROCK,
        name: 'Rock',
        systemName: 'rock',
        description: 'Rock-textured dice with natural stone appearance',
        ignoresThemeColor: false
    },
    [DiceTheme.DICE_OF_ROLLING]: {
        id: DiceTheme.DICE_OF_ROLLING,
        name: 'Dice of Rolling',
        systemName: 'dice-of-rolling',
        description: 'Multicolored dice based on Dice of Rolling',
        ignoresThemeColor: true
    },
    [DiceTheme.BLUE_GREEN_METAL]: {
        id: DiceTheme.BLUE_GREEN_METAL,
        name: 'Blue Green Metal',
        systemName: 'blue-green-metal',
        description: 'Metallic dice with blue-green finish',
        ignoresThemeColor: true
    },
    [DiceTheme.GEMSTONE]: {
        id: DiceTheme.GEMSTONE,
        name: 'Gemstone',
        systemName: 'gemstone',
        description: 'Gemstone-textured dice with precious stone appearance',
        ignoresThemeColor: false
    },
    [DiceTheme.RUST]: {
        id: DiceTheme.RUST,
        name: 'Rust',
        systemName: 'rust',
        description: 'Weathered dice with rust texture',
        ignoresThemeColor: false
    },
    [DiceTheme.SMOOTH]: {
        id: DiceTheme.SMOOTH,
        name: 'Smooth',
        systemName: 'smooth',
        description: 'Smooth, polished dice with clean surfaces',
        ignoresThemeColor: false
    },
    [DiceTheme.WOODEN]: {
        id: DiceTheme.WOODEN,
        name: 'Wooden',
        systemName: 'wooden',
        description: 'Wooden-textured dice with natural grain',
        ignoresThemeColor: true
    }
};

export const DICE_THEME_LIST = Object.values(DICE_THEMES);
export const DICE_THEME_SELECT_LIST = NameSelectOptionList(DICE_THEME_LIST);

// Theme names array for API responses and dropdowns
export const DICE_THEME_NAMES: string[] = Object.values(DICE_THEMES).map(theme => theme.systemName);

// Helper functions for theme data
export function getDiceThemeBySystemName(systemName: string) {
    return Object.values(DICE_THEMES).find(theme => theme.systemName === systemName);
}

export function getDiceThemeById(id: number) {
    return Object.values(DICE_THEMES).find(theme => theme.id === id);
}

export function getSystemNameById(id: number): string | undefined {
    const theme = getDiceThemeById(id);
    return theme?.systemName;
}

export function isDiceThemeValid(systemName: string): boolean {
    return DICE_THEME_NAMES.includes(systemName);
}

export function doesThemeIgnoreColor(systemName: string): boolean {
    const theme = getDiceThemeBySystemName(systemName);
    return theme?.ignoresThemeColor ?? false;
} 
