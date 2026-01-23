import { createResolutionHook } from '@/lib/hooks';
import type { FeatureState } from '@shared/schema';
import { DraftType, FeatureSourceType } from '@shared/static-data';

import { FeatureQueryHooks } from './FeatureQueryHooks';
import { FeatureResolutionApi } from './FeatureResolutionApi';

function createDefaultFeatureState(draftId: number): FeatureState {
    return {
        id: draftId,
        slug: '',
        name: '',
        description: '',
        summary: null,
        displayInCharacterSheet: true,
        sourceType: FeatureSourceType.None,
        level: 1,
        domainId: null,
        featId: null,
        companionId: null,
        editionId: null,
        prerequisites: [],
        entities: [],
        displayConditions: [],
        classes: [],
        races: [],
    };
}

const useFeatureResolutionBase = createResolutionHook<number, FeatureState, never>({
    draftType: DraftType.Feature,
    api: {
        startEditing: FeatureResolutionApi.startEditing,
        fetchEntity: async (id: number) => {
            // For new drafts (id <= 0), return defaults (matches Class/Race semantics).
            if (id <= 0) {
                return {
                    state: createDefaultFeatureState(id),
                };
            }

            // Fetch feature data using normal entity service (NOT state management endpoint)
            const feature = await FeatureQueryHooks.getFeatureById(id);

            // Convert GetFeatureResponse to FeatureState (FeatureWithRelations)
            return {
                state: feature as FeatureState,
            };
        },
        cancel: async (id: number) => {
            await FeatureResolutionApi.cancel(id);
        },
        save: FeatureResolutionApi.save,
    },
});

/**
 * React hook for managing feature editing.
 * 
 * Provides a convenient wrapper around `createResolutionHook` specifically for features.
 * Handles editing lifecycle: start editing, update, save, cancel.
 * 
 * **Editing Lifecycle**:
 * 1. **Start Editing**: Automatically starts editing on mount (acquires lock, adds to user session)
 * 2. **Updates**: Updates feature state via `updateValue(path, value)` for path-based updates
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
 * // Update a field value
 * await resolution.updateValue('name', 'New Name');
 * 
 * // Update a nested field
 * await resolution.updateValue('entities.0.type', 1);
 * 
 * // Save state (returns featureId)
 * const featureId = await resolution.save();
 * ```
 * 
 * **State Isolation**:
 * Editing state is isolated per user session. Changes made during editing
 * are NOT shared with other users via WebSocket. Other users viewing the
 * feature will see database state, not editing state. Only after saving
 * will the changes be visible to other users.
 * 
 * @param featureId - The feature ID to manage editing for (null if not yet loaded, 0 for new features)
 * @returns Object containing feature state and operations
 * 
 * @see createResolutionHook - Factory implementation
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
    featureId: number | null
): ReturnType<typeof useFeatureResolutionBase> {
    return useFeatureResolutionBase(featureId);
}
