import { useMemo, useCallback } from 'react';

import { useGenericResolution } from '@/lib/hooks/useGenericResolution';
import { RaceResolutionApi } from '@/services/api/RaceResolutionApi';
import type { RaceEditState, RaceUpdate } from '@shared/schema';
import type { ResolutionApi } from '@/lib/hooks/types';

/**
 * Hook for managing race editing.
 * 
 * **Implementation Note**: This hook is a thin wrapper around `useGenericResolution`
 * that provides Race-specific API configuration. All editing management logic
 * is handled by the generic hook.
 * 
 * **CRITICAL**: The `api` object is memoized using `useMemo` to prevent infinite loops.
 * The `api` object must be stable across renders - if it's recreated on every render,
 * it will cause `useGenericResolution`'s initialization effect to run repeatedly, causing
 * infinite API queries. The `api` object should NEVER be included in any dependency arrays.
 * 
 * @param raceId - The race ID to manage editing for (null if not yet loaded)
 * @returns Object containing race state and operations
 * 
 * @see useGenericResolution - Generic implementation
 */
export function useRaceResolution(raceId: number | null) {
    // Memoize API object to prevent unnecessary re-renders and effect re-runs
    const api: ResolutionApi<number, RaceEditState, RaceUpdate, unknown> = useMemo(
        () => ({
            startEditing: async (id: number) => {
                const result = await RaceResolutionApi.startEditing(id);
                return {
                    state: result.raceState
                };
            },
            getState: async (id: number) => {
                const result = await RaceResolutionApi.getState(id);
                return {
                    state: result.raceState
                };
            },
        applyUpdate: async (id: number, update: RaceUpdate) => {
            const result = await RaceResolutionApi.applyUpdate(id, update);
            return {
                state: result.raceState
            };
        },
        cancel: async (id: number) => {
                await RaceResolutionApi.cancel(id);
            }
        }),
        []
    );

    const resolution = useGenericResolution<number, RaceEditState, RaceUpdate>(raceId, api);

    // Override save to call API directly, then use genericResolution.save() for cleanup
    // This avoids needing to provide save in the api object
    const save = useCallback(async (): Promise<void> => {
        if (!raceId) {
            throw new Error('Cannot save: raceId is null');
        }
        
        // Call API directly (syncs state from Redis to MySQL)
        await RaceResolutionApi.save(raceId);
        
        // Call genericResolution.save() for state cleanup (api.save is not provided, so no duplicate API call)
        await resolution.save();
    }, [raceId, resolution]);

    return {
        raceState: resolution.state,
        isLoading: resolution.isLoading,
        error: resolution.error,
        applyUpdate: resolution.applyUpdate,
        save,
        cancel: resolution.cancel,
        refreshState: resolution.refreshState,
    };
}
