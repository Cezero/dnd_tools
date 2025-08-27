/**
 * Color Scheme Generator for Dice
 * 
 * Generates complete dice color schemes from a single base color using:
 * - HSL color space for intuitive manipulation
 * - WCAG contrast ratios for accessibility
 * - Color theory principles for harmonious schemes
 */

import type { DiceColor } from '@/components/dice-box/types';

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number): string => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculate relative luminance (for contrast calculations)
 */
function getLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if a color is considered "dark" (low luminance)
 */
function isDarkColor(hex: string): boolean {
    const luminance = getLuminance(hex);
    const threshold = 0.4; // More intuitive threshold - colors above 40% luminance are "light"
    return luminance < threshold;
}

/**
 * Generate a contrasting color (light or dark based on input)
 */
function generateContrastingColor(baseColor: string, _targetContrast: number = 4.5): string {
    const _baseLuminance = getLuminance(baseColor);
    const isBaseDark = isDarkColor(baseColor);
    const baseHsl = hexToHsl(baseColor);

    if (isBaseDark) {
        // For dark backgrounds: create a light version of the same color
        const contrastingColor = hslToHex(
            baseHsl.h, // Same hue as base color
            Math.max(0, baseHsl.s - 10), // Slightly less saturated
            Math.max(85, 100 - baseHsl.l) // Light version of the same color
        );

        return contrastingColor;
    } else {
        // For light backgrounds: create a dark version of the same color
        const contrastingColor = hslToHex(
            baseHsl.h, // Same hue as base color
            Math.min(100, baseHsl.s + 20), // Slightly more saturated for visibility
            Math.max(15, baseHsl.l - 60) // Dark version of the same color
        );

        return contrastingColor;
    }
}

/**
 * Generate hover color based on base color
 */
function generateHoverColor(baseColor: string): string {
    const hsl = hexToHsl(baseColor);
    const isBaseDark = isDarkColor(baseColor);

    if (isBaseDark) {
        // For dark colors: brighten and slightly desaturate
        return hslToHex(
            hsl.h,
            Math.max(0, hsl.s - 10),
            Math.min(100, hsl.l + 15) // Reduced from 20 to 15
        );
    } else {
        // For light colors: darken and slightly saturate
        return hslToHex(
            hsl.h,
            Math.min(100, hsl.s + 10),
            Math.max(0, hsl.l - 15) // Reduced from 20 to 15
        );
    }
}

/**
 * Generate edges color based on base color (less contrast than numbers)
 */
function generateEdgesColor(baseColor: string): string {
    const hsl = hexToHsl(baseColor);
    const isBaseDark = isDarkColor(baseColor);

    if (isBaseDark) {
        // For dark colors: make edges lighter but with much less contrast than numbers
        const edgesColor = hslToHex(
            hsl.h,
            Math.max(0, hsl.s - 30),
            Math.min(100, hsl.l + 20) // Reduced from 25 to 20
        );
        return edgesColor;
    } else {
        // For light colors: make edges darker but with much less contrast than numbers
        // Ensure minimum darkness for visibility on white backgrounds
        const minLightness = hsl.l > 90 ? 25 : Math.max(0, hsl.l - 15); // Reduced from 20 to 15
        const edgesColor = hslToHex(
            hsl.h,
            Math.min(100, hsl.s + 30),
            minLightness
        );
        return edgesColor;
    }
}

/**
 * Generate stroke color (white for dark bases, black for light bases)
 */
function generateStrokeColor(baseColor: string): string {
    const isDark = isDarkColor(baseColor);
    return isDark ? '#ffffff' : '#000000';
}

/**
 * Generate disabled color based on base color
 */
function generateDisabledColor(baseColor: string): string {
    const hsl = hexToHsl(baseColor);

    // Desaturate and slightly adjust lightness for disabled state
    return hslToHex(
        hsl.h,
        Math.max(0, hsl.s - 20), // Reduced from 30 to 20
        Math.min(100, hsl.l + 5) // Reduced from 10 to 5
    );
}

/**
 * Generate a complete dice color scheme from a single base color
 */
export function generateDiceColorScheme(baseColor: string): {
    default: DiceColor;
    hover: DiceColor;
    disabled: DiceColor;
} {
    // Validate hex color
    if (!/^#[0-9A-F]{6}$/i.test(baseColor)) {
        throw new Error('Invalid hex color format. Expected #RRGGBB');
    }

    // Generate colors based on the original base color
    const main = baseColor;
    const edges = generateEdgesColor(baseColor); // Always based on original base color
    const numbers = generateContrastingColor(baseColor, 7.0); // Always based on original base color
    const strokeColor = generateStrokeColor(baseColor); // Always based on original base color

    // Generate hover state (only main color changes, edges/numbers stay consistent)
    const hoverMain = generateHoverColor(baseColor);
    const hoverStrokeColor = generateStrokeColor(hoverMain); // Stroke based on hover main color

    // Generate disabled state (only main color changes, edges/numbers stay consistent)
    const disabledMain = generateDisabledColor(baseColor);
    const disabledStrokeColor = generateStrokeColor(disabledMain); // Stroke based on disabled main color

    return {
        default: {
            main,
            edges,
            numbers,
            edgesStrokeWidth: 2,
            edgesStrokeColor: strokeColor,
            numbersStrokeWidth: 2,
            numbersStrokeColor: strokeColor
        },
        hover: {
            main: hoverMain,
            edges, // Same as default - based on original base color
            numbers, // Same as default - based on original base color
            edgesStrokeWidth: 2,
            edgesStrokeColor: hoverStrokeColor,
            numbersStrokeWidth: 2,
            numbersStrokeColor: hoverStrokeColor
        },
        disabled: {
            main: disabledMain,
            edges, // Same as default - based on original base color
            numbers, // Same as default - based on original base color
            edgesStrokeWidth: 2,
            edgesStrokeColor: disabledStrokeColor,
            numbersStrokeWidth: 2,
            numbersStrokeColor: disabledStrokeColor
        }
    };
}

/**
 * Generate a simple contrasting color for text/numbers
 */
export function getContrastingTextColor(backgroundColor: string): string {
    return isDarkColor(backgroundColor) ? '#ffffff' : '#000000';
}

/**
 * Utility to check if two colors have sufficient contrast
 */
export function hasSufficientContrast(color1: string, color2: string, minRatio: number = 4.5): boolean {
    return getContrastRatio(color1, color2) >= minRatio;
} 
