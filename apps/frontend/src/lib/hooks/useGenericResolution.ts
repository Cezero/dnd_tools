import { useState, useEffect, useCallback, useRef } from 'react';

import type { ResolutionApi, ResolutionHookResult } from './types';

/**
 * Generic React hook for managing entity editing sessions.
 * 
 * Handles session lifecycle: initialize, resume, update, save, cancel.
 * Provides a consistent interface for all entity types (Character, Class, Race).
 * 
 * **Generic Type Parameters**:
 * - `TEntityId`: The type of the entity ID
 * - `TState`: The type of the session state
 * - `TUpdate`: The type of update operations
 * 
 * **Session Lifecycle**:
 * 1. **Initialization**: Automatically initializes or resumes session on mount
 * 2. **Updates**: Applies updates to session state via `applyUpdate()`
 * 3. **Persistence**: Saves session to database via `saveSession()`
 * 4. **Cleanup**: Cancels session on unmount if not saved
 * 
 * **State Management**:
 * - `sessionId`: Current session ID (null if no active session)
 * - `state`: Current session state (null if not loaded)
 * - `isLoading`: Loading state for async operations
 * - `error`: Error state for failed operations
 * 
 * **Usage Example**:
 * ```typescript
 * const resolution = useGenericResolution(classId, {
 *   initializeSession: ClassResolutionApi.initializeSession,
 *   getSessionState: ClassResolutionApi.getSessionState,
 *   applyUpdate: ClassResolutionApi.applyUpdate,
 *   saveSession: ClassResolutionApi.saveSession,
 *   cancelSession: ClassResolutionApi.cancelSession
 * });
 * 
 * // Apply update
 * await resolution.applyUpdate({ type: 'UPDATE_CLASS_FIELD', payload: { field: 'name', value: 'New Name' } });
 * 
 * // Save session
 * await resolution.saveSession();
 * ```
 * 
 * **Error Handling**:
 * - All errors are caught and stored in `error` state
 * - Errors are logged to console
 * - Callers should check `error` state before proceeding
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @param entityId - The entity ID to manage session for (null if not yet loaded)
 * @param api - The API interface for session operations
 * 
 * @returns Object containing session state and operations
 * 
 * @see ResolutionApi - API interface definition
 * 
 * @example
 * // In ClassEdit component
 * const { state, updateState } = useClassEditState();
 * const resolution = useGenericResolution(state.classId, ClassResolutionApi);
 * 
 * // Sync state changes to session
 * useEffect(() => {
 *   if (state.name !== prevName && resolution.sessionId) {
 *     resolution.applyUpdate({ type: 'UPDATE_CLASS_FIELD', payload: { field: 'name', value: state.name } });
 *   }
 * }, [state.name]);
 */
export function useGenericResolution<TEntityId, TState, TUpdate>(
    entityId: TEntityId | null,
    api: ResolutionApi<TEntityId, TState, TUpdate, unknown>
): ResolutionHookResult<TState, TUpdate> {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [state, setState] = useState<TState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isInitializingRef = useRef(false);
    const [reinitializeTrigger, setReinitializeTrigger] = useState(0);

    /**
     * Initialize or resume session on mount or when reinitializeTrigger changes.
     * 
     * The `initializeSession` API call should return existing session if available,
     * or create a new one if none exists. This simplifies the frontend code by
     * eliminating the need for a second API call to initialize a session.
     */
    useEffect(() => {
        if (!entityId) {
            return;
        }

        // Reset initialization flag when trigger changes
        if (reinitializeTrigger > 0) {
            isInitializingRef.current = false;
        }

        if (isInitializingRef.current) {
            return;
        }

        const initializeSession = async () => {
            isInitializingRef.current = true;
            setIsLoading(true);
            setError(null);

            try {
                // Initialize or resume existing session
                const result = await api.initializeSession(entityId);
                setSessionId(result.sessionId);
                setState(result.state);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
                setError(errorMessage);
                console.error('Error initializing session:', err);
            } finally {
                setIsLoading(false);
                isInitializingRef.current = false;
            }
        };

        initializeSession();
    }, [entityId, reinitializeTrigger, api]);

    /**
     * Apply an update to the session.
     * 
     * **IMPORTANT**: This method is called automatically by Edit component useEffect hooks.
     * Tab components should NOT call this method directly.
     * 
     * **Standardized Pattern**: 
     * - Tabs update state via `updateState()`
     * - Edit component useEffect hooks watch state changes
     * - Edit component automatically calls this method to sync changes
     * 
     * **When to use manually**:
     * - Only if you need to update the session outside of the standard pattern
     * - For operations that don't go through state (e.g., direct API calls)
     * 
     * **For tabs**: Use `refreshState()` if you need to manually refresh session state
     * after operations that update the database directly.
     * 
     * @param update - The update to apply
     * @returns Promise resolving to updated state
     * 
     * @see refreshState - For manual state refresh after direct API operations
     */
    const applyUpdate = useCallback(async (update: TUpdate): Promise<TState | null> => {
        if (!entityId || !sessionId) {
            throw new Error('Session not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await api.applyUpdate(entityId, sessionId, update);
            setState(result.state);
            return result.state;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to apply update';
            setError(errorMessage);
            console.error('Error applying update:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [entityId, sessionId, api]);

    /**
     * Save session to database.
     */
    const saveSession = useCallback(async (): Promise<void> => {
        if (!entityId || !sessionId) {
            throw new Error('Session not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.saveSession(entityId, sessionId);
            // Clear session after successful save
            setSessionId(null);
            setState(null);
            // Trigger re-initialization to get fresh data
            setReinitializeTrigger(prev => prev + 1);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save session';
            setError(errorMessage);
            console.error('Error saving session:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [entityId, sessionId, api]);

    /**
     * Cancel session without saving.
     */
    const cancelSession = useCallback(async (): Promise<void> => {
        if (!entityId || !sessionId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await api.cancelSession(entityId, sessionId);
            // Clear session after cancellation
            setSessionId(null);
            setState(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel session';
            setError(errorMessage);
            console.error('Error cancelling session:', err);
        } finally {
            setIsLoading(false);
        }
    }, [entityId, sessionId, api]);

    /**
     * Refresh session state from backend.
     * 
     * **Purpose**: Manually refresh the session state after operations that update the database
     * directly (e.g., spell add/remove operations). This keeps the frontend session state
     * synchronized with backend state.
     * 
     * **When to Use**:
     * - After operations that update the database directly
     * - After any direct database operation that should update the session
     * - When you need to manually refresh session state
     * 
     * **When NOT to Use**:
     * - For normal entity updates (use state → useEffect → applyUpdate pattern instead)
     * - When state changes are handled by Edit component useEffect hooks
     * 
     * **Standardized Pattern**:
     * - Operations that update state: Use state → useEffect → applyUpdate (automatic)
     * - Operations that update database directly: Use API call → refreshState() (manual)
     * 
     * @example
     * // After adding a spell (direct database operation)
     * await CharacterQueryHooks.addSpellKnown({...});
     * if (resolution.sessionId) {
     *   await resolution.refreshState();
     * }
     * 
     * @see applyUpdate - For state-based updates (called automatically by Edit components)
     */
    const refreshState = useCallback(async (): Promise<void> => {
        if (!entityId || !sessionId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await api.getSessionState(entityId, sessionId);
            setState(result.state);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh state';
            setError(errorMessage);
            console.error('Error refreshing state:', err);
        } finally {
            setIsLoading(false);
        }
    }, [entityId, sessionId, api]);

    /**
     * Cleanup on unmount - cancel session if still active.
     * 
     * Note: `api` is intentionally excluded from dependencies since the API methods
     * are stable function references that don't change between renders.
     */
    useEffect(() => {
        return () => {
            if (entityId && sessionId) {
                // Cancel session on unmount if not saved
                api.cancelSession(entityId, sessionId).catch(console.error);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId, sessionId]);

    return {
        sessionId,
        state,
        isLoading,
        error,
        applyUpdate,
        saveSession,
        cancelSession,
        refreshState,
    };
}
