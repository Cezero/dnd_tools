import { generateDiceColorScheme } from '@/utils/color-scheme';

import type { DiceColor } from './types';

/**
 * Base color for dice - this is the single source of truth
 * Change this color to generate a complete new color scheme
 */
const DICE_BASE_COLOR = '#292c94'; // Blue-purple color

/**
 * Generate complete color scheme from base color
 */
const COLOR_SCHEME = generateDiceColorScheme(DICE_BASE_COLOR);

/**
 * Default dice colors - automatically generated from base color
 */
export const DEFAULT_DICE_COLORS: DiceColor = COLOR_SCHEME.default;

/**
 * Hover state colors - automatically generated from base color
 */
export const HOVER_DICE_COLORS: DiceColor = COLOR_SCHEME.hover;

/**
 * Disabled state colors - automatically generated from base color
 */
export const DISABLED_DICE_COLORS: DiceColor = COLOR_SCHEME.disabled;

/**
 * Utility function to change the base color and regenerate the scheme
 * Usage: updateDiceBaseColor('#ff0000') for red dice
 */
export function updateDiceBaseColor(newBaseColor: string): void {
    const newScheme = generateDiceColorScheme(newBaseColor);

    // Update the exported constants
    Object.assign(DEFAULT_DICE_COLORS, newScheme.default);
    Object.assign(HOVER_DICE_COLORS, newScheme.hover);
    Object.assign(DISABLED_DICE_COLORS, newScheme.disabled);
}

/**
 * Get the current base color
 */
export function getDiceBaseColor(): string {
    return DICE_BASE_COLOR;
} 
