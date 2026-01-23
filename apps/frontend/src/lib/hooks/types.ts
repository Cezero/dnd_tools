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
 *   fetchEntity: ClassResolutionApi.fetchEntity,
 *   cancel: ClassResolutionApi.cancel
 * }), []);
 * ```
 * 
 * **Usage Pattern**:
 * ```typescript
 * const api: ResolutionApi<number, ClassEditState, ClassUpdate, unknown> = {
 *   startEditing: ClassResolutionApi.startEditing,
 *   fetchEntity: ClassResolutionApi.fetchEntity,
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
     * State management is transparent - this returns only success/failure.
     * The actual entity data should be fetched using `fetchEntity()` after this succeeds.
     * 
     * @param entityId - The entity ID
     * @returns Promise resolving to success response
     */
    startEditing: (entityId: TEntityId) => Promise<{ success: boolean; id?: number }>;

    /**
     * Fetch entity data using normal entity services.
     * 
     * **IMPORTANT**: This should use normal entity services (e.g., `getFeatureById()`, `getClassById()`),
     * NOT state management endpoints. State management is transparent to the frontend.
     * 
     * @param entityId - The entity ID
     * @returns Promise resolving to entity data
     */
    fetchEntity: (entityId: TEntityId) => Promise<{ state: TState | null }>;

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
 * - `updateValue`: Update a field value at a specific path
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
 * await resolution.updateValue('name', 'New Name');
 * ```
 */
export interface ResolutionHookResult<TState, TUpdate> {
    /** Current entity state (null if not loaded) */
    state: TState | null;
    /** Loading state for async operations */
    isLoading: boolean;
    /** Error state for failed operations */
    error: string | null;
    /** Save entity state to database */
    save: () => Promise<void>;
    /** Cancel editing without saving */
    cancel: () => Promise<void>;
    /** Refresh entity state from backend */
    refreshState: () => Promise<void>;
}

