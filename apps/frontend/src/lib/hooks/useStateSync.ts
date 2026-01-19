import { useEffect, useRef } from 'react';

import type { SyncConfig } from './types';

/**
 * Hook for syncing individual field changes to backend session.
 * 
 * Automatically detects when a specific field in state changes and syncs it
 * to the backend session via applyUpdate. Uses refs to track previous values
 * and avoid syncing on initial mount.
 * 
 * **Usage Pattern**:
 * ```typescript
 * useFieldSync(
 *   state.name,
 *   resolution.sessionId,
 *   resolution.applyUpdate,
 *   {
 *     getEntityId: (state) => state.classId,
 *     buildUpdate: (field, value) => ({ type: 'UPDATE_CLASS_FIELD', payload: { field, value } }),
 *     shouldSync: (prev, curr) => prev !== curr
 *   }
 * );
 * ```
 * 
 * **When to Use**:
 * - For simple field updates (name, description, etc.)
 * - When you want automatic sync on field change
 * - For fields that don't require complex update logic
 * 
 * **When NOT to Use**:
 * - For array/object updates (use useArraySync or custom logic)
 * - For updates that require multiple operations
 * - For updates that need validation before syncing
 * 
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @param fieldValue - Current value of the field to sync
 * @param sessionId - Current session ID (null if not initialized)
 * @param applyUpdate - Function to apply update to session
 * @param config - Sync configuration
 * 
 * @example
 * // In ClassEdit component
 * useFieldSync(
 *   state.name,
 *   resolution.sessionId,
 *   resolution.applyUpdate,
 *   {
 *     getEntityId: () => state.classId,
 *     buildUpdate: (field, value) => ({ 
 *       type: 'UPDATE_CLASS_FIELD', 
 *       payload: { field, value } 
 *     }),
 *     shouldSync: (prev, curr) => prev !== curr
 *   }
 * );
 */
export function useFieldSync<TState, TUpdate>(
    fieldValue: unknown,
    sessionId: string | null,
    applyUpdate: (update: TUpdate) => Promise<void>,
    config: SyncConfig<TState, TUpdate>
): void {
    const prevValueRef = useRef<unknown>(null);
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        // Only sync if session is initialized
        if (!sessionId) {
            return;
        }

        // Skip sync on initial mount
        if (isInitialMountRef.current) {
            prevValueRef.current = fieldValue;
            isInitialMountRef.current = false;
            return;
        }

        // Check if value changed
        if (fieldValue !== prevValueRef.current) {
            // Build update from field name (we need to infer it from the value)
            // For now, this is a simplified version - full implementation would
            // need to track field names or use a more sophisticated approach
            const update = config.buildUpdate('', fieldValue);
            applyUpdate(update).catch(error => {
                console.error('Failed to sync field change:', error);
            });
            prevValueRef.current = fieldValue;
        }
    }, [fieldValue, sessionId, applyUpdate, config]);
}

/**
 * Hook for syncing multiple field changes to backend session.
 * 
 * Tracks multiple fields and syncs them individually when they change.
 * More efficient than multiple useFieldSync calls as it batches comparisons.
 * 
 * **Usage Pattern**:
 * ```typescript
 * useFieldsSync(
 *   state,
 *   resolution.sessionId,
 *   resolution.applyUpdate,
 *   {
 *     getEntityId: (state) => state.classId,
 *     buildUpdate: (field, value) => ({ type: 'UPDATE_CLASS_FIELD', payload: { field, value } }),
 *     shouldSync: (prev, curr) => {
 *       return prev.name !== curr.name || 
 *              prev.description !== curr.description;
 *     },
 *     fields: ['name', 'description', 'abbreviation']
 *   }
 * );
 * ```
 * 
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @param state - Current state object
 * @param sessionId - Current session ID (null if not initialized)
 * @param applyUpdate - Function to apply update to session
 * @param config - Sync configuration with fields array
 * 
 * @example
 * // In ClassEdit component
 * useFieldsSync(
 *   state,
 *   resolution.sessionId,
 *   resolution.applyUpdate,
 *   {
 *     getEntityId: () => state.classId,
 *     buildUpdate: (field, value) => ({ 
 *       type: 'UPDATE_CLASS_FIELD', 
 *       payload: { field, value } 
 *     }),
 *     shouldSync: (prev, curr) => true, // Always check individual fields
 *     fields: ['name', 'abbreviation', 'description']
 *   }
 * );
 */
export function useFieldsSync<TState, TUpdate>(
    state: TState,
    sessionId: string | null,
    applyUpdate: (update: TUpdate) => Promise<void>,
    config: SyncConfig<TState, TUpdate> & { fields: string[] }
): void {
    const prevStateRef = useRef<TState | null>(null);
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        // Only sync if session is initialized and entity ID is available
        if (!sessionId || !config.getEntityId(state)) {
            return;
        }

        // Skip sync on initial mount
        if (isInitialMountRef.current) {
            prevStateRef.current = state;
            isInitialMountRef.current = false;
            return;
        }

        // Check each field for changes
        const prevState = prevStateRef.current;
        if (prevState) {
            for (const field of config.fields) {
                const prevValue = (prevState as Record<string, unknown>)[field];
                const currValue = (state as Record<string, unknown>)[field];

                if (prevValue !== currValue) {
                    const update = config.buildUpdate(field, currValue);
                    applyUpdate(update).catch(error => {
                        console.error(`Failed to sync ${field} change:`, error);
                    });
                }
            }
        }

        prevStateRef.current = state;
    }, [state, sessionId, applyUpdate, config]);
}

/**
 * Hook for syncing array changes to backend session.
 * 
 * Detects changes in arrays (like featureProgressions) and syncs them.
 * Uses JSON serialization for comparison to detect additions, removals, and updates.
 * 
 * **Usage Pattern**:
 * ```typescript
 * useArraySync(
 *   state.featureProgressions,
 *   resolution.sessionId,
 *   resolution.applyUpdate,
 *   {
 *     getEntityId: () => state.classId,
 *     buildUpdate: (field, value) => {
 *       // Custom logic to build progression updates
 *       return { type: 'ADD_PROGRESSION', payload: { progression: value } };
 *     },
 *     shouldSync: (prev, curr) => JSON.stringify(prev) !== JSON.stringify(curr)
 *   }
 * );
 * ```
 * 
 * **Note**: This is a simplified version. Full implementation would need to
 * detect specific array operations (add/remove/update) and build appropriate updates.
 * 
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @param arrayValue - Current array value
 * @param sessionId - Current session ID (null if not initialized)
 * @param applyUpdate - Function to apply update to session
 * @param config - Sync configuration
 */
export function useArraySync<TState, TUpdate>(
    arrayValue: unknown[],
    sessionId: string | null,
    applyUpdate: (update: TUpdate) => Promise<void>,
    config: SyncConfig<TState, TUpdate>
): void {
    const prevArrayRef = useRef<string>('');
    const isInitialMountRef = useRef(true);

    useEffect(() => {
        // Only sync if session is initialized
        if (!sessionId) {
            return;
        }

        // Serialize current array for comparison
        const currentArrayStr = JSON.stringify(arrayValue);

        // Skip sync on initial mount
        if (isInitialMountRef.current) {
            prevArrayRef.current = currentArrayStr;
            isInitialMountRef.current = false;
            return;
        }

        // Check if array changed
        if (currentArrayStr !== prevArrayRef.current) {
            // For now, this is a simplified version that would need entity-specific
            // logic to detect add/remove/update operations and build appropriate updates
            // This is left as a placeholder for future enhancement
            prevArrayRef.current = currentArrayStr;
        }
    }, [arrayValue, sessionId, applyUpdate, config]);
}
