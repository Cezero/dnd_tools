import { useMemo, useCallback } from 'react';

import { useGenericResolution } from '@/lib/hooks/useGenericResolution';
import { ClassResolutionApi } from '@/services/api/ClassResolutionApi';
import type { ClassEditState, ClassUpdate } from '@shared/schema';
import type { ResolutionApi } from '@/lib/hooks/types';

/**
 * Hook for managing class editing.
 * 
 * **Implementation Note**: This hook is a thin wrapper around `useGenericResolution`
 * that provides Class-specific API configuration. All editing management logic
 * is handled by the generic hook.
 * 
 * **CRITICAL**: The `api` object is memoized using `useMemo` to prevent infinite loops.
 * The `api` object must be stable across renders - if it's recreated on every render,
 * it will cause `useGenericResolution`'s initialization effect to run repeatedly, causing
 * infinite API queries. The `api` object should NEVER be included in any dependency arrays.
 * 
 * @param classId - The class ID to manage editing for (null if not yet loaded)
 * @returns Object containing class state and operations
 * 
 * @see useGenericResolution - Generic implementation
 */
export function useClassResolution(classId: number | null) {
    // Memoize API object to prevent recreation on every render
    const api: ResolutionApi<number, ClassEditState, ClassUpdate, unknown> = useMemo(() => ({
        startEditing: async (id: number) => {
            const result = await ClassResolutionApi.startEditing(id);
            return {
                state: result.classState
            };
        },
        getState: async (id: number) => {
            const result = await ClassResolutionApi.getState(id);
            return {
                state: result.classState
            };
        },
        applyUpdate: async (id: number, update: ClassUpdate) => {
            const result = await ClassResolutionApi.applyUpdate(id, update);
            return {
                state: result.classState
            };
        },
        cancel: async (id: number) => {
            await ClassResolutionApi.cancel(id);
        }
    }), []);

    const resolution = useGenericResolution<number, ClassEditState, ClassUpdate>(
        classId,
        api
    );

    // Override save to call API directly, then use genericResolution.save() for cleanup
    // This avoids needing to provide save in the api object
    const save = useCallback(async (): Promise<void> => {
        if (!classId) {
            throw new Error('Cannot save: classId is null');
        }
        
        // Call API directly (syncs state from Redis to MySQL)
        await ClassResolutionApi.save(classId);
        
        // Call genericResolution.save() for state cleanup (api.save is not provided, so no duplicate API call)
        await resolution.save();
    }, [classId, resolution]);

    return {
        classState: resolution.state,
        isLoading: resolution.isLoading,
        error: resolution.error,
        applyUpdate: resolution.applyUpdate,
        save,
        cancel: resolution.cancel,
        refreshState: resolution.refreshState,
    };
}
