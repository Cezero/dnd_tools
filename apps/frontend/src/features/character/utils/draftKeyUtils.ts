/**
 * Create a deterministic negative 32-bit integer ID from a string key.
 *
 * This is used to generate stable draft-only IDs for nested draft collections (skills, feats, spellsKnown)
 * without requiring array-wide updates.
 *
 * Notes:
 * - Returns a negative int to avoid colliding with persisted DB IDs (typically positive).
 * - Uses 32-bit FNV-1a hashing for determinism across frontend/backend.
 */
export function createStableDraftRowId(key: string): number {
    // FNV-1a 32-bit
    let hash = 0x811c9dc5;
    for (let i = 0; i < key.length; i += 1) {
        hash ^= key.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    const signed = hash | 0;
    return signed === 0 ? -1 : -Math.abs(signed);
}

