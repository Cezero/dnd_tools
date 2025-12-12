import { EditionId } from '@shared/static-data';

/**
 * Check if a content item's edition matches a user's selected edition
 * Special handling: DND_3x matches both DND_3E and DND_3_5E
 * isVisible flag only applies for conflict resolution when user selects DND_3x
 */
export function isEditionCompatible(contentEditionId: number, userEditionId: number, isVisible: boolean = true): boolean {
    // Direct equality for specific editions - ignore isVisible flag
    if (contentEditionId === userEditionId) {
        return true;
    }

    // Special case: DND_3x matches both 3E and 3.5E, but use isVisible for conflict resolution
    if (userEditionId === EditionId.DND_3x) {
        return (contentEditionId === EditionId.DND_3E || contentEditionId === EditionId.DND_3_5E) && isVisible;
    }

    return false;
}

/**
 * Get all edition IDs that are compatible with a user's edition selection
 * Used for backend filtering with Prisma 'in' queries
 */
export function getCompatibleEditionIds(userEditionId: number): number[] {
    if (userEditionId === EditionId.DND_3x) {
        return [EditionId.DND_3E, EditionId.DND_3_5E];
    }
    return [userEditionId];
}

/**
 * Build Prisma where clause for edition filtering
 * Only applies isVisible filtering for DND_3x selection
 */
export function buildEditionWhereClause(userEditionId: number): { editionId: number | { in: number[] }, isVisible?: boolean } {
    const compatibleIds = getCompatibleEditionIds(userEditionId);

    if (compatibleIds.length === 1) {
        // Specific edition - ignore isVisible flag
        return { editionId: compatibleIds[0] };
    }

    // For DND_3x, include both editions but only visible items for conflict resolution
    return {
        editionId: { in: compatibleIds },
        isVisible: true
    };
}

/**
 * Check if an edition has the 3x compatibility (for UI display)
 */
export function is3xCompatibleEdition(editionId: number): boolean {
    return editionId === EditionId.DND_3E || editionId === EditionId.DND_3_5E || editionId === EditionId.DND_3x;
}
