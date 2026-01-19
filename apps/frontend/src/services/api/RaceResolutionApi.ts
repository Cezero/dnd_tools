import { Api } from '@/services/Api';
import type {
    RaceUpdate,
    RaceEditState,
    InitializeRaceSessionResponse,
    GetRaceSessionStateResponse,
    ApplyRaceUpdateResponse,
} from '@shared/schema';
import {
    InitializeRaceSessionResponseSchema,
    GetRaceSessionStateResponseSchema,
    ApplyRaceUpdateBodySchema,
    ApplyRaceUpdateResponseSchema,
} from '@shared/schema';

/**
 * Race resolution API client.
 * 
 * Provides typed methods for interacting with the race editing session backend API.
 * All methods handle session lifecycle management and race updates.
 * 
 * @see RaceResolutionApi.initializeSession - Create or resume a race editing session
 * @see RaceResolutionApi.getSessionState - Get current session state
 * @see RaceResolutionApi.applyUpdate - Apply updates to a session
 * @see RaceResolutionApi.saveSession - Save session to database
 * @see RaceResolutionApi.cancelSession - Cancel session without saving
 */
export const RaceResolutionApi = {
    /**
     * Initialize or resume a race editing session
     */
    initializeSession: async (raceId: number): Promise<InitializeRaceSessionResponse> => {
        return Api<InitializeRaceSessionResponse>(
            `/races/${raceId}/session`,
            {
                method: 'POST',
                responseSchema: InitializeRaceSessionResponseSchema,
            }
        );
    },

    /**
     * Get current session state
     */
    getSessionState: async (
        raceId: number,
        sessionId: string
    ): Promise<GetRaceSessionStateResponse> => {
        return Api<GetRaceSessionStateResponse>(
            `/races/${raceId}/session/${sessionId}`,
            {
                method: 'GET',
                responseSchema: GetRaceSessionStateResponseSchema,
            }
        );
    },

    /**
     * Apply an update to the session
     */
    applyUpdate: async (
        raceId: number,
        sessionId: string,
        update: RaceUpdate
    ): Promise<ApplyRaceUpdateResponse> => {
        return Api<ApplyRaceUpdateResponse>(
            `/races/${raceId}/session/${sessionId}`,
            {
                method: 'PATCH',
                body: { update },
                requestSchema: ApplyRaceUpdateBodySchema,
                responseSchema: ApplyRaceUpdateResponseSchema,
            }
        );
    },

    /**
     * Save session to database
     */
    saveSession: async (raceId: number, sessionId: string): Promise<{ race: any }> => {
        // TODO: Add proper schema for save response
        return Api<{ race: any }>(
            `/races/${raceId}/session/${sessionId}/save`,
            {
                method: 'POST',
            }
        );
    },

    /**
     * Cancel session without saving
     */
    cancelSession: async (raceId: number, sessionId: string): Promise<void> => {
        return Api<void>(
            `/races/${raceId}/session/${sessionId}`,
            {
                method: 'DELETE',
            }
        );
    },
};

/**
 * Export types for use in components
 */
export type { RaceUpdate, RaceEditState } from '@shared/schema';
