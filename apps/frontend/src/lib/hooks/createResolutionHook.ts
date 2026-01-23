import { useCallback, useEffect, useMemo, useState } from 'react';


import { DraftApi } from '@/services/api/EntityApi';
import type { DraftSaveResponse, ValidationError, ValidationErrorResponse } from '@shared/schema';
import type { DraftAction } from '@shared/static-data';
import { DraftType } from '@shared/static-data';

import type { ResolutionApi, ResolutionHookResult } from './types';
import { useGenericResolution } from './useGenericResolution';

type ErrorWithValidationErrors = Error & {
    validationErrors?: ValidationError[];
};

/**
 * Configuration for creating a resolution hook.
 * 
 * @template TEntityId - The entity ID type (typically `number`, where `0` represents new entities)
 * @template TState - The entity state type
 * @template TUpdate - The update operation type
 */
interface ResolutionHookConfig<TEntityId, TState, TUpdate> {
    /** Draft type enum value (e.g., DraftType.Character, DraftType.Class, DraftType.Race, DraftType.Feature) */
    draftType: DraftType;
    /** API methods for resolution operations */
    api: {
        /** Start editing an entity - returns { success: boolean } */
        startEditing: (id: TEntityId) => Promise<{ success: boolean; id?: number }>;
        /** Fetch entity data using normal entity services */
        fetchEntity: (id: TEntityId) => Promise<{ state: TState | null }>;
        /** Cancel editing without saving */
        cancel: (id: TEntityId) => Promise<void>;
        /** Save entity state to database. May return DraftSaveResponse with optional id on success. */
        save: (id: TEntityId) => Promise<DraftSaveResponse>;
    };
}

/**
 * Creates a resolution hook for managing entity editing.
 * 
 * This factory function generates entity-specific resolution hooks that wrap
 * `useGenericResolution` with consistent behavior:
 * - Uses `useMemo` consistently for API object
 * - Implements `updateValue` using `StateManagementApi.updateValue`
 * - Implements `save` with validation error handling
 * - Returns standardized interface
 * 
 * **Update Format**: Uses `DraftApi.updateValue` with `draftType`, `id`, and `path` directly
 * 
 * **State Management**: The backend handles all state management. `updateValue` does
 * NOT call `refreshState()` - components handle their own local state updates if needed.
 * 
 * @template TEntityId - The entity ID type (typically `number`, where `0` represents new entities)
 * @template TState - The entity state type
 * @template TUpdate - The update operation type
 * 
 * @param config - Configuration object
 * @returns A React hook function for managing entity editing
 * 
 * @example
 * ```typescript
 * const useCharacterResolution = createResolutionHook({
 *   draftType: DraftType.Character,
 *   api: {
 *     startEditing: CharacterResolutionApi.startEditing,
 *     fetchEntity: async (id) => ({ state: await CharacterQueryHooks.getCharacterById(id) }),
 *     cancel: CharacterResolutionApi.cancel,
 *     save: CharacterResolutionApi.save,
 *   },
 * });
 * ```
 */
export function createResolutionHook<TEntityId extends number, TState, TUpdate>(
    config: ResolutionHookConfig<TEntityId, TState, TUpdate>
) {
    return function useResolution(
        entityId: TEntityId | null
    ): Omit<ResolutionHookResult<TState, TUpdate>, 'save'> & {
        updateValue: (path: string, value: unknown, action?: DraftAction) => Promise<{ success: boolean; id?: number }>;
        save: () => Promise<number>;
    } {
        const [activeEntityId, setActiveEntityId] = useState<TEntityId | null>(entityId);

        useEffect(() => {
            setActiveEntityId(entityId);
        }, [entityId]);

        // Memoize API object to prevent unnecessary re-renders and effect re-runs
        // CRITICAL: This prevents infinite loops in useGenericResolution
        const api: ResolutionApi<TEntityId, TState, TUpdate, unknown> = useMemo(
            () => ({
                startEditing: config.api.startEditing,
                fetchEntity: config.api.fetchEntity,
                cancel: config.api.cancel,
            }),
            []
        );

        const resolution = useGenericResolution<TEntityId, TState, TUpdate>(
            activeEntityId,
            api,
            setActiveEntityId
        );

        const saveApi = config.api.save;

        // Override save to call API directly, then use genericResolution.save() for cleanup
        // This avoids needing to provide save in the api object
        const save = useCallback(async (): Promise<number> => {
            if (activeEntityId === null) {
                throw new Error(`Cannot save: draft ID is null`);
            }

            // Call API directly (syncs state from Redis to MySQL)
            const result = await saveApi(activeEntityId);

            // Check if save returned validation errors
            if (!result.success) {
                // Create error with validation errors attached
                const validationErrorResponse = result as ValidationErrorResponse;
                const error = new Error('Validation failed') as ErrorWithValidationErrors;
                error.validationErrors = validationErrorResponse.errors;
                throw error;
            }

            // Call genericResolution.save() for state cleanup (api.save is not provided, so no duplicate API call)
            await resolution.save();

            // DraftSaveResponse may have optional id; fall back to entityId when absent
            const id = (result as { id?: number }).id;
            return typeof id === 'number' ? id : activeEntityId;
        }, [activeEntityId, resolution, saveApi]);

        const draftUpdateValue = DraftApi.updateValue as (
            draftType: DraftType,
            id: number,
            path: string,
            value: string | number | boolean | null,
            action?: DraftAction
        ) => Promise<{ success: boolean; id?: number }>;

        // Implement updateValue using DraftApi
        const updateValue = useCallback(
            async (path: string, value: unknown, action?: DraftAction): Promise<{ success: boolean; id?: number }> => {
                if (activeEntityId === null) {
                    throw new Error(`Cannot update value: draft ID is null`);
                }

                const response = await draftUpdateValue(
                    config.draftType,
                    activeEntityId,
                    path,
                    value as string | number | boolean | null,
                    action
                );

                if (!response.success) {
                    console.error('Failed to update state:', response);
                    throw new Error('Failed to update state value');
                }

                // State management is the backend's responsibility
                // Components handle their own local state updates if needed
                return response;
            },
            [activeEntityId, config.draftType, draftUpdateValue]
        );

        return {
            state: resolution.state,
            isLoading: resolution.isLoading,
            error: resolution.error,
            updateValue,
            save,
            cancel: resolution.cancel,
            refreshState: resolution.refreshState,
        };
    };
}
