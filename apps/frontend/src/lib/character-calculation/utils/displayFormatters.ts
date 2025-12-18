import { formatDamageType } from '@/lib/attack-calculation/utils';
import { SIZE_MAP } from '@shared/static-data';

/**
 * Format attack bonus for display
 * Returns "X (Y nonlethal)" if nonlethal differs, otherwise just the number
 */
export function formatAttackBonus(
    lethalBonus: number,
    nonlethalBonus?: number
): number | string {
    if (nonlethalBonus !== undefined && nonlethalBonus !== lethalBonus) {
        const lethalSign = lethalBonus >= 0 ? '+' : '';
        const nonlethalSign = nonlethalBonus >= 0 ? '+' : '';
        return `${lethalSign}${lethalBonus} (${nonlethalSign}${nonlethalBonus} nonlethal)`;
    }
    return lethalBonus;
}

/**
 * Format weight for display
 * Returns "X lb." or null if weight is not available
 * Handles both number and Decimal (Prisma) types
 */
export function formatWeight(weight: number | { toString(): string } | null | undefined): string | null {
    if (weight === null || weight === undefined) {
        return null;
    }
    return `${weight.toString()} lb.`;
}

/**
 * Format size for display
 * Returns size name from SIZE_MAP or 'Medium' as default
 */
export function formatSize(sizeId: number | null | undefined): string | null {
    if (sizeId === null || sizeId === undefined) {
        return null;
    }
    return SIZE_MAP[sizeId as keyof typeof SIZE_MAP]?.name ?? 'Medium';
}

/**
 * Format damage type for display
 * Re-exported from attack-calculation/utils for convenience
 */
export { formatDamageType };

/**
 * Get unarmed strike damage type (always bludgeoning)
 */
export function getUnarmedDamageType(): string {
    return formatDamageType('1');
}

