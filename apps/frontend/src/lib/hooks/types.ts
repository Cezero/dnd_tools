/**
 * Generic types for session and state management hooks.
 * 
 * These types provide the foundation for type-safe session and state management
 * across different entity types (Character, Class, Race).
 */

/**
 * API interface for resolution operations.
 * 
 * Provides a consistent interface for session operations across different entity types.
 * This interface is implemented by entity-specific API clients (e.g., ClassResolutionApi).
 * 
 * **Usage Pattern**:
 * ```typescript
 * const api: ResolutionApi<number, ClassEditState, ClassUpdate, unknown> = {
 *   initializeSession: ClassResolutionApi.initializeSession,
 *   getSessionState: ClassResolutionApi.getSessionState,
 *   applyUpdate: ClassResolutionApi.applyUpdate,
 *   saveSession: ClassResolutionApi.saveSession,
 *   cancelSession: ClassResolutionApi.cancelSession
 * };
 * ```
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * @template TResolved - The resolved result type (may be same as TState or extended)
 * 
 * @example
 * ```typescript
 * // Class resolution API implementation
 * export const ClassResolutionApi: ResolutionApi<number, ClassEditState, ClassUpdate, unknown> = {
 *   initializeSession: async (classId) => {
 *     const response = await fetch(`/api/classes/${classId}/session`, { method: 'POST' });
 *     return response.json();
 *   },
 *   // ... other methods
 * };
 * ```
 */
export interface ResolutionApi<TEntityId, TState, TUpdate, TResolved> {
    /**
     * Initialize or resume a session.
     * 
     * Should return existing session if available, or create new one.
     * 
     * @param entityId - The entity ID
     * @returns Promise resolving to session ID and state
     */
    initializeSession: (entityId: TEntityId) => Promise<{ sessionId: string; state: TState }>;

    /**
     * Get current session state.
     * 
     * @param entityId - The entity ID
     * @param sessionId - The session ID
     * @returns Promise resolving to session state
     */
    getSessionState: (entityId: TEntityId, sessionId: string) => Promise<{ state: TState }>;

    /**
     * Apply an update to the session.
     * 
     * @param entityId - The entity ID
     * @param sessionId - The session ID
     * @param update - The update operation
     * @returns Promise resolving to updated state
     */
    applyUpdate: (entityId: TEntityId, sessionId: string, update: TUpdate) => Promise<{ state: TState }>;

    /**
     * Save session to database.
     * 
     * @param entityId - The entity ID
     * @param sessionId - The session ID
     * @returns Promise resolving when save is complete
     */
    saveSession: (entityId: TEntityId, sessionId: string) => Promise<void>;

    /**
     * Cancel session without saving.
     * 
     * @param entityId - The entity ID
     * @param sessionId - The session ID
     * @returns Promise resolving when cancel is complete
     */
    cancelSession: (entityId: TEntityId, sessionId: string) => Promise<void>;
}

/**
 * Result type for generic resolution hook.
 * 
 * Returned by `useGenericResolution` hook. Provides session state and operations
 * for managing entity editing sessions.
 * 
 * **State Management**:
 * - `sessionId`: Current session ID (null if not initialized)
 * - `state`: Current session state (null if not loaded)
 * - `isLoading`: True during async operations
 * - `error`: Error message if operation failed (null if no error)
 * 
 * **Operations**:
 * - `applyUpdate`: Apply an update to the session
 * - `saveSession`: Save session to database
 * - `cancelSession`: Cancel session without saving
 * - `refreshState`: Refresh state from backend
 * 
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @example
 * ```typescript
 * const resolution = useGenericResolution(classId, ClassResolutionApi);
 * 
 * if (resolution.error) {
 *   console.error('Session error:', resolution.error);
 * }
 * 
 * if (resolution.state) {
 *   console.log('Current state:', resolution.state);
 * }
 * 
 * await resolution.applyUpdate({ type: ClassUpdateType.UpdateClassField, payload: {...} });
 * ```
 */
export interface ResolutionHookResult<TState, TUpdate> {
    /** Current session ID (null if no active session) */
    sessionId: string | null;
    /** Current session state (null if not loaded) */
    state: TState | null;
    /** Loading state for async operations */
    isLoading: boolean;
    /** Error state for failed operations */
    error: string | null;
    /** Apply an update to the session */
    applyUpdate: (update: TUpdate) => Promise<TState | null>;
    /** Save session to database */
    saveSession: () => Promise<void>;
    /** Cancel session without saving */
    cancelSession: () => Promise<void>;
    /** Refresh session state from backend */
    refreshState: () => Promise<void>;
}

/**
 * Configuration for state synchronization.
 * 
 * Used by sync utilities (`useFieldSync`, `useFieldsSync`, `useArraySync`)
 * to determine when and how to sync state changes to the backend.
 * 
 * **Sync Flow**:
 * 1. Sync utility detects state change
 * 2. Calls `shouldSync(prev, curr)` to determine if sync is needed
 * 3. If sync needed, calls `buildUpdate(field, value)` to create update
 * 4. Calls `applyUpdate(update)` to sync to backend
 * 
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @example
 * ```typescript
 * const syncConfig: SyncConfig<ClassEditState, ClassUpdate> = {
 *   getEntityId: (state) => state.classId,
 *   buildUpdate: (field, value) => ({
 *     type: ClassUpdateType.UpdateClassField,
 *     payload: { field, value }
 *   }),
 *   shouldSync: (prev, curr) => prev.name !== curr.name
 * };
 * ```
 */
export interface SyncConfig<TState, TUpdate> {
    /**
     * Get entity ID from state.
     * 
     * @param state - Current state
     * @returns Entity ID or null if not available
     */
    getEntityId: (state: TState) => number | null;

    /**
     * Build update operation from field change.
     * 
     * @param field - Field name that changed
     * @param value - New field value
     * @returns Update operation
     */
    buildUpdate: (field: string, value: unknown) => TUpdate;

    /**
     * Determine if state should be synced.
     * 
     * @param prev - Previous state
     * @param curr - Current state
     * @returns True if state should be synced
     */
    shouldSync: (prev: TState, curr: TState) => boolean;
}
