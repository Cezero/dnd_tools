
import { DraftApi } from '@/services/api/EntityApi';
import type {
    StartEditingResponse,
    DraftSaveResponse,
    CancelEditingResponse,
    UpdateStateValueResponse,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

/**
 * Race resolution API client.
 * 
 * Provides typed methods for interacting with the race editing backend API.
 * All methods handle race state management and updates using user sessions.
 * 
 * Uses the generic DraftApi for most operations.
 * 
 * @see RaceResolutionApi.startEditing - Start editing a race (acquires lock, adds to user session)
 * @see RaceResolutionApi.updateValue - Update a value at a specific path
 * @see RaceResolutionApi.save - Save race state to database
 * @see RaceResolutionApi.cancel - Cancel editing without saving
 */
export const RaceResolutionApi = {
    /**
     * Start editing a race.
     * 
     * Acquires a lock on the race and adds it to the user's editing list.
     * 
     * @param raceId - The race ID
     * @returns Promise resolving to the start editing response
     * 
     * @example
     * ```typescript
     * const result = await RaceResolutionApi.startEditing(123);
     * ```
     */
    startEditing: async (raceId: number): Promise<StartEditingResponse> => {
        return DraftApi.startEditing(DraftType.Race, raceId);
    },

    /**
     * Update a value at a specific path in the race state.
     * 
     * Uses the generic path-based update system. No validation is performed during the update;
     * validation only occurs when the race is saved.
     * 
     * @param raceId - The race ID
     * @param path - The path to update (e.g., 'name', 'sourceBookInfo.editionId')
     * @param value - The new value to set (must be string or number)
     * @returns The updated state
     * 
     * @example
     * ```typescript
     * const result = await RaceResolutionApi.updateValue(123, 'name', 'Elf');
     * ```
     */
    updateValue: async (
        raceId: number,
        path: string,
        value: string | number
    ): Promise<UpdateStateValueResponse> => {
        return DraftApi.updateValue(DraftType.Race, raceId, path, value);
    },

    /**
     * Save race state to database.
     * 
     * @param raceId - The race ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * const result = await RaceResolutionApi.save(123);
     * ```
     */
    save: async (raceId: number): Promise<DraftSaveResponse> => {
        return DraftApi.save(DraftType.Race, raceId);
    },

    /**
     * Cancel editing without saving.
     * 
     * @param raceId - The race ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await RaceResolutionApi.cancel(123);
     * ```
     */
    cancel: async (raceId: number): Promise<CancelEditingResponse> => {
        return DraftApi.cancel(DraftType.Race, raceId);
    },
};

/**
 * Export types for use in components
 */
export type { RaceEditState } from '@shared/schema';
