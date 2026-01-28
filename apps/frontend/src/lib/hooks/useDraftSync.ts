import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useRef } from 'react';

import type { DraftAction } from '@shared/static-data';

/**
 * Configuration for the useDraftSync hook.
 */
interface UseDraftSyncConfig<T> {
    /** The value to sync to the draft */
    value: T;
    /** The draft object with updateValue method */
    draft: {
        updateValue: (path: string, value: unknown, action?: DraftAction) => Promise<{ success: boolean; id?: number }>;
    };
    /** The path to update in the draft (e.g., 'name', 'alignmentId', 'skills') */
    path: string;
    /** Character ID - sync is skipped if not provided or falsy */
    characterId?: number | null;
    /** Draft ID - sync is skipped if not provided or falsy (for advancement drafts) */
    draftId?: number | null;
    /** Debounce delay in milliseconds. If 0, value is assumed to already be debounced. */
    debounceMs?: number;
    /** Custom comparison function. If not provided, uses !== for primitives or isEqual for arrays/objects */
    compareFn?: (prev: T, current: T) => boolean;
    /** Transform the value before sending to updateValue */
    transformValue?: (value: T) => unknown;
    /** Whether the sync is enabled (default: true) */
    enabled?: boolean;
    /** Error message to log if sync fails */
    errorMessage?: string;
    /** Use boolean initialization ref instead of null sentinel (for nullable values that can be null) */
    useBooleanInitRef?: boolean;
}

/**
 * Determines if a value should use deep equality comparison (isEqual) vs shallow comparison (!==).
 * Arrays and objects use isEqual, primitives use !==.
 */
function shouldUseDeepComparison(value: unknown): boolean {
    if (value === null || value === undefined) {
        return false;
    }
    return Array.isArray(value) || typeof value === 'object';
}

/**
 * Custom hook that syncs a value to a draft when it changes.
 * 
 * This hook abstracts the common pattern of:
 * 1. Checking if characterId/draftId exists
 * 2. Initializing a ref on first run to avoid syncing on initial mount
 * 3. Comparing current value with previous value
 * 4. Calling draft.updateValue() if changed
 * 5. Updating the ref with the new value
 * 
 * **Comparison Logic:**
 * - Primitives (string, number, boolean, null, undefined): Uses `!==` for comparison
 * - Arrays and objects: Uses `lodash/isEqual` for deep equality comparison
 * - Custom comparison: Can be overridden with `compareFn`
 * 
 * **Initialization:**
 * - For nullable values that can legitimately be null, use `useBooleanInitRef: true`
 * - Otherwise, uses null/undefined as sentinel to detect first run
 * 
 * 
 * @example
 * ```tsx
 * // Simple scalar field
 * useDraftSync({
 *   value: state.alignmentId,
 *   draft: characterDraft,
 *   path: 'alignmentId',
 *   characterId: state.characterId,
 *   errorMessage: 'Failed to sync alignmentId'
 * });
 * 
 * @example
 * ```tsx
 * // Debounced text field
 * const debouncedName = useDebounce(state.name, 500);
 * useDraftSync({
 *   value: debouncedName,
 *   draft: characterDraft,
 *   path: 'name',
 *   characterId: state.characterId,
 *   debounceMs: 0, // Already debounced
 *   errorMessage: 'Failed to sync name'
 * });
 * 
 * @example
 * ```tsx
 * // Nullable field with boolean init ref
 * useDraftSync({
 *   value: state.classId,
 *   draft: advancementDraft,
 *   path: 'classId',
 *   characterId: state.characterId,
 *   draftId: advancementDraft.draftId,
 *   useBooleanInitRef: true,
 *   errorMessage: 'Failed to sync classId'
 * });
 * 
 * @example
 * ```tsx
 * // Array field (automatically uses isEqual)
 * useDraftSync({
 *   value: state.skillRanks,
 *   draft: advancementDraft,
 *   path: 'skills',
 *   characterId: state.characterId,
 *   draftId: advancementDraft.draftId,
 *   errorMessage: 'Failed to sync skill ranks'
 * });
 */
export function useDraftSync<T>(config: UseDraftSyncConfig<T>): void {
    const {
        value,
        draft,
        path,
        characterId,
        draftId,
        debounceMs,
        compareFn,
        transformValue,
        enabled = true,
        errorMessage = 'Failed to sync value to draft',
        useBooleanInitRef = false,
    } = config;

    const prevValueRef = useRef<T | null>(null);
    const hasInitializedRef = useRef(false);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevCharacterIdRef = useRef<number | null | undefined>(undefined);
    const prevDraftIdRef = useRef<number | null | undefined>(undefined);

    const syncValue = useCallback((currentValue: T, actualCompareFn: (prev: T, current: T) => boolean): void => {
        // Initialize ref on first run (don't send update on initial sync)
        // Always use hasInitializedRef to detect first run, not the value itself (null is a valid value)
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            prevValueRef.current = currentValue;
            return;
        }

        // Early return if value hasn't changed
        if (actualCompareFn(prevValueRef.current, currentValue)) {
            return;
        }

        // Value changed - sync to draft
        const valueToSync = transformValue ? transformValue(currentValue) : currentValue;

        draft.updateValue(path, valueToSync).catch((error) => {
            console.error(errorMessage, error);
        });

        // Update ref
        prevValueRef.current = currentValue;
    }, [transformValue, draft, path, errorMessage]);

    useEffect(() => {
        // Check if characterId or draftId changed (reset refs when they change)
        const characterIdChanged = prevCharacterIdRef.current !== characterId;
        const draftIdChanged = prevDraftIdRef.current !== draftId;
        
        if (characterIdChanged || draftIdChanged) {
            // Reset refs for fresh initialization (new character/draft session)
            prevValueRef.current = null;
            hasInitializedRef.current = false;
        }
        
        // Update tracking refs
        prevCharacterIdRef.current = characterId;
        prevDraftIdRef.current = draftId;

        // Skip if not enabled
        if (!enabled) {
            return;
        }

        // Skip if characterId is required but not provided
        if (characterId === null || characterId === undefined || characterId === 0) {
            return;
        }

        // Skip if draftId is required but not provided
        if (draftId !== null && draftId !== undefined && draftId === 0) {
            return;
        }

        // Determine comparison function (inside effect to avoid dependency issues)
        // Returns true if values are equal
        const actualCompareFn = compareFn ?? (shouldUseDeepComparison(value) 
            ? isEqual 
            : (prev: T, current: T) => {
                // Treat null and undefined as equivalent
                if ((prev === null || prev === undefined) && (current === null || current === undefined)) {
                    return true;
                }
                return prev === current;
            });

        // Handle debouncing if specified
        if (debounceMs !== undefined && debounceMs > 0) {
            // Clear existing timeout
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            // Set new timeout
            debounceTimeoutRef.current = setTimeout(() => {
                syncValue(value, actualCompareFn);
            }, debounceMs);

            return () => {
                if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                }
            };
        }

        // Sync immediately (or value is already debounced)
        syncValue(value, actualCompareFn);
    }, [value, characterId, draftId, enabled, debounceMs, syncValue, compareFn]);
}
