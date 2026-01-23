import { useState, useCallback, useRef } from 'react';

import { StateManagementApi } from './StateManagementApi';
import type { StateManagementHookResult } from './types';

/**
 * Generic hook for managing entity state updates.
 * 
 * Provides a unified interface for updating state values across all entity types
 * using the generic state management API.
 * 
 * **Path Format**: The path should include entity identification:
 * - `feature:123.name` - Update name field of feature 123
 * - `class:27.name` - Update name field of class 27
 * - `race:5.name` - Update name field of race 5
 * - `character:10.name` - Update name field of character 10
 * - `feature:new.name` - Update name field of new feature
 * 
 * @param entityType - The entity type ('feature', 'class', 'race', 'character')
 * @param entityId - The entity ID, or 'new' for new entities
 * @param sessionId - Optional session ID (required for characters)
 * @param onStateUpdate - Optional callback to refresh state after update
 * 
 * @returns State management hook result with updateValue method
 * 
 * @example
 * ```typescript
 * const stateManagement = useGenericStateManagement('feature', featureId, undefined, () => {
 *   // Refresh state after update
 *   resolution.refreshState();
 * });
 * 
 * // Update a field
 * await stateManagement.updateValue('name', 'New Name');
 * ```
 */
export function useGenericStateManagement(
    entityType: 'feature' | 'class' | 'race' | 'character',
    entityId: number | 'new' | null,
    sessionId: string | undefined,
    onStateUpdate?: () => Promise<void>
): StateManagementHookResult<Record<string, unknown>> {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isUpdatingRef = useRef(false);

    /**
     * Update a value at a specific path in the entity state.
     * 
     * @param fieldPath - The field path to update (e.g., 'name', 'entities.0.type')
     * @param value - The new value to set
     */
    const updateValue = useCallback(async (fieldPath: string, value: unknown): Promise<void> => {
        if (!entityId) {
            throw new Error(`Cannot update value: ${entityType} ID is null`);
        }

        if (isUpdatingRef.current) {
            return;
        }

        isUpdatingRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            // Build full path with entity identification
            let fullPath: string;
            if (entityType === 'character') {
                // Character no longer uses sessionId in path format
                fullPath = `character:${entityId}.${fieldPath}`;
            } else {
                fullPath = `${entityType}:${entityId}.${fieldPath}`;
            }

            await StateManagementApi.updateValue(fullPath, value);

            // Call optional callback to refresh state
            if (onStateUpdate) {
                await onStateUpdate();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update value';
            setError(errorMessage);
            console.error(`Error updating ${entityType} value:`, err);
            throw err;
        } finally {
            setIsLoading(false);
            isUpdatingRef.current = false;
        }
    }, [entityType, entityId, sessionId, onStateUpdate]);

    /**
     * Refresh state from backend.
     * This is a no-op in the generic hook - entity-specific hooks should
     * provide their own refreshState implementation.
     */
    const refreshState = useCallback(async (): Promise<void> => {
        if (onStateUpdate) {
            await onStateUpdate();
        }
    }, [onStateUpdate]);

    return {
        state: null, // Generic hook doesn't manage state - entity-specific hooks do
        isLoading,
        error,
        updateValue,
        refreshState,
    };
}
