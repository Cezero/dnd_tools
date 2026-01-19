import { Api } from '@/services/Api';
import type {
    ClassUpdate,
    ClassEditState,
    InitializeClassSessionResponse,
    GetClassSessionStateResponse,
    ApplyClassUpdateResponse,
} from '@shared/schema';
import {
    InitializeClassSessionResponseSchema,
    GetClassSessionStateResponseSchema,
    ApplyClassUpdateBodySchema,
    ApplyClassUpdateResponseSchema,
} from '@shared/schema';

/**
 * Class resolution API client.
 * 
 * Provides typed methods for interacting with the class editing session backend API.
 * All methods handle session lifecycle management and class updates.
 * 
 * @see ClassResolutionApi.initializeSession - Create or resume a class editing session
 * @see ClassResolutionApi.getSessionState - Get current session state
 * @see ClassResolutionApi.applyUpdate - Apply updates to a session
 * @see ClassResolutionApi.saveSession - Save session to database
 * @see ClassResolutionApi.cancelSession - Cancel session without saving
 */
export const ClassResolutionApi = {
    /**
     * Initialize or resume a class editing session
     */
    initializeSession: async (classId: number): Promise<InitializeClassSessionResponse> => {
        return Api<InitializeClassSessionResponse>(
            `/classes/${classId}/session`,
            {
                method: 'POST',
                responseSchema: InitializeClassSessionResponseSchema,
            }
        );
    },

    /**
     * Get current session state
     */
    getSessionState: async (
        classId: number,
        sessionId: string
    ): Promise<GetClassSessionStateResponse> => {
        return Api<GetClassSessionStateResponse>(
            `/classes/${classId}/session/${sessionId}`,
            {
                method: 'GET',
                responseSchema: GetClassSessionStateResponseSchema,
            }
        );
    },

    /**
     * Apply an update to the session
     */
    applyUpdate: async (
        classId: number,
        sessionId: string,
        update: ClassUpdate
    ): Promise<ApplyClassUpdateResponse> => {
        return Api<ApplyClassUpdateResponse>(
            `/classes/${classId}/session/${sessionId}`,
            {
                method: 'PATCH',
                body: { update },
                requestSchema: ApplyClassUpdateBodySchema,
                responseSchema: ApplyClassUpdateResponseSchema,
            }
        );
    },

    /**
     * Save session to database
     */
    saveSession: async (classId: number, sessionId: string): Promise<{ class: any }> => {
        // TODO: Add proper schema for save response
        return Api<{ class: any }>(
            `/classes/${classId}/session/${sessionId}/save`,
            {
                method: 'POST',
            }
        );
    },

    /**
     * Cancel session without saving
     */
    cancelSession: async (classId: number, sessionId: string): Promise<void> => {
        return Api<void>(
            `/classes/${classId}/session/${sessionId}`,
            {
                method: 'DELETE',
            }
        );
    },
};

/**
 * Export types for use in components
 */
export type { ClassUpdate, ClassEditState } from '@shared/schema';
