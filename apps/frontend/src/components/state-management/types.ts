/**
 * Generic state management types.
 * 
 * These types are used by the generic state management system
 * that works across all entity types (feature, class, race, character).
 */

/**
 * Result object returned by state management hooks.
 */
export interface StateManagementHookResult<TState> {
    /**
     * Current entity state (null if not loaded).
     */
    state: TState | null;
    
    /**
     * Loading state for async operations.
     */
    isLoading: boolean;
    
    /**
     * Error state for failed operations.
     */
    error: string | null;
    
    /**
     * Update a value at a specific path in the entity state.
     * 
     * @param path - The field path to update (e.g., 'name', 'entities.0.type')
     * @param value - The new value to set
     */
    updateValue: (path: string, value: unknown) => Promise<void>;
    
    /**
     * Refresh state from backend.
     */
    refreshState: () => Promise<void>;
}
