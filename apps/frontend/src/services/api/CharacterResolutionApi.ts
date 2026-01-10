import { Api } from '@/services/Api';
import type {
    CharacterUpdate,
    ResolvedCharacterResult,
    SaveSessionResponse,
    GetAvailableFeatsResponse,
} from '@shared/schema';
import {
    ResolvedCharacterResultSchema,
    ApplyCharacterUpdateBodySchema,
    SaveSessionResponseSchema,
    CancelSessionResponseSchema,
    GetAvailableFeatsResponseSchema,
} from '@shared/schema';

/**
 * Character resolution API client.
 * 
 * Provides typed methods for interacting with the character resolution system backend API.
 * All methods handle session lifecycle management, feature resolution, and character updates.
 * 
 * The API client uses Zod schemas for runtime validation of all requests and responses,
 * ensuring type safety and data integrity throughout the application.
 * 
 * @see CharacterResolutionApi.initializeSession - Create a new resolution session
 * @see CharacterResolutionApi.resumeSession - Resume or create a session (always returns a session)
 * @see CharacterResolutionApi.applyUpdate - Apply updates to a session
 * @see CharacterResolutionApi.getCurrentState - Get current session state
 * @see CharacterResolutionApi.saveSession - Save session to database
 * @see CharacterResolutionApi.cancelSession - Cancel session without saving
 * @see CharacterResolutionApi.getAvailableFeats - Get available feats for character
 * 
 * Source: `apps/frontend/src/services/api/CharacterResolutionApi.ts`
 */
export const CharacterResolutionApi = {
    /**
     * Initialize a new resolution session
     */
    initializeSession: async (characterId: number): Promise<ResolvedCharacterResult> => {
        return Api<ResolvedCharacterResult>(
            `/characters/${characterId}/resolution/session`,
            {
                method: 'POST',
                responseSchema: ResolvedCharacterResultSchema,
            }
        );
    },

    /**
     * Resume an existing resolution session or create a new one if none exists.
     * 
     * This method always returns a session. If an active session exists for the character,
     * it returns that session. If no session exists, the backend automatically creates
     * a new session using the same logic as `initializeSession` and returns it.
     * 
     * This eliminates the need for the frontend to make two API calls (resume + initialize)
     * when no session exists, simplifying the code and improving performance.
     * 
     * @param characterId - The ID of the character to resume/create a session for
     * @returns Promise resolving to the resolved character result with session ID
     * 
     * @see CharacterResolutionApi.initializeSession - Manual session initialization (if needed)
     */
    resumeSession: async (characterId: number): Promise<ResolvedCharacterResult> => {
        return Api<ResolvedCharacterResult>(
            `/characters/${characterId}/resolution/session`,
            {
                method: 'GET',
                responseSchema: ResolvedCharacterResultSchema,
            }
        );
    },

    /**
     * Apply an update to the resolution session
     */
    applyUpdate: async (
        characterId: number,
        sessionId: string,
        update: CharacterUpdate
    ): Promise<ResolvedCharacterResult> => {
        return Api<ResolvedCharacterResult>(
            `/characters/${characterId}/resolution/session/${sessionId}`,
            {
                method: 'PATCH',
                body: { update },
                requestSchema: ApplyCharacterUpdateBodySchema,
                responseSchema: ResolvedCharacterResultSchema,
            }
        );
    },

    /**
     * Get current state of resolution session
     */
    getCurrentState: async (
        characterId: number,
        sessionId: string
    ): Promise<ResolvedCharacterResult> => {
        return Api<ResolvedCharacterResult>(
            `/characters/${characterId}/resolution/session/${sessionId}`,
            {
                method: 'GET',
                responseSchema: ResolvedCharacterResultSchema,
            }
        );
    },

    /**
     * Save session to database.
     * 
     * Persists the current resolution session state to the character record in the database.
     * After saving, the session is deleted and the updated character data is returned.
     * 
     * @param characterId - The ID of the character
     * @param sessionId - The ID of the session to save
     * @returns Promise resolving to the save response containing the updated character with all details
     * 
     * @see SaveSessionResponse - Response type containing the updated character
     */
    saveSession: async (
        characterId: number,
        sessionId: string
    ): Promise<SaveSessionResponse> => {
        return Api<SaveSessionResponse>(
            `/characters/${characterId}/resolution/session/${sessionId}/save`,
            {
                method: 'POST',
                responseSchema: SaveSessionResponseSchema,
            }
        );
    },

    /**
     * Cancel session without saving.
     * 
     * Deletes the resolution session without persisting any changes to the character.
     * This is useful when the user wants to discard their edits and start fresh.
     * 
     * The backend returns `{ success: boolean }` but this is transformed to `void`
     * since the frontend doesn't need the success value - the absence of an error
     * indicates success.
     * 
     * @param characterId - The ID of the character
     * @param sessionId - The ID of the session to cancel
     * @returns Promise resolving to void (success is indicated by lack of error)
     */
    cancelSession: async (
        characterId: number,
        sessionId: string
    ): Promise<void> => {
        return Api<void>(
            `/characters/${characterId}/resolution/session/${sessionId}`,
            {
                method: 'DELETE',
                responseSchema: CancelSessionResponseSchema,
            }
        );
    },

    /**
     * Get available feats for a character.
     * 
     * Returns a list of feats that are available for selection by the character,
     * filtered by prerequisites, proficiencies, and other character-specific requirements.
     * 
     * The response includes:
     * - `results`: Array of available feats with their details
     * - `total`: Total count of available feats
     * 
     * Feats are filtered based on:
     * - Character level and class levels
     * - Prerequisites (ability scores, feats, skills, etc.)
     * - Proficiencies and other character attributes
     * - Already selected feats
     * 
     * @param characterId - The ID of the character
     * @returns Promise resolving to the available feats response with results and total count
     * 
     * @see GetAvailableFeatsResponse - Response type containing feat results and total count
     */
    getAvailableFeats: async (characterId: number): Promise<GetAvailableFeatsResponse> => {
        return Api<GetAvailableFeatsResponse>(
            `/characters/${characterId}/resolution/available-feats`,
            {
                method: 'GET',
                responseSchema: GetAvailableFeatsResponseSchema,
            }
        );
    },
};

/**
 * Export types for use in components
 */
export type { CharacterUpdate, ResolvedCharacterResult } from '@shared/schema';










