import { Api } from '@/services/Api';

/**
 * Entity reference type for tracking which entities a user is viewing/editing.
 */
export interface EntityRef {
    entityType: string;
    entityId: number;
}

/**
 * User session response type.
 */
export interface UserSessionResponse {
    viewing: EntityRef[];
    editing: EntityRef[];
}

/**
 * User session API client.
 * 
 * Provides methods for managing user sessions, including tracking which entities
 * a user is viewing or editing.
 * 
 * @see packages/shared/docs/application-overview/entity-state-management.md - Full documentation
 */
export const UserSessionApi = {
    /**
     * Get current user's session.
     * 
     * Returns the list of entities the user is currently viewing and editing.
     */
    getMySession: async (): Promise<UserSessionResponse> => {
        return Api<UserSessionResponse>('/sessions/me', {
            method: 'GET',
        });
    },

    /**
     * Add an entity to the user's viewing list.
     * 
     * @param entityType - The entity type (e.g., 'feature', 'class', 'race')
     * @param entityId - The entity ID
     */
    addViewingEntity: async (entityType: string, entityId: number): Promise<{ success: boolean }> => {
        return Api<{ success: boolean }>('/sessions/me/viewing', {
            method: 'POST',
            body: { entityType, entityId },
        });
    },

    /**
     * Remove an entity from the user's viewing list.
     * 
     * @param entityType - The entity type (e.g., 'feature', 'class', 'race')
     * @param entityId - The entity ID
     */
    removeViewingEntity: async (entityType: string, entityId: number): Promise<{ success: boolean }> => {
        return Api<{ success: boolean }>('/sessions/me/viewing', {
            method: 'DELETE',
            body: { entityType, entityId },
        });
    },

    /**
     * Set an entity as being edited by the user.
     * 
     * Note: This does NOT acquire a lock. Lock acquisition should be handled
     * by the entity-specific resolution API (e.g., FeatureResolutionApi.startEditing).
     * 
     * @param entityType - The entity type (e.g., 'feature', 'class', 'race')
     * @param entityId - The entity ID
     */
    setEditingEntity: async (entityType: string, entityId: number): Promise<{ success: boolean }> => {
        return Api<{ success: boolean }>('/sessions/me/editing', {
            method: 'POST',
            body: { entityType, entityId },
        });
    },

    /**
     * Clear an entity from the user's editing list.
     * 
     * Note: This does NOT release a lock. Lock release should be handled
     * by the entity-specific resolution API (e.g., FeatureResolutionApi.cancel).
     * 
     * @param entityType - The entity type (e.g., 'feature', 'class', 'race')
     * @param entityId - The entity ID
     */
    clearEditingEntity: async (entityType: string, entityId: number): Promise<{ success: boolean }> => {
        return Api<{ success: boolean }>(`/sessions/me/editing?entityType=${entityType}&entityId=${entityId}`, {
            method: 'DELETE',
        });
    },
};
