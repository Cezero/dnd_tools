import { createResolutionHook } from '@/lib/hooks/createResolutionHook';
import { DraftType } from '@shared/static-data';


import { ClassQueryHooks } from './ClassQueryHooks';
import { ClassResolutionApi, type ClassEditState } from './ClassResolutionApi';

const useClassResolutionBase = createResolutionHook<number, ClassEditState, never>({
    draftType: DraftType.Class,
    api: {
        startEditing: ClassResolutionApi.startEditing,
        fetchEntity: async (id: number) => {
            // Fetch class data using normal entity service (NOT state management endpoint)
            const classData = await ClassQueryHooks.getClassById(id);
            return {
                state: classData as ClassEditState,
            };
        },
        cancel: async (id: number) => {
            await ClassResolutionApi.cancel(id);
        },
        save: ClassResolutionApi.save,
    },
});

/**
 * Hook for managing class editing.
 * 
 * **Implementation Note**: This hook is a thin wrapper around `createResolutionHook`
 * that provides Class-specific API configuration. All editing management logic
 * is handled by the factory function.
 * 
 * @param classId - The class ID to manage editing for (null if not yet loaded)
 * @returns Object containing class state and operations
 * 
 * @see createResolutionHook - Factory implementation
 */
export function useClassResolution(classId: number | null) {
    const resolution = useClassResolutionBase(classId);

    return {
        classState: resolution.state,
        isLoading: resolution.isLoading,
        error: resolution.error,
        updateValue: resolution.updateValue,
        save: resolution.save,
        cancel: resolution.cancel,
        refreshState: resolution.refreshState,
    };
}
