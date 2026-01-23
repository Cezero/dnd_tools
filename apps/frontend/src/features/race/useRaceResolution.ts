import { createResolutionHook } from '@/lib/hooks/createResolutionHook';
import { DraftType } from '@shared/static-data';


import { RaceApi } from './RaceApi';
import { RaceResolutionApi, type RaceEditState } from './RaceResolutionApi';

const useRaceResolutionBase = createResolutionHook<number, RaceEditState, never>({
    draftType: DraftType.Race,
    api: {
        startEditing: RaceResolutionApi.startEditing,
        fetchEntity: async (id: number) => {
            // Fetch race data using normal entity service (NOT state management endpoint)
            const raceData = await RaceApi.getRaceById({ id });
            return {
                state: raceData as RaceEditState,
            };
        },
        cancel: async (id: number) => {
            await RaceResolutionApi.cancel(id);
        },
        save: RaceResolutionApi.save,
    },
});

/**
 * Hook for managing race editing.
 * 
 * **Implementation Note**: This hook is a thin wrapper around `createResolutionHook`
 * that provides Race-specific API configuration. All editing management logic
 * is handled by the factory function.
 * 
 * @param raceId - The race ID to manage editing for (null if not yet loaded)
 * @returns Object containing race state and operations
 * 
 * @see createResolutionHook - Factory implementation
 */
export function useRaceResolution(raceId: number | null) {
    const resolution = useRaceResolutionBase(raceId);

    return {
        raceState: resolution.state,
        isLoading: resolution.isLoading,
        error: resolution.error,
        updateValue: resolution.updateValue,
        save: resolution.save,
        cancel: resolution.cancel,
        refreshState: resolution.refreshState,
    };
}
