
import { typedApi } from '@/services/Api';
import type {
    UpdateStateValueRequest,
    UpdateStateValueResponse,
    StartEditingResponse,
    DraftSaveResponse,
    CancelEditingResponse,
} from '@shared/schema';
import {
    DraftRefRequestSchema,
    UpdateStateValueSchema,
    UpdateStateValueResponseSchema,
    StartEditingResponseSchema,
    DraftSaveResponseSchema,
    CancelEditingResponseSchema,
} from '@shared/schema';
import type { DraftAction } from '@shared/static-data';
import { DraftType } from '@shared/static-data';

/**
 * Generic Draft API client.
 * 
 * Provides a unified interface for draft state management operations
 * across all draft types (class, race, feature, character, etc.).
 * 
 * All methods use `typedApi` for type-safe API calls with automatic validation.
 * All routes accept draftType and id in the request body to avoid string/number conversions.
 * 
 * @see DraftApi.startEditing - Start editing a draft
 * @see DraftApi.updateValue - Update a value at a specific path
 * @see DraftApi.save - Save draft state to database
 * @see DraftApi.cancel - Cancel editing without saving
 */
const startEditingApi = typedApi<typeof DraftRefRequestSchema, typeof StartEditingResponseSchema>({
    path: '/drafts/start-editing',
    method: 'POST',
    requestSchema: DraftRefRequestSchema,
    responseSchema: StartEditingResponseSchema,
});

const updateValueApi = typedApi<typeof UpdateStateValueSchema, typeof UpdateStateValueResponseSchema>({
    path: '/drafts/update-value',
    method: 'PUT',
    requestSchema: UpdateStateValueSchema,
    responseSchema: UpdateStateValueResponseSchema,
});

const saveApi = typedApi<typeof DraftRefRequestSchema, typeof DraftSaveResponseSchema>({
    path: '/drafts/save',
    method: 'POST',
    requestSchema: DraftRefRequestSchema,
    responseSchema: DraftSaveResponseSchema,
});

const cancelApi = typedApi<typeof DraftRefRequestSchema, typeof CancelEditingResponseSchema>({
    path: '/drafts/cancel',
    method: 'POST',
    requestSchema: DraftRefRequestSchema,
    responseSchema: CancelEditingResponseSchema,
});

export const DraftApi = {
    /**
     * Start editing a draft.
     * 
     * Acquires a lock on the draft and adds it to the user's editing list.
     * 
     * @param draftType - The draft type (e.g., DraftType.Class, DraftType.Race, DraftType.Feature, DraftType.Character)
     * @param id - The draft ID (use 0 for new drafts)
     * @returns Promise resolving to start editing response
     * 
     * @example
     * ```typescript
     * const result = await DraftApi.startEditing(DraftType.Class, 123);
     * ```
     */
    startEditing: async (draftType: DraftType, id: number, context?: unknown): Promise<StartEditingResponse> => {
        return startEditingApi({
            draftType,
            id,
            ...(context !== undefined && { context }),
        });
    },

    /**
     * Update a value at a specific path in the draft state.
     * 
     * Uses the generic path-based update system. No validation is performed during the update;
     * validation only occurs when the draft is saved.
     * 
     * @param draftType - The draft type (e.g., DraftType.Class, DraftType.Race, DraftType.Feature, DraftType.Character)
     * @param id - The draft ID (use 0 for new drafts)
     * @param path - The path to update (e.g., 'name', 'sourceBookInfo.editionId')
     * @param value - The new value to set (must be string or number)
     * @returns Promise resolving to update response
     * 
     * @example
     * ```typescript
     * const result = await DraftApi.updateValue(DraftType.Class, 123, 'name', 'Fighter');
     * ```
     */
    updateValue: async (
        draftType: DraftType,
        id: number,
        path: string,
        value: string | number | boolean | null,
        action?: DraftAction,
        context?: unknown
    ): Promise<UpdateStateValueResponse> => {
        return updateValueApi({
            draftType,
            id,
            path,
            value,
            ...(action !== undefined && { action }),
            ...(context !== undefined && { context }),
        });
    },

    /**
     * Save draft state to database.
     * 
     * @param draftType - The draft type (e.g., DraftType.Class, DraftType.Race, DraftType.Feature, DraftType.Character)
     * @param id - The draft ID (use 0 for new drafts)
     * @returns Promise resolving to save response
     * 
     * @example
     * ```typescript
     * const result = await DraftApi.save(DraftType.Class, 123);
     * ```
     */
    save: async (draftType: DraftType, id: number, context?: unknown): Promise<DraftSaveResponse> => {
        return saveApi({
            draftType,
            id,
            ...(context !== undefined && { context }),
        });
    },

    /**
     * Cancel editing without saving.
     * 
     * @param draftType - The draft type (e.g., DraftType.Class, DraftType.Race, DraftType.Feature, DraftType.Character)
     * @param id - The draft ID (use 0 for new drafts)
     * @returns Promise resolving to cancel response
     * 
     * @example
     * ```typescript
     * await DraftApi.cancel(DraftType.Class, 123);
     * ```
     */
    cancel: async (draftType: DraftType, id: number, context?: unknown): Promise<CancelEditingResponse> => {
        return cancelApi({
            draftType,
            id,
            ...(context !== undefined && { context }),
        });
    },
};
