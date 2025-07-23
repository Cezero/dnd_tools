/**
 * Utility functions for color manipulation
 */

/**
 * Brightens a hex color by the specified amount
 * @param color - Hex color string (e.g., "#ff0000")
 * @param amount - Amount to brighten (0-255)
 * @returns Brightened hex color string
 */
export function brightenColor(color: string, amount: number = 20): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Darkens a hex color by the specified amount
 * @param color - Hex color string (e.g., "#ff0000")
 * @param amount - Amount to darken (0-255)
 * @returns Darkened hex color string
 */
export function darkenColor(color: string, amount: number = 20): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 
