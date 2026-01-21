import { useState, useEffect, useCallback, useRef } from 'react';

import { CharacterResolutionApi, type ResolvedCharacterResult, type CharacterUpdate } from '@/services/api/CharacterResolutionApi';

/**
 * Hook for managing character resolution sessions.
 * 
 * **Implementation Note**: Character resolution is more complex than Class/Race resolution
 * because it returns `ResolvedCharacterResult` (with resolved features, pending choices,
 * etc.) instead of just state. This hook follows similar patterns to the generic resolution hook
 * but is customized for Character's unique requirements.
 * 
 * Handles session lifecycle: initialize, resume, update, save, cancel.
 * 
 * **Key Differences from Generic Hook**:
 * - Uses `resumeSession` API instead of `initializeSession` (backend handles both cases)
 * - Returns `ResolvedCharacterResult` instead of just state
 * - Includes complex resolution logic (feature resolution, spell selection, etc.)
 * 
 * @param characterId - The character ID to manage session for (null if not yet loaded)
 * @returns Object containing session state and operations
 * 
 * @see useGenericResolution - Generic implementation (used by Class/Race)
 */
export function useCharacterResolution(characterId: number | null) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [resolvedCharacter, setResolvedCharacter] = useState<ResolvedCharacterResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isInitializingRef = useRef(false);
    const [reinitializeTrigger, setReinitializeTrigger] = useState(0);

    /**
     * Initialize or resume session on mount or when reinitializeTrigger changes.
     * 
     * The `resumeSession` API call always returns a session - if no active session exists,
     * the backend automatically creates a new one. This simplifies the frontend code by
     * eliminating the need for a second API call to initialize a session.
     */
    useEffect(() => {
        if (!characterId) {
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
                // Resume existing session or create new one if none exists
                // The backend handles both cases, so we always get a session back
                const result = await CharacterResolutionApi.resumeSession(characterId);
                setSessionId(result.sessionId);
                setResolvedCharacter(result);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to initialize resolution session';
                setError(errorMessage);
                console.error('Error initializing resolution session:', err);
            } finally {
                setIsLoading(false);
                isInitializingRef.current = false;
            }
        };

        initializeSession();
    }, [characterId, reinitializeTrigger]);

    /**
     * Apply an update to the resolution session.
     * 
     * **IMPORTANT**: This method is called automatically by CharacterEdit useEffect hooks.
     * Tab components should NOT call this method directly.
     * 
     * **Standardized Pattern**: 
     * - Tabs update state via `updateState()`
     * - CharacterEdit useEffect hooks watch state changes
     * - CharacterEdit automatically calls this method to sync changes
     * 
     * **When to use manually**:
     * - Only if you need to update the resolution session outside of the standard pattern
     * - For operations that don't go through state (e.g., direct API calls)
     * 
     * **For tabs**: Use `refreshState()` if you need to manually refresh resolution state
     * after operations that update the database directly (e.g., spell add/remove).
     * 
     * @param update - The character update to apply
     * @returns Promise resolving to updated resolved character result
     * 
     * @see CharacterEdit component - Uses this method via useEffect hooks
     * @see refreshState - For manual state refresh after direct API operations
     */
    const applyUpdate = useCallback(async (update: CharacterUpdate): Promise<ResolvedCharacterResult | null> => {
        if (!characterId || !sessionId) {
            throw new Error('Session not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await CharacterResolutionApi.applyUpdate(characterId, sessionId, update);
            setResolvedCharacter(result);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to apply update';
            setError(errorMessage);
            console.error('Error applying update:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [characterId, sessionId]);

    /**
     * Save session to database.
     */
    const saveSession = useCallback(async (): Promise<void> => {
        if (!characterId || !sessionId) {
            throw new Error('Session not initialized');
        }

        setIsLoading(true);
        setError(null);

        try {
            await CharacterResolutionApi.saveSession(characterId, sessionId);
            // Clear session after successful save
            setSessionId(null);
            setResolvedCharacter(null);
            // Trigger re-initialization to get fresh resolved data
            setReinitializeTrigger(prev => prev + 1);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save session';
            setError(errorMessage);
            console.error('Error saving session:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [characterId, sessionId]);

    /**
     * Cancel session without saving.
     */
    const cancelSession = useCallback(async (): Promise<void> => {
        if (!characterId || !sessionId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await CharacterResolutionApi.cancelSession(characterId, sessionId);
            // Clear session after cancellation
            setSessionId(null);
            setResolvedCharacter(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to cancel session';
            setError(errorMessage);
            console.error('Error canceling session:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [characterId, sessionId]);

    /**
     * Refresh resolution state from the server.
     * 
     * **Purpose**: Manually refresh the resolution state after operations that update the database
     * directly (e.g., spell add/remove operations). This keeps the frontend resolution state
     * synchronized with backend state.
     * 
     * **When to Use**:
     * - After spell operations (`addSpellKnown`/`removeSpellKnown`) that update the database
     * - After any direct database operation that should update the resolution session
     * - When you need to manually refresh resolution state
     * 
     * **When NOT to Use**:
     * - For normal character updates (use state → useEffect → applyUpdate pattern instead)
     * - When state changes are handled by CharacterEdit useEffect hooks
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
     * @see SpellSelectionTab.handleLearnSpell - Uses this after adding spells
     * @see SpellSelectionTab.handleRemoveSpell - Uses this after removing spells
     * @see applyUpdate - For state-based updates (called automatically by CharacterEdit)
     */
    const refreshState = useCallback(async (): Promise<void> => {
        if (!characterId || !sessionId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await CharacterResolutionApi.getCurrentState(characterId, sessionId);
            setResolvedCharacter(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh state';
            setError(errorMessage);
            console.error('Error refreshing state:', err);
        } finally {
            setIsLoading(false);
        }
    }, [characterId, sessionId]);

    /**
     * Cleanup on unmount - cancel session if still active.
     */
    useEffect(() => {
        return () => {
            if (characterId && sessionId) {
                // Cancel session on unmount if not saved
                CharacterResolutionApi.cancelSession(characterId, sessionId).catch(console.error);
            }
        };
    }, [characterId, sessionId]);

    return {
        sessionId,
        resolvedCharacter,
        isLoading,
        error,
        applyUpdate,
        saveSession,
        cancelSession,
        refreshState,
    };
}
