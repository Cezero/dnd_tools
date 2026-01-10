import { useState, useEffect, useCallback, useRef } from 'react';

import { CharacterResolutionApi, type ResolvedCharacterResult, type CharacterUpdate } from '@/services/api/CharacterResolutionApi';

/**
 * Hook for managing character resolution sessions
 * Handles session lifecycle: initialize, resume, update, save, cancel
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
     * Apply an update to the resolution session
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
     * Save session to database
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
     * Cancel session without saving
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
     * Refresh current state from server
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
     * Updates the resolved character state from an external source.
     * 
     * **Purpose**: Allows external operations (like spell add/remove) to update the resolution
     * state without going through the normal `applyUpdate` flow. This keeps the frontend
     * resolution state synchronized with backend state after direct database operations.
     * 
     * **Spell Operation Integration**:
     * - Called by `SpellSelectionTab` after `addSpellKnown` or `removeSpellKnown` operations
     * - Receives updated `ResolvedCharacterResult` from backend response
     * - Updates local state immediately, causing `CharacterEdit` to re-render with fresh data
     * - Updates `sessionId` if it changed in the response
     * 
     * **When to Use**:
     * - After spell operations that return `resolvedCharacter` in the response
     * - When backend operations update the character and re-resolve features
     * - To keep frontend resolution state in sync without full re-initialization
     * 
     * **When NOT to Use**:
     * - For normal character updates (use `applyUpdate` instead)
     * - When you need to trigger validation or choice identification
     * 
     * @param newResolvedCharacter - The updated resolved character result from the backend.
     *                                Should be a complete `ResolvedCharacterResult` with all fields populated.
     * 
     * @example
     * // After adding a spell
     * const response = await CharacterQueryHooks.addSpellKnown({...});
     * if (response?.resolvedCharacter) {
     *   resolution.updateResolvedCharacter(response.resolvedCharacter);
     * }
     * 
     * @see SpellSelectionTab.handleLearnSpell - Uses this after adding spells
     * @see SpellSelectionTab.handleRemoveSpell - Uses this after removing spells
     */
    const updateResolvedCharacter = useCallback((newResolvedCharacter: ResolvedCharacterResult): void => {
        setResolvedCharacter(newResolvedCharacter);
        // Update sessionId if it changed
        if (newResolvedCharacter.sessionId && newResolvedCharacter.sessionId !== sessionId) {
            setSessionId(newResolvedCharacter.sessionId);
        }
    }, [sessionId]);

    /**
     * Cleanup on unmount - cancel session if still active
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
        updateResolvedCharacter,
    };
}










