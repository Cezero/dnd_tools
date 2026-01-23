
import { typedApi } from '@/services/Api';
import {
    DraftRefRequestSchema,
    DraftRefQuerySchema,
    DraftSaveResponseSchema,
    UserSessionResponseSchema,
    type UserSessionResponse,
    type DraftSaveResponse,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

/**
 * User session API client.
 * 
 * Provides methods for managing user sessions, including tracking which entities
 * a user is viewing or editing.
 * 
 * All methods use `typedApi` for type-safe API calls with automatic validation.
 * 
 * @see packages/shared/docs/application-overview/entity-state-management.md - Full documentation
 */
const getMySessionApi = typedApi<undefined, typeof UserSessionResponseSchema>({
    path: '/sessions/me',
    method: 'GET',
    responseSchema: UserSessionResponseSchema,
});

const addViewingEntityApi = typedApi<typeof DraftRefRequestSchema, typeof DraftSaveResponseSchema>({
    path: '/sessions/me/viewing',
    method: 'POST',
    requestSchema: DraftRefRequestSchema,
    responseSchema: DraftSaveResponseSchema,
});

const removeViewingEntityApi = typedApi<typeof DraftRefRequestSchema, typeof DraftSaveResponseSchema>({
    path: '/sessions/me/viewing',
    method: 'DELETE',
    requestSchema: DraftRefRequestSchema,
    responseSchema: DraftSaveResponseSchema,
});

const setEditingEntityApi = typedApi<typeof DraftRefRequestSchema, typeof DraftSaveResponseSchema>({
    path: '/sessions/me/editing',
    method: 'POST',
    requestSchema: DraftRefRequestSchema,
    responseSchema: DraftSaveResponseSchema,
});

const clearEditingEntityApi = typedApi<typeof DraftRefQuerySchema, typeof DraftSaveResponseSchema>({
    path: '/sessions/me/editing',
    method: 'DELETE',
    requestSchema: DraftRefQuerySchema,
    responseSchema: DraftSaveResponseSchema,
});

export const UserSessionApi = {
    /**
     * Get current user's session.
     * 
     * Returns the list of drafts the user is currently viewing and editing.
     * 
     * @returns Promise resolving to the user's session data
     * 
     * @example
     * ```typescript
     * const session = await UserSessionApi.getMySession();
     * console.log(session.viewing); // Array of viewing entities
     * console.log(session.editing); // Array of editing entities
     * ```
     */
    getMySession: async (): Promise<UserSessionResponse> => {
        return getMySessionApi();
    },

    /**
     * Add a draft to the user's viewing list.
     * 
     * @param draftType - The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race)
     * @param id - The draft ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await UserSessionApi.addViewingEntity(DraftType.Feature, 123);
     * ```
     */
    addViewingEntity: async (draftType: DraftType, id: number): Promise<DraftSaveResponse> => {
        return addViewingEntityApi({ draftType, id });
    },

    /**
     * Remove a draft from the user's viewing list.
     * 
     * @param draftType - The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race)
     * @param id - The draft ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await UserSessionApi.removeViewingEntity(DraftType.Feature, 123);
     * ```
     */
    removeViewingEntity: async (draftType: DraftType, id: number): Promise<DraftSaveResponse> => {
        return removeViewingEntityApi({ draftType, id });
    },

    /**
     * Set a draft as being edited by the user.
     * 
     * Note: This does NOT acquire a lock. Lock acquisition should be handled
     * by the draft-specific resolution API (e.g., FeatureResolutionApi.startEditing).
     * 
     * @param draftType - The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race)
     * @param id - The draft ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await UserSessionApi.setEditingEntity(DraftType.Feature, 123);
     * ```
     */
    setEditingEntity: async (draftType: DraftType, id: number): Promise<DraftSaveResponse> => {
        return setEditingEntityApi({ draftType, id });
    },

    /**
     * Clear a draft from the user's editing list.
     * 
     * Note: This does NOT release a lock. Lock release should be handled
     * by the draft-specific resolution API (e.g., FeatureResolutionApi.cancel).
     * 
     * @param draftType - The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race)
     * @param id - The draft ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await UserSessionApi.clearEditingEntity(DraftType.Feature, 123);
     * ```
     */
    clearEditingEntity: async (draftType: DraftType, id: number): Promise<DraftSaveResponse> => {
        // Convert id to string for query params (DraftRefQuerySchema expects string input that transforms to number)
        // typedApi now uses z.input for request types, so we can pass the input type directly
        return clearEditingEntityApi({
            draftType,
            id: String(id),
        });
    },
};
