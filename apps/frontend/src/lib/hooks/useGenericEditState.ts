import { useState, useCallback } from 'react';

/**
 * Configuration for generic edit state hook.
 * 
 * Provides the initial state and reducer function needed to manage
 * entity-specific edit state in a type-safe, reusable way.
 * 
 * @template TState - The state type
 * @template TUpdate - The update operation type (discriminated union)
 */
export interface EditStateConfig<TState, TUpdate> {
    /**
     * Initial state value.
     * 
     * This is the default state when the hook is first initialized.
     * Can be overridden by passing `initialState` parameter to the hook.
     */
    initialState: TState;

    /**
     * Reducer function that applies updates to state.
     * 
     * This function receives the current state and an update operation,
     * and returns the new state. The update is typically a discriminated
     * union with a `type` field and a `payload` field.
     * 
     * **Immutability**: The reducer should return a new state object
     * rather than mutating the existing state.
     * 
     * @param state - Current state
     * @param update - Update operation to apply
     * @returns New state after applying the update
     */
    reducer: (state: TState, update: TUpdate) => TState;
}

/**
 * Generic React hook for managing entity edit state.
 * 
 * Provides a consistent, type-safe pattern for managing edit state
 * across different entity types (Character, Class, Race). Uses a
 * reducer pattern to handle state updates in a predictable way.
 * 
 * **Generic Type Parameters**:
 * - `TState`: The type of the state object
 * - `TUpdate`: The type of update operations (discriminated union)
 * 
 * **State Management Pattern**:
 * - Uses React's `useState` for state storage
 * - Uses `useCallback` to memoize the update function
 * - Applies updates via reducer function for predictable state transitions
 * 
 * **Usage Pattern**:
 * ```typescript
 * const config: EditStateConfig<ClassEditState, ClassEditStateUpdate> = {
 *   initialState: {
 *     classId: null,
 *     name: '',
 *     // ... other fields
 *   },
 *   reducer: (state, update) => {
 *     switch (update.type) {
 *       case ClassEditStateUpdateType.SET_NAME:
 *         return { ...state, name: update.payload.name };
 *       // ... other cases
 *       default:
 *         return state;
 *     }
 *   }
 * };
 * 
 * const { state, updateState } = useGenericEditState(config);
 * ```
 * 
 * **Benefits**:
 * - Consistent state management pattern across all entity types
 * - Type-safe with TypeScript generics
 * - Easy to test (reducer is a pure function)
 * - Predictable state updates
 * - Reusable for any entity type
 * 
 * **Error Handling**:
 * - If reducer throws, the error will propagate to the caller
 * - Reducers should handle all update types or return state unchanged for unknown types
 * 
 * @template TState - The state type
 * @template TUpdate - The update operation type
 * 
 * @param config - Configuration object with initial state and reducer
 * @param initialStateOverride - Optional initial state override (merged with config.initialState)
 * 
 * @returns Object containing current state and update function
 * 
 * @example
 * // Class edit state hook
 * export function useClassEditState(initialState?: Partial<ClassEditState>) {
 *   return useGenericEditState({
 *     initialState: {
 *       classId: null,
 *       name: '',
 *       // ... defaults
 *       ...initialState
 *     },
 *     reducer: (state, update) => {
 *       switch (update.type) {
 *         case ClassEditStateUpdateType.SET_NAME:
 *           return { ...state, name: update.payload.name };
 *         // ... handle all update types
 *         default:
 *           return state;
 *       }
 *     }
 *   });
 * }
 * 
 * @example
 * // Direct usage in component
 * const { state, updateState } = useGenericEditState({
 *   initialState: { count: 0 },
 *   reducer: (state, update) => {
 *     if (update.type === 'INCREMENT') {
 *       return { ...state, count: state.count + 1 };
 *     }
 *     return state;
 *   }
 * });
 * 
 * // Update state
 * updateState({ type: 'INCREMENT' });
 */
export function useGenericEditState<TState, TUpdate>(
    config: EditStateConfig<TState, TUpdate>,
    initialStateOverride?: Partial<TState>
): { state: TState; updateState: (update: TUpdate) => void } {
    const [state, setState] = useState<TState>(() => {
        // Merge initial state with override if provided
        return initialStateOverride
            ? { ...config.initialState, ...initialStateOverride }
            : config.initialState;
    });

    const updateState = useCallback(
        (update: TUpdate) => {
            setState(prev => config.reducer(prev, update));
        },
        [config]
    );

    return { state, updateState };
}
