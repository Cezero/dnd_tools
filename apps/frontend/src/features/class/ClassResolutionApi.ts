
import { DraftApi } from '@/services/api/EntityApi';
import type {
    StartEditingResponse,
    DraftSaveResponse,
    CancelEditingResponse,
    UpdateStateValueResponse,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

/**
 * Class resolution API client.
 * 
 * Provides typed methods for interacting with the class editing backend API.
 * All methods handle class state management and updates using user sessions.
 * 
 * Uses the generic DraftApi for most operations.
 * 
 * @see ClassResolutionApi.startEditing - Start editing a class (acquires lock, adds to user session)
 * @see ClassResolutionApi.updateValue - Update a value at a specific path
 * @see ClassResolutionApi.save - Save class state to database
 * @see ClassResolutionApi.cancel - Cancel editing without saving
 */
export const ClassResolutionApi = {
    /**
     * Start editing a class.
     * 
     * Acquires a lock on the class and adds it to the user's editing list.
     * 
     * @param classId - The class ID
     * @returns Promise resolving to the start editing response
     * 
     * @example
     * ```typescript
     * const result = await ClassResolutionApi.startEditing(123);
     * ```
     */
    startEditing: async (classId: number): Promise<StartEditingResponse> => {
        return DraftApi.startEditing(DraftType.Class, classId);
    },

    /**
     * Update a value at a specific path in the class state.
     * 
     * Uses the generic path-based update system. No validation is performed during the update;
     * validation only occurs when the class is saved.
     * 
     * @param classId - The class ID
     * @param path - The path to update (e.g., 'name', 'sourceBookInfo.editionId', 'spellcastingProgression.0.level')
     * @param value - The new value to set (must be string or number)
     * @returns The updated state
     * 
     * @example
     * ```typescript
     * const result = await ClassResolutionApi.updateValue(123, 'name', 'Fighter');
     * ```
     */
    updateValue: async (
        classId: number,
        path: string,
        value: string | number
    ): Promise<UpdateStateValueResponse> => {
        return DraftApi.updateValue(DraftType.Class, classId, path, value);
    },

    /**
     * Save class state to database.
     * 
     * @param classId - The class ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * const result = await ClassResolutionApi.save(123);
     * ```
     */
    save: async (classId: number): Promise<DraftSaveResponse> => {
        return DraftApi.save(DraftType.Class, classId);
    },

    /**
     * Cancel editing without saving.
     * 
     * @param classId - The class ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await ClassResolutionApi.cancel(123);
     * ```
     */
    cancel: async (classId: number): Promise<CancelEditingResponse> => {
        return DraftApi.cancel(DraftType.Class, classId);
    },
};

/**
 * Export types for use in components
 */
export type { ClassEditState } from '@shared/schema';
