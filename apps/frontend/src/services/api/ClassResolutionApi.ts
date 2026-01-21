import { Api } from '@/services/Api';
import type {
    ClassUpdate,
    StartClassEditingResponse,
    GetClassStateResponse,
    ApplyClassUpdateResponse,
    SaveClassStateResponse,
    CancelClassEditingResponse,
} from '@shared/schema';
import {
    StartClassEditingResponseSchema,
    GetClassStateResponseSchema,
    ApplyClassUpdateBodySchema,
    ApplyClassUpdateResponseSchema,
    SaveClassStateResponseSchema,
    CancelClassEditingResponseSchema,
} from '@shared/schema';

/**
 * Class resolution API client.
 * 
 * Provides typed methods for interacting with the class editing backend API.
 * All methods handle class state management and updates using user sessions.
 * 
 * @see ClassResolutionApi.startEditing - Start editing a class (acquires lock, adds to user session)
 * @see ClassResolutionApi.getState - Get current class state
 * @see ClassResolutionApi.applyUpdate - Apply updates to class state
 * @see ClassResolutionApi.save - Save class state to database
 * @see ClassResolutionApi.cancel - Cancel editing without saving
 */
export const ClassResolutionApi = {
    /**
     * Start editing a class.
     * 
     * Acquires a lock on the class and adds it to the user's editing list.
     */
    startEditing: async (classId: number): Promise<StartClassEditingResponse> => {
        return Api<StartClassEditingResponse>(
            `/classes/${classId}/start-editing`,
            {
                method: 'POST',
                responseSchema: StartClassEditingResponseSchema,
            }
        );
    },

    /**
     * Get current class state.
     */
    getState: async (classId: number): Promise<GetClassStateResponse> => {
        return Api<GetClassStateResponse>(
            `/classes/${classId}/state`,
            {
                method: 'GET',
                responseSchema: GetClassStateResponseSchema,
            }
        );
    },

    /**
     * Apply an update to the class state.
     */
    applyUpdate: async (
        classId: number,
        update: ClassUpdate
    ): Promise<ApplyClassUpdateResponse> => {
        return Api<ApplyClassUpdateResponse>(
            `/classes/${classId}/update`,
            {
                method: 'PUT',
                body: { update },
                requestSchema: ApplyClassUpdateBodySchema,
                responseSchema: ApplyClassUpdateResponseSchema,
            }
        );
    },

    /**
     * Save class state to database.
     */
    save: async (classId: number): Promise<SaveClassStateResponse> => {
        return Api<SaveClassStateResponse>(
            `/classes/${classId}/save`,
            {
                method: 'POST',
                responseSchema: SaveClassStateResponseSchema,
            }
        );
    },

    /**
     * Cancel editing without saving.
     */
    cancel: async (classId: number): Promise<CancelClassEditingResponse> => {
        return Api<CancelClassEditingResponse>(
            `/classes/${classId}/cancel`,
            {
                method: 'POST',
                responseSchema: CancelClassEditingResponseSchema,
            }
        );
    },
};

/**
 * Export types for use in components
 */
export type { ClassUpdate, ClassEditState } from '@shared/schema';
