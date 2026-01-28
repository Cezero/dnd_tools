
import { typedApi } from '@/services/Api';
import { DraftApi } from '@/services/api/EntityApi';
import type {
    ResolvedCharacterResult,
    StartEditingResponse,
    DraftSaveResponse,
    CancelEditingResponse,
    GetAvailableFeatsResponse,
    UpdateStateValueResponse,
} from '@shared/schema';
import { GetAvailableFeatsResponseSchema, GetCharacterResolveResponseSchema, CharacterIdParamSchema, IdParamSchema } from '@shared/schema';
import { DraftType } from '@shared/static-data';

/**
 * Character resolution API client.
 * 
 * Provides typed methods for interacting with the character editing backend API.
 * All methods handle character state management and updates using user sessions.
 * 
 * Uses the generic DraftApi for most operations. Character-specific endpoints
 * like getAvailableFeats are kept separate.
 * 
 * @see CharacterResolutionApi.startEditing - Start editing a character (acquires lock, adds to user session)
 * @see CharacterResolutionApi.updateValue - Update a value at a specific path
 * @see CharacterResolutionApi.save - Save character state to database
 * @see CharacterResolutionApi.cancel - Cancel editing without saving
 * @see CharacterResolutionApi.getAvailableFeats - Get available feats for character
 */
const getAvailableFeatsApi = typedApi<undefined, typeof GetAvailableFeatsResponseSchema, typeof IdParamSchema>({
    path: '/characters/:id/available-feats',
    method: 'GET',
    paramsSchema: IdParamSchema,
    responseSchema: GetAvailableFeatsResponseSchema,
});

const getResolvedApi = typedApi<undefined, typeof GetCharacterResolveResponseSchema, typeof CharacterIdParamSchema>({
    path: '/characters/:id/resolve',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: GetCharacterResolveResponseSchema,
});

export const CharacterResolutionApi = {
    /**
     * Start editing a character.
     * 
     * Acquires a lock on the character and adds it to the user's editing list.
     * Also triggers character resolution and subscribes to WebSocket updates.
     * 
     * @param characterId - The character ID
     * @returns Promise resolving to the start editing response
     * 
     * @example
     * ```typescript
     * const result = await CharacterResolutionApi.startEditing(123);
     * // Frontend should also subscribe to character resolution via WebSocket
     * ```
     */
    startEditing: async (characterId: number): Promise<StartEditingResponse> => {
        // Draft-only create uses `DraftApi.startEditing(DraftType.Character, 0)` which mints a negative id
        // and already acquires the lock/session for that draft. Avoid a redundant API call when the caller
        // later initializes the character resolution hook with the minted negative id.
        if (characterId < 0) {
            return { success: true, draftType: DraftType.Character, id: characterId };
        }

        return DraftApi.startEditing(DraftType.Character, characterId);
    },

    /**
     * Update a value at a specific path in the character state.
     * 
     * Uses the generic path-based update system. No validation is performed during the update;
     * validation only occurs when the character is saved.
     * 
     * After update, character resolution is triggered and published via WebSocket.
     * 
     * @param characterId - The character ID
     * @param path - The path to update (e.g., 'level', 'raceId', 'abilityScores.0.value')
     * @param value - The new value to set (must be string or number)
     * @returns The updated state
     * 
     * @example
     * ```typescript
     * const result = await CharacterResolutionApi.updateValue(123, 'level', 5);
     * ```
     */
    updateValue: async (
        characterId: number,
        path: string,
        value: string | number
    ): Promise<UpdateStateValueResponse> => {
        return DraftApi.updateValue(DraftType.Character, characterId, path, value);
    },

    /**
     * Save character state to database.
     * 
     * @param characterId - The character ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * const result = await CharacterResolutionApi.save(123);
     * ```
     */
    save: async (characterId: number): Promise<DraftSaveResponse> => {
        return DraftApi.save(DraftType.Character, characterId);
    },

    /**
     * Cancel editing without saving.
     * 
     * @param characterId - The character ID
     * @returns Promise resolving to cancel response
     * 
     * @example
     * ```typescript
     * await CharacterResolutionApi.cancel(123);
     * ```
     */
    cancel: async (characterId: number): Promise<CancelEditingResponse> => {
        return DraftApi.cancel(DraftType.Character, characterId);
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
     * 
     * @example
     * ```typescript
     * const feats = await CharacterResolutionApi.getAvailableFeats(123);
     * console.log(`Found ${feats.total} available feats`);
     * ```
     */
    getAvailableFeats: async (characterId: number): Promise<GetAvailableFeatsResponse> => {
        return getAvailableFeatsApi({ id: characterId });
    },

    /**
     * Get resolved character (read-only, no lock/session).
     * Used by admin character explorer. Runs the full resolution pipeline on the backend.
     *
     * @param characterId - The character ID
     * @returns Promise resolving to { resolvedCharacter: ResolvedCharacterResult }
     */
    getResolved: async (characterId: number): Promise<{ resolvedCharacter: ResolvedCharacterResult }> => {
        return getResolvedApi({ id: characterId });
    },
};

/**
 * Export types for use in components
 */
export type { ResolvedCharacterResult } from '@shared/schema';
