import { useGenericResolution } from '@/lib/hooks/useGenericResolution';
import { ClassResolutionApi } from '@/services/api/ClassResolutionApi';
import type { ClassEditState, ClassUpdate } from '@shared/schema';

/**
 * Hook for managing class editing sessions.
 * 
 * **Implementation Note**: This hook is a thin wrapper around `useGenericResolution`
 * that provides Class-specific API configuration. All session management logic
 * is handled by the generic hook.
 * 
 * Handles session lifecycle: initialize, resume, update, save, cancel.
 * 
 * @param classId - The class ID to manage session for (null if not yet loaded)
 * @returns Object containing session state and operations
 * 
 * @see useGenericResolution - Generic implementation
 */
export function useClassResolution(classId: number | null) {
    const resolution = useGenericResolution<number, ClassEditState, ClassUpdate>(
        classId,
        {
            initializeSession: async (id: number) => {
                const result = await ClassResolutionApi.initializeSession(id);
                return {
                    sessionId: result.sessionId,
                    state: result.classState
                };
            },
            getSessionState: async (id: number, sessionId: string) => {
                const result = await ClassResolutionApi.getSessionState(id, sessionId);
                return {
                    state: result.classState
                };
            },
            applyUpdate: async (id: number, sessionId: string, update: ClassUpdate) => {
                const result = await ClassResolutionApi.applyUpdate(id, sessionId, update);
                return {
                    state: result.classState
                };
            },
            saveSession: async (id: number, sessionId: string) => {
                await ClassResolutionApi.saveSession(id, sessionId);
            },
            cancelSession: async (id: number, sessionId: string) => {
                await ClassResolutionApi.cancelSession(id, sessionId);
            }
        }
    );

    return {
        sessionId: resolution.sessionId,
        classState: resolution.state,
        isLoading: resolution.isLoading,
        error: resolution.error,
        applyUpdate: resolution.applyUpdate,
        saveSession: resolution.saveSession,
        cancelSession: resolution.cancelSession,
        refreshState: resolution.refreshState,
    };
}
