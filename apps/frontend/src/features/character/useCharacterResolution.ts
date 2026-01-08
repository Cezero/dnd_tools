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
     * Initialize or resume session on mount or when reinitializeTrigger changes
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
                // Try to resume existing session first
                const resumed = await CharacterResolutionApi.resumeSession(characterId);
                
                if (resumed) {
                    setSessionId(resumed.sessionId);
                    setResolvedCharacter(resumed);
                } else {
                    // No existing session, initialize new one
                    const initialized = await CharacterResolutionApi.initializeSession(characterId);
                    setSessionId(initialized.sessionId);
                    setResolvedCharacter(initialized);
                }
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
    };
}










