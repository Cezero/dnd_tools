/**
 * CHECKPOINT: Current Dice Colors (2024-12-19)
 * 
 * This file contains the current working color scheme for dice.
 * To restore this state, copy these constants back to constants.ts
 */

import type { DiceColor } from './types';

/**
 * Default dice colors that provide good contrast in both light and dark modes
 */
export const CHECKPOINT_DEFAULT_DICE_COLORS: DiceColor = {
    main: '#4b5563',    // gray-600 - Darker bluer gray for main
    edges: '#1f2937',   // gray-800 - Darker edges for definition
    numbers: '#e5e7eb', // gray-200 - Lighter but still readable numbers
    outline: '#374151'  // gray-700 - Darker outline
};

/**
 * Hover state colors - brighter main, darker edges for contrast
 */
export const CHECKPOINT_HOVER_DICE_COLORS: DiceColor = {
    main: '#6b7280',    // gray-500 - Brighter main on hover
    edges: '#111827',   // gray-900 - Darker edges for contrast
    numbers: '#f3f4f6', // gray-100 - Brighter numbers for readability
    outline: '#1f2937'  // gray-800 - Darker outline
};

/**
 * Disabled state colors - muted grays
 */
export const CHECKPOINT_DISABLED_DICE_COLORS: DiceColor = {
    main: '#6b7280',    // gray-500 - Muted main
    edges: '#4b5563',   // gray-600 - Muted edges
    numbers: '#9ca3af', // gray-400 - Muted numbers
    outline: '#4b5563'  // gray-600 - Muted outline
};

/**
 * CSS defaults that were in dice-icons.css
 */
export const CHECKPOINT_CSS_DEFAULTS = {
    main: '#4b5563',
    edges: '#1f2937',
    numbers: '#e5e7eb',
    outline: '#374151'
}; 
