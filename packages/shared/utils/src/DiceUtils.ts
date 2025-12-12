import { THREE_D_DICE_THEMES, THREE_D_DICE_THEME_NAMES } from '@shared/static-data';

/**
 * Get dice theme by system name
 */
export function getDiceThemeBySystemName(systemName: string) {
    return Object.values(THREE_D_DICE_THEMES).find(theme => theme.systemName === systemName);
}

/**
 * Get dice theme by ID
 */
export function getDiceThemeById(id: number) {
    return Object.values(THREE_D_DICE_THEMES).find(theme => theme.id === id);
}

/**
 * Get system name by ID
 */
export function getSystemNameById(id: number): string | undefined {
    const theme = getDiceThemeById(id);
    return theme?.systemName;
}

/**
 * Check if dice theme is valid
 */
export function isDiceThemeValid(systemName: string): boolean {
    return THREE_D_DICE_THEME_NAMES.includes(systemName);
}

/**
 * Check if theme ignores color
 */
export function doesThemeIgnoreColor(systemName: string): boolean {
    const theme = getDiceThemeBySystemName(systemName);
    return theme?.ignoresThemeColor ?? false;
}
