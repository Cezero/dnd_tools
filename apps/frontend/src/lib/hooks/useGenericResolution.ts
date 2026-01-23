import { useState, useEffect, useCallback, useRef } from 'react';

import type { ResolutionApi, ResolutionHookResult } from './types';

/**
 * Generic React hook for managing entity editing.
 * 
 * Handles editing lifecycle: start editing, update, save, cancel.
 * Provides a consistent interface for all entity types (Feature, Class, Race).
 * 
 * **Generic Type Parameters**:
 * - `TEntityId`: The type of the entity ID
 * - `TState`: The type of the entity state
 * - `TUpdate`: The type of update operations
 * 
 * **Editing Lifecycle**:
 * 1. **Start Editing**: Automatically starts editing on mount (acquires lock, adds to user session).
 *    State management is transparent - `startEditing` returns only success/failure, then `fetchEntity()`
 *    is called to fetch entity data using normal services.
 * 2. **Updates**: Updates are handled via `updateValue()` in hooks created by `createResolutionHook()`
 * 3. **Persistence**: Saves entity state to database via `save()`
 * 4. **Cleanup**: Cancels editing on unmount if not saved
 * 
 * **State Management**:
 * - `state`: Current entity state (null if not loaded)
 * - `isLoading`: Loading state for async operations
 * - `error`: Error state for failed operations
 * 
 * **Note**: No longer tracks `sessionId` - editing state is tracked via user sessions.
 * 
 * **Usage Example**:
 * ```typescript
 * const resolution = useGenericResolution(classId, {
 *   startEditing: ClassResolutionApi.startEditing,
 *   fetchEntity: ClassResolutionApi.fetchEntity,
 *   cancel: ClassResolutionApi.cancel
 * });
 * 
 * // Save state
 * await resolution.save();
 * ```
 * 
 * **Error Handling**:
 * - All errors are caught and stored in `error` state
 * - Errors are logged to console
 * - Callers should check `error` state before proceeding
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The entity state type
 * @template TUpdate - The update operation type
 * 
 * @param entityId - The entity ID to manage editing for (null if not yet loaded)
 * @param api - The API interface for editing operations. **CRITICAL**: The `api` object must be
 *              memoized (using `useMemo`) in the calling hook to prevent infinite loops. The `api`
 *              parameter should NEVER be included in any `useEffect`, `useCallback`, or `useMemo`
 *              dependency arrays, as API methods are stable function references that don't change
 *              between renders. Including `api` in dependency arrays causes infinite re-renders.
 * 
 * @returns Object containing entity state and operations
 * 
 * @see ResolutionApi - API interface definition
 * 
 * @example
 * // In ClassEdit component
 * const { state, updateState } = useClassEditState();
 * const resolution = useGenericResolution(state.classId, ClassResolutionApi);
 * 
 * // Sync state changes using updateValue (provided by createResolutionHook)
 * useEffect(() => {
 *   if (state.name !== prevName && resolution.state) {
 *     resolution.updateValue('name', state.name);
 *   }
 * }, [state.name]);
 */
export function useGenericResolution<TEntityId, TState, TUpdate>(
    entityId: TEntityId | null,
    api: ResolutionApi<TEntityId, TState, TUpdate, unknown>
): ResolutionHookResult<TState, TUpdate> {
    const [state, setState] = useState<TState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isInitializingRef = useRef(false);
    const [reinitializeTrigger, setReinitializeTrigger] = useState(0);
    const isEditingRef = useRef(false);

    /**
     * Start editing on mount or when reinitializeTrigger changes.
     * 
     * The `startEditing` API call acquires a lock and adds the entity to the user's editing list.
     * State management is transparent - `startEditing` returns only success/failure.
     * After successful start, `fetchEntity()` is called to fetch entity data using normal entity services
     * (e.g., getFeatureById, getClassById) - NOT state management endpoints.
     * 
     * **CRITICAL**: `api` is intentionally excluded from the dependency array. API methods are
     * stable function references that don't change between renders. Including `api` causes
     * infinite re-renders and continuous API queries.
     */
    useEffect(() => {
        if (!entityId) {
            return;
        }

        // Reset initialization flag when trigger changes
        if (reinitializeTrigger > 0) {
            isInitializingRef.current = false;
            isEditingRef.current = false;
        }

        if (isInitializingRef.current) {
            return;
        }

        const startEditing = async () => {
            isInitializingRef.current = true;
            setIsLoading(true);
            setError(null);

            try {
                // Start editing (acquires lock, adds to user session)
                // State management is transparent - returns only success/failure
                const result = await api.startEditing(entityId);
                
                if (!result.success) {
                    throw new Error('Failed to start editing');
                }
                
                // After successful startEditing, fetch entity data using normal entity services
                // (e.g., getFeatureById, getClassById) - NOT state management endpoints
                const entityResult = await api.fetchEntity(entityId);
                setState(entityResult.state);
                isEditingRef.current = true;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to start editing';
                setError(errorMessage);
                console.error('Error starting editing:', err);
            } finally {
                setIsLoading(false);
                isInitializingRef.current = false;
            }
        };

        startEditing();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId, reinitializeTrigger]);


    /**
     * Save entity state to database.
     * 
     * **CRITICAL**: `api` is intentionally excluded from the dependency array. API methods are
     * stable function references that don't change between renders. Including `api` causes
     * infinite re-renders.
     */
    const save = useCallback(async (): Promise<void> => {
        if (!entityId || !isEditingRef.current) {
            throw new Error('Not currently editing');
        }

        setIsLoading(true);
        setError(null);

        try {
            // Note: api.save is no longer part of the ResolutionApi interface.
            // Hooks that need to save should override the save method and call
            // the API directly, then call this method for state cleanup.
            // Clear state after successful save
            setState(null);
            isEditingRef.current = false;
            // Trigger re-initialization to get fresh data
            setReinitializeTrigger(prev => prev + 1);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save';
            setError(errorMessage);
            console.error('Error saving:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
         
    }, [entityId]);

    /**
     * Cancel editing without saving.
     * 
     * **CRITICAL**: `api` is intentionally excluded from the dependency array. API methods are
     * stable function references that don't change between renders. Including `api` causes
     * infinite re-renders.
     */
    const cancel = useCallback(async (): Promise<void> => {
        if (!entityId || !isEditingRef.current) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.cancel(entityId);
            // Clear state after cancellation
            setState(null);
            isEditingRef.current = false;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel';
            setError(errorMessage);
            console.error('Error cancelling:', err);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    /**
     * Refresh entity state from backend.
     * 
     * **Purpose**: Manually refresh the entity state after operations that update the database
     * directly (e.g., spell add/remove operations). This keeps the frontend entity state
     * synchronized with backend state.
     * 
     * **When to Use**:
     * - After operations that update the database directly
     * - After any direct database operation that should update the entity state
     * - When you need to manually refresh entity state
     * 
     * **When NOT to Use**:
     * - For normal entity updates (use state → useEffect → updateValue pattern instead)
     * - When state changes are handled by Edit component useEffect hooks
     * 
 * **Standardized Pattern**:
 * - Operations that update state: Use state → useEffect → updateValue (automatic)
 * - Operations that update database directly: Use API call → refreshState() (manual)
     * 
     * **CRITICAL**: `api` is intentionally excluded from the dependency array. API methods are
     * stable function references that don't change between renders. Including `api` causes
     * infinite re-renders.
     * 
     * @example
     * // After adding a spell (direct database operation)
     * await CharacterQueryHooks.addSpellKnown({...});
     * if (isEditingRef.current) {
     *   await resolution.refreshState();
     * }
     * 
     * @see updateValue - For state-based updates (provided by createResolutionHook, called automatically by Edit components)
     */
    const refreshState = useCallback(async (): Promise<void> => {
        if (!entityId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch entity data using normal entity services (NOT state management endpoints)
            const result = await api.fetchEntity(entityId);
            setState(result.state);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh state';
            setError(errorMessage);
            console.error('Error refreshing state:', err);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    /**
     * Cleanup on unmount - cancel editing if still active.
     * 
     * Note: `api` is intentionally excluded from dependencies since the API methods
     * are stable function references that don't change between renders.
     */
    useEffect(() => {
        return () => {
            if (entityId && isEditingRef.current) {
                // Cancel editing on unmount if not saved
                api.cancel(entityId).catch(console.error);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    return {
        state,
        isLoading,
        error,
        save,
        cancel,
        refreshState,
    };
}
