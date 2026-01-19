import { useMemo } from 'react';

import { useGenericResolution } from '@/lib/hooks/useGenericResolution';
import { RaceResolutionApi } from '@/services/api/RaceResolutionApi';
import type { RaceEditState, RaceUpdate } from '@shared/schema';

/**
 * Hook for managing race editing sessions.
 * 
 * **Implementation Note**: This hook is a thin wrapper around `useGenericResolution`
 * that provides Race-specific API configuration. All session management logic
 * is handled by the generic hook.
 * 
 * Handles session lifecycle: initialize, resume, update, save, cancel.
 * 
 * @param raceId - The race ID to manage session for (null if not yet loaded)
 * @returns Object containing session state and operations
 * 
 * @see useGenericResolution - Generic implementation
 */
export function useRaceResolution(raceId: number | null) {
    // Memoize API object to prevent unnecessary re-renders and effect re-runs
    const api = useMemo(
        () => ({
            initializeSession: async (id: number) => {
                const result = await RaceResolutionApi.initializeSession(id);
                return {
                    sessionId: result.sessionId,
                    state: result.raceState
                };
            },
            getSessionState: async (id: number, sessionId: string) => {
                const result = await RaceResolutionApi.getSessionState(id, sessionId);
                return {
                    state: result.raceState
                };
            },
            applyUpdate: async (id: number, sessionId: string, update: RaceUpdate) => {
                const result = await RaceResolutionApi.applyUpdate(id, sessionId, update);
                return {
                    state: result.raceState
                };
            },
            saveSession: async (id: number, sessionId: string) => {
                await RaceResolutionApi.saveSession(id, sessionId);
            },
            cancelSession: async (id: number, sessionId: string) => {
                await RaceResolutionApi.cancelSession(id, sessionId);
            }
        }),
        []
    );

    const resolution = useGenericResolution<number, RaceEditState, RaceUpdate>(raceId, api);

    return {
        sessionId: resolution.sessionId,
        raceState: resolution.state,
        isLoading: resolution.isLoading,
        error: resolution.error,
        applyUpdate: resolution.applyUpdate,
        saveSession: resolution.saveSession,
        cancelSession: resolution.cancelSession,
        refreshState: resolution.refreshState,
    };
}
