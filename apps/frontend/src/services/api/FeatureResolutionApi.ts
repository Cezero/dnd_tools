import { Api } from '@/services/Api';
import type {
    FeatureUpdate,
    StartFeatureEditingResponse,
    GetFeatureStateResponse,
    ApplyFeatureUpdateResponse,
    SaveFeatureStateResponse,
    CancelFeatureEditingResponse,
} from '@shared/schema';
import {
    StartFeatureEditingResponseSchema,
    GetFeatureStateResponseSchema,
    ApplyFeatureUpdateBodySchema,
    ApplyFeatureUpdateResponseSchema,
    SaveFeatureStateResponseSchema,
    CancelFeatureEditingResponseSchema,
} from '@shared/schema';

import { UserSessionApi } from './UserSessionApi';

/**
 * Feature resolution API client.
 * 
 * Provides typed methods for interacting with the feature editing backend API.
 * All methods handle feature state management and updates using user sessions.
 * 
 * @see FeatureResolutionApi.startEditing - Start editing a feature (acquires lock, adds to user session)
 * @see FeatureResolutionApi.getState - Get current feature state
 * @see FeatureResolutionApi.applyUpdate - Apply updates to feature state
 * @see FeatureResolutionApi.save - Save feature state to database
 * @see FeatureResolutionApi.cancel - Cancel editing without saving
 * 
 * @see packages/shared/docs/feature-system/frontend-components.md - Full documentation
 */
export const FeatureResolutionApi = {
    /**
     * Start editing a feature.
     * 
     * Acquires a lock on the feature and adds it to the user's editing list.
     * For new features (featureId === 'new'), creates a new empty state without acquiring a lock.
     * 
     * Note: The backend also updates the user session, but we call UserSessionApi
     * here as well to ensure the user session is always in sync (Option A pattern).
     */
    startEditing: async (featureId: number | 'new'): Promise<StartFeatureEditingResponse> => {
        // Backend will acquire lock and update user session, but we also update it here
        // to ensure consistency (backend handles it atomically, but this ensures frontend
        // session state is also updated)
        const result = await Api<StartFeatureEditingResponse>(
            `/features/${featureId}/start-editing`,
            {
                method: 'POST',
                responseSchema: StartFeatureEditingResponseSchema,
            }
        );

        // Update user session (backend already does this, but ensures frontend state is synced)
        // Skip for new features since they don't have a real entityId
        if (featureId !== 'new') {
            await UserSessionApi.setEditingEntity('feature', featureId).catch((err) => {
                // Log but don't fail - backend already updated the session
                console.warn('Failed to update user session via UserSessionApi (backend already handled it):', err);
            });
        }

        return result;
    },

    /**
     * Get current feature state.
     */
    getState: async (featureId: number | 'new'): Promise<GetFeatureStateResponse> => {
        return Api<GetFeatureStateResponse>(
            `/features/${featureId}/state`,
            {
                method: 'GET',
                responseSchema: GetFeatureStateResponseSchema,
            }
        );
    },

    /**
     * Apply an update to the feature state.
     */
    applyUpdate: async (
        featureId: number | 'new',
        update: FeatureUpdate
    ): Promise<ApplyFeatureUpdateResponse> => {
        return Api<ApplyFeatureUpdateResponse>(
            `/features/${featureId}/update`,
            {
                method: 'PUT',
                body: { update },
                requestSchema: ApplyFeatureUpdateBodySchema,
                responseSchema: ApplyFeatureUpdateResponseSchema,
            }
        );
    },

    /**
     * Save feature state to database.
     * 
     * For new features (featureId === 'new'), creates the feature and returns the new featureId.
     * For existing features, updates the feature and returns the existing featureId.
     * 
     * Note: The backend also clears the user session, but we call UserSessionApi
     * here as well to ensure the user session is always in sync (Option A pattern).
     */
    save: async (featureId: number | 'new'): Promise<SaveFeatureStateResponse> => {
        const result = await Api<SaveFeatureStateResponse>(
            `/features/${featureId}/save`,
            {
                method: 'POST',
                responseSchema: SaveFeatureStateResponseSchema,
            }
        );

        // Clear from user session (backend already does this, but ensures frontend state is synced)
        // Skip for new features since they don't have a real entityId
        if (featureId !== 'new') {
            await UserSessionApi.clearEditingEntity('feature', featureId).catch((err) => {
                // Log but don't fail - backend already updated the session
                console.warn('Failed to clear user session via UserSessionApi (backend already handled it):', err);
            });
        }

        return result;
    },

    /**
     * Cancel editing without saving.
     * 
     * Note: The backend also clears the user session, but we call UserSessionApi
     * here as well to ensure the user session is always in sync (Option A pattern).
     */
    cancel: async (featureId: number | 'new'): Promise<CancelFeatureEditingResponse> => {
        const result = await Api<CancelFeatureEditingResponse>(
            `/features/${featureId}/cancel`,
            {
                method: 'POST',
                responseSchema: CancelFeatureEditingResponseSchema,
            }
        );

        // Clear from user session (backend already does this, but ensures frontend state is synced)
        // Skip for new features since they don't have a real entityId
        if (featureId !== 'new') {
            await UserSessionApi.clearEditingEntity('feature', featureId).catch((err) => {
                // Log but don't fail - backend already updated the session
                console.warn('Failed to clear user session via UserSessionApi (backend already handled it):', err);
            });
        }

        return result;
    },
};

/**
 * Export types for use in components
 */
export type { FeatureUpdate, FeatureState } from '@shared/schema';
