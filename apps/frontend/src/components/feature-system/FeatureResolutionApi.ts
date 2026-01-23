
import { DraftApi } from '@/services/api/EntityApi';
import { UserSessionApi } from '@/services/api/UserSessionApi';
import type {
    StartEditingResponse,
    DraftSaveResponse,
    CancelEditingResponse,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

/**
 * Feature resolution API client.
 * 
 * Provides typed methods for interacting with the feature editing backend API.
 * All methods handle feature state management and updates using user sessions.
 * 
 * Uses the generic DraftApi for most operations.
 * 
 * @see FeatureResolutionApi.startEditing - Start editing a feature (acquires lock, adds to user session)
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
     * For new features (featureId === 0), creates a new empty state without acquiring a lock.
     * 
     * Note: The backend also updates the user session, but we call UserSessionApi
     * here as well to ensure the user session is always in sync (Option A pattern).
     * 
     * @param featureId - The feature ID (0 for new features)
     * @returns Promise resolving to the start editing response
     * 
     * @example
     * ```typescript
     * // Start editing existing feature
     * const result = await FeatureResolutionApi.startEditing(123);
     * 
     * // Start editing new feature
     * const result = await FeatureResolutionApi.startEditing(0);
     * ```
     */
    startEditing: async (featureId: number): Promise<StartEditingResponse> => {
        const result = await DraftApi.startEditing(DraftType.Feature, featureId);

        // Update user session (backend already does this, but ensures frontend state is synced)
        // Skip for new features since they don't have a real entityId
        if (featureId !== 0) {
            await UserSessionApi.setEditingEntity(DraftType.Feature, featureId).catch((err) => {
                // Log but don't fail - backend already updated the session
                console.warn('Failed to update user session via UserSessionApi (backend already handled it):', err);
            });
        }

        return result;
    },

    /**
     * Save feature state to database.
     * 
     * For new features (featureId === 0), creates the feature and returns the new featureId.
     * For existing features, updates the feature and returns the existing featureId.
     * 
     * If validation fails, throws an error with validation errors that can be caught and displayed.
     * 
     * Note: The backend also clears the user session, but we call UserSessionApi
     * here as well to ensure the user session is always in sync (Option A pattern).
     * 
     * @param featureId - The feature ID (0 for new features)
     * @returns Promise resolving to success response with featureId, or validation errors
     * 
     * @example
     * ```typescript
     * const result = await FeatureResolutionApi.save(123);
     * if (result.success) {
     *   console.log('Feature saved with ID:', result.id);
     * } else {
     *   console.error('Validation errors:', result.errors);
     * }
     * ```
     */
    save: async (featureId: number): Promise<DraftSaveResponse> => {
        const result = await DraftApi.save(DraftType.Feature, featureId);

        // Clear from user session (backend already does this, but ensures frontend state is synced)
        // Skip for new features since they don't have a real entityId
        if (featureId !== 0) {
            await UserSessionApi.clearEditingEntity(DraftType.Feature, featureId).catch((err) => {
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
     * 
     * @param featureId - The feature ID (0 for new features)
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await FeatureResolutionApi.cancel(123);
     * ```
     */
    cancel: async (featureId: number): Promise<CancelEditingResponse> => {
        const result = await DraftApi.cancel(DraftType.Feature, featureId);

        // Clear from user session (backend already does this, but ensures frontend state is synced)
        // Skip for new features since they don't have a real entityId
        if (featureId !== 0) {
            await UserSessionApi.clearEditingEntity(DraftType.Feature, featureId).catch((err) => {
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
export type { FeatureState } from '@shared/schema';
