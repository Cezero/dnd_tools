/**
 * Generic types for session and state management hooks.
 * 
 * These types provide the foundation for type-safe session and state management
 * across different entity types (Character, Class, Race).
 */

/**
 * API interface for resolution operations.
 * 
 * Provides a consistent interface for entity editing operations across different entity types.
 * This interface is implemented by entity-specific API clients (e.g., ClassResolutionApi).
 * 
 * **Note**: This interface no longer uses entity-specific sessions. Instead, it uses
 * user sessions to track editing state. The user's session tracks which entities they're editing.
 * 
 * **CRITICAL - Dependency Array Warning**:
 * Objects implementing this interface (or any API object) should NEVER be included in
 * React hook dependency arrays (`useEffect`, `useCallback`, `useMemo`). API methods are
 * stable function references that don't change between renders. Including API objects in
 * dependency arrays causes infinite re-renders and continuous API queries.
 * 
 * **Required Pattern**:
 * When passing an API object to `useGenericResolution` or similar hooks, the API object
 * MUST be memoized using `useMemo` to ensure a stable reference across renders:
 * ```typescript
 * const api = useMemo(() => ({
 *   startEditing: ClassResolutionApi.startEditing,
 *   getState: ClassResolutionApi.getState,
 *   applyUpdate: ClassResolutionApi.applyUpdate,
 *   cancel: ClassResolutionApi.cancel
 * }), []);
 * ```
 * 
 * **Usage Pattern**:
 * ```typescript
 * const api: ResolutionApi<number, ClassEditState, ClassUpdate, unknown> = {
 *   startEditing: ClassResolutionApi.startEditing,
 *   getState: ClassResolutionApi.getState,
 *   applyUpdate: ClassResolutionApi.applyUpdate,
 *   cancel: ClassResolutionApi.cancel
 * };
 * ```
 * 
 * **Note**: `save` is not part of the API interface. Hooks should override the `save` method
 * to call the API directly, then call `genericResolution.save()` for state cleanup.
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The entity state type
 * @template TUpdate - The update operation type
 * @template TResolved - The resolved result type (may be same as TState or extended)
 * 
 * @example
 * ```typescript
 * // Class resolution API implementation
 * export const ClassResolutionApi: ResolutionApi<number, ClassEditState, ClassUpdate, unknown> = {
 *   startEditing: async (classId) => {
 *     const response = await fetch(`/api/classes/${classId}/start-editing`, { method: 'POST' });
 *     return response.json();
 *   },
 *   // ... other methods
 * };
 * ```
 */
export interface ResolutionApi<TEntityId, TState, TUpdate, TResolved> {
    /**
     * Start editing an entity.
     * 
     * Acquires a lock and adds entity to user's editing list.
     * 
     * @param entityId - The entity ID
     * @returns Promise resolving to state
     */
    startEditing: (entityId: TEntityId) => Promise<{ state: TState }>;

    /**
     * Get current entity state.
     * 
     * @param entityId - The entity ID
     * @returns Promise resolving to state
     */
    getState: (entityId: TEntityId) => Promise<{ state: TState }>;

    /**
     * Apply an update to the entity state.
     * 
     * @param entityId - The entity ID
     * @param update - The update operation
     * @returns Promise resolving to updated state
     */
    applyUpdate: (entityId: TEntityId, update: TUpdate) => Promise<{ state: TState }>;

    /**
     * Cancel editing without saving.
     * 
     * @param entityId - The entity ID
     * @returns Promise resolving when cancel is complete
     */
    cancel: (entityId: TEntityId) => Promise<void>;
}

/**
 * Result type for generic resolution hook.
 * 
 * Returned by `useGenericResolution` hook. Provides entity state and operations
 * for managing entity editing.
 * 
 * **State Management**:
 * - `state`: Current entity state (null if not loaded)
 * - `isLoading`: True during async operations
 * - `error`: Error message if operation failed (null if no error)
 * 
 * **Operations**:
 * - `applyUpdate`: Apply an update to the entity state
 * - `save`: Save entity state to database
 * - `cancel`: Cancel editing without saving
 * - `refreshState`: Refresh state from backend
 * 
 * **Note**: No longer tracks `sessionId` - editing state is tracked via user sessions.
 * 
 * @template TState - The entity state type
 * @template TUpdate - The update operation type
 * 
 * @example
 * ```typescript
 * const resolution = useGenericResolution(classId, ClassResolutionApi);
 * 
 * if (resolution.error) {
 *   console.error('Error:', resolution.error);
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
    /** Current entity state (null if not loaded) */
    state: TState | null;
    /** Loading state for async operations */
    isLoading: boolean;
    /** Error state for failed operations */
    error: string | null;
    /** Apply an update to the entity state */
    applyUpdate: (update: TUpdate) => Promise<TState | null>;
    /** Save entity state to database */
    save: () => Promise<void>;
    /** Cancel editing without saving */
    cancel: () => Promise<void>;
    /** Refresh entity state from backend */
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
