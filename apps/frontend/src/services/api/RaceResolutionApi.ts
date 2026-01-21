import { Api } from '@/services/Api';
import type {
    RaceUpdate,
    StartRaceEditingResponse,
    GetRaceStateResponse,
    ApplyRaceUpdateResponse,
    SaveRaceStateResponse,
    CancelRaceEditingResponse,
} from '@shared/schema';
import {
    StartRaceEditingResponseSchema,
    GetRaceStateResponseSchema,
    ApplyRaceUpdateBodySchema,
    ApplyRaceUpdateResponseSchema,
    SaveRaceStateResponseSchema,
    CancelRaceEditingResponseSchema,
} from '@shared/schema';

/**
 * Race resolution API client.
 * 
 * Provides typed methods for interacting with the race editing backend API.
 * All methods handle race state management and updates using user sessions.
 * 
 * @see RaceResolutionApi.startEditing - Start editing a race (acquires lock, adds to user session)
 * @see RaceResolutionApi.getState - Get current race state
 * @see RaceResolutionApi.applyUpdate - Apply updates to race state
 * @see RaceResolutionApi.save - Save race state to database
 * @see RaceResolutionApi.cancel - Cancel editing without saving
 */
export const RaceResolutionApi = {
    /**
     * Start editing a race.
     * 
     * Acquires a lock on the race and adds it to the user's editing list.
     */
    startEditing: async (raceId: number): Promise<StartRaceEditingResponse> => {
        return Api<StartRaceEditingResponse>(
            `/races/${raceId}/start-editing`,
            {
                method: 'POST',
                responseSchema: StartRaceEditingResponseSchema,
            }
        );
    },

    /**
     * Get current race state.
     */
    getState: async (raceId: number): Promise<GetRaceStateResponse> => {
        return Api<GetRaceStateResponse>(
            `/races/${raceId}/state`,
            {
                method: 'GET',
                responseSchema: GetRaceStateResponseSchema,
            }
        );
    },

    /**
     * Apply an update to the race state.
     */
    applyUpdate: async (
        raceId: number,
        update: RaceUpdate
    ): Promise<ApplyRaceUpdateResponse> => {
        return Api<ApplyRaceUpdateResponse>(
            `/races/${raceId}/update`,
            {
                method: 'PUT',
                body: { update },
                requestSchema: ApplyRaceUpdateBodySchema,
                responseSchema: ApplyRaceUpdateResponseSchema,
            }
        );
    },

    /**
     * Save race state to database.
     */
    save: async (raceId: number): Promise<SaveRaceStateResponse> => {
        return Api<SaveRaceStateResponse>(
            `/races/${raceId}/save`,
            {
                method: 'POST',
                responseSchema: SaveRaceStateResponseSchema,
            }
        );
    },

    /**
     * Cancel editing without saving.
     */
    cancel: async (raceId: number): Promise<CancelRaceEditingResponse> => {
        return Api<CancelRaceEditingResponse>(
            `/races/${raceId}/cancel`,
            {
                method: 'POST',
                responseSchema: CancelRaceEditingResponseSchema,
            }
        );
    },
};

/**
 * Export types for use in components
 */
export type { RaceUpdate, RaceEditState } from '@shared/schema';
