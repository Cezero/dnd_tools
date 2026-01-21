import { useMemo, useCallback } from 'react';

import type { FeatureUpdate, FeatureState } from '@shared/schema';
import type { ResolutionApi, ResolutionHookResult } from './types';

import { useGenericResolution } from './useGenericResolution';
import { FeatureResolutionApi } from '../../services/api/FeatureResolutionApi';

/**
 * React hook for managing feature editing.
 * 
 * Provides a convenient wrapper around `useGenericResolution` specifically for features.
 * Handles editing lifecycle: start editing, update, save, cancel.
 * 
 * **Editing Lifecycle**:
 * 1. **Start Editing**: Automatically starts editing on mount (acquires lock, adds to user session)
 * 2. **Updates**: Applies updates to feature state via `applyUpdate()`
 * 3. **Persistence**: Saves feature state to database via `save()`
 * 4. **Cleanup**: Cancels editing on unmount if not saved
 * 
 * **State Management**:
 * - `state`: Current feature state (null if not loaded)
 * - `isLoading`: Loading state for async operations
 * - `error`: Error state for failed operations
 * 
 * **Note**: No longer tracks `sessionId` - editing state is tracked via user sessions.
 * 
 * **Usage Example**:
 * ```typescript
 * const resolution = useFeatureResolution(featureId);
 * 
 * // Apply update
 * await resolution.applyUpdate({
 *   type: FeatureUpdateType.UpdateFeatureField,
 *   payload: { field: 'name', value: 'New Name' }
 * });
 * 
 * // Save state
 * await resolution.save();
 * ```
 * 
 * **State Isolation**:
 * Editing state is isolated per user session. Changes made during editing
 * are NOT shared with other users via WebSocket. Other users viewing the
 * feature will see database state, not editing state. Only after saving
 * will the changes be visible to other users.
 * 
 * @param featureId - The feature ID to manage editing for (null if not yet loaded)
 * @returns Object containing feature state and operations
 * 
 * @see useGenericResolution - Generic implementation
 * @see FeatureResolutionApi - API client
 * @see packages/shared/docs/feature-system/frontend-components.md - Full documentation
 * 
 * @example
 * ```typescript
 * // In FeatureEditForm component
 * const resolution = useFeatureResolution(featureId);
 * 
 * if (resolution.error) {
 *   return <div>Error: {resolution.error}</div>;
 * }
 * 
 * if (!resolution.state) {
 *   return <div>Loading...</div>;
 * }
 * 
 * // Use state for form
 * <input value={resolution.state.name} />
 * ```
 */
export function useFeatureResolution(
    featureId: number | 'new' | null
): Omit<ResolutionHookResult<FeatureState, FeatureUpdate>, 'save'> & { save: () => Promise<number> } {
    // Memoize API object to ensure stable reference
    // CRITICAL: This prevents infinite loops in useGenericResolution
    // NOTE: save is omitted since we override it below and don't want duplicate API calls
    const api: ResolutionApi<number | 'new', FeatureState, FeatureUpdate, unknown> = useMemo(
        () => ({
            startEditing: async (id: number | 'new') => {
                const result = await FeatureResolutionApi.startEditing(id);
                return {
                    state: result.featureState,
                };
            },
            getState: async (id: number | 'new') => {
                const result = await FeatureResolutionApi.getState(id);
                return {
                    state: result.featureState,
                };
            },
            applyUpdate: async (id: number | 'new', update: FeatureUpdate) => {
                const result = await FeatureResolutionApi.applyUpdate(id, update);
                return {
                    state: result.featureState,
                };
            },
            cancel: async (id: number | 'new') => {
                await FeatureResolutionApi.cancel(id);
            },
        }),
        []
    );

    const genericResolution = useGenericResolution(featureId, api);

    // Override save to return featureId
    // NOTE: We call the API directly, then call genericResolution.save() for cleanup.
    // Since api.save is optional and not provided, genericResolution.save() will skip the API call
    // and just handle state cleanup.
    const save = useCallback(async (): Promise<number> => {
        if (!featureId) {
            throw new Error('Cannot save: featureId is null');
        }
        
        // Call API directly (only once)
        const result = await FeatureResolutionApi.save(featureId);
        
        // Call genericResolution.save() for state cleanup (api.save is not provided, so no duplicate API call)
        await genericResolution.save();
        
        return result.featureId;
    }, [featureId, genericResolution]);

    return {
        state: genericResolution.state,
        isLoading: genericResolution.isLoading,
        error: genericResolution.error,
        applyUpdate: genericResolution.applyUpdate,
        save,
        cancel: genericResolution.cancel,
        refreshState: genericResolution.refreshState,
    };
}
