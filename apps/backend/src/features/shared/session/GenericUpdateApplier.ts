/**
 * Configuration for generic update applier.
 * 
 * Provides strategy functions for applying different types of updates to state.
 * This allows entity-specific logic while sharing common update patterns.
 * 
 * @template TState - The session state type
 * @template TUpdate - The update operation type (discriminated union)
 */
export interface UpdateApplierConfig<TState, TUpdate> {
    /**
     * Applies a field update to the state.
     * 
     * Used for updates like UPDATE_CLASS_FIELD or UPDATE_RACE_FIELD.
     * 
     * @param state - Current state
     * @param field - Field name to update
     * @param value - New field value
     * @returns Updated state
     */
    applyFieldUpdate: (state: TState, field: string, value: unknown) => TState;

    /**
     * Checks if an update type is a field update.
     * 
     * @param update - The update to check
     * @returns True if this is a field update
     */
    isFieldUpdate: (update: TUpdate) => boolean;

    /**
     * Extracts field name and value from a field update.
     * 
     * @param update - The field update
     * @returns Object with field name and value, or null if not a field update
     */
    extractFieldUpdate: (update: TUpdate) => { field: string; value: unknown } | null;

    /**
     * Checks if an update type is a feature update.
     * 
     * @param update - The update to check
     * @returns True if this is a feature update
     */
    isProgressionUpdate: (update: TUpdate) => boolean;

    /**
     * Applies a feature update to the state.
     * 
     * Handles ADD_PROGRESSION, UPDATE_PROGRESSION, REMOVE_PROGRESSION.
     * 
     * @param state - Current state
     * @param update - The feature update
     * @returns Updated state
     */
    applyProgressionUpdate: (state: TState, update: TUpdate) => TState;

    /**
     * Checks if an update type is an entity update.
     * 
     * @param update - The update to check
     * @returns True if this is an entity update
     */
    isEntityUpdate: (update: TUpdate) => boolean;

    /**
     * Applies an entity update to the state.
     * 
     * Handles ADD_ENTITY, UPDATE_ENTITY, REMOVE_ENTITY.
     * 
     * @param state - Current state
     * @param update - The entity update
     * @returns Updated state
     */
    applyEntityUpdate: (state: TState, update: TUpdate) => TState;

    /**
     * Checks if an update type is a special update (entity-specific).
     * 
     * @param update - The update to check
     * @returns True if this is a special update
     */
    isSpecialUpdate: (update: TUpdate) => boolean;

    /**
     * Applies a special update to the state.
     * 
     * Handles entity-specific updates like SET_SPELLCASTING_PROGRESSION.
     * 
     * @param state - Current state
     * @param update - The special update
     * @returns Updated state
     */
    applySpecialUpdate: (state: TState, update: TUpdate) => TState;
}

/**
 * Applies an update to the session state using the provided configuration.
 * 
 * This function handles action-based updates to the state, ensuring immutability
 * and proper state transitions. It delegates to strategy functions in the config
 * to handle entity-specific logic.
 * 
 * **Update Types**:
 * - Field updates: UPDATE_CLASS_FIELD, UPDATE_RACE_FIELD
 * - Feature updates: ADD_PROGRESSION, UPDATE_PROGRESSION, REMOVE_PROGRESSION
 * - Entity updates: ADD_ENTITY, UPDATE_ENTITY, REMOVE_ENTITY
 * - Special updates: Entity-specific updates (e.g., SET_SPELLCASTING_PROGRESSION)
 * 
 * **Usage Example**:
 * ```typescript
 * const config: UpdateApplierConfig<ClassEditState, ClassUpdate> = {
 *   applyFieldUpdate: (state, field, value) => ({ ...state, [field]: value }),
 *   isFieldUpdate: (update) => update.type === 'UPDATE_CLASS_FIELD',
 *   extractFieldUpdate: (update) => 
 *     update.type === 'UPDATE_CLASS_FIELD' 
 *       ? { field: update.payload.field, value: update.payload.value }
 *       : null,
 *   // ... other strategies
 * };
 * 
 * const updatedState = applyUpdateToState(currentState, update, config);
 * ```
 * 
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @param state - Current session state
 * @param update - Update operation to apply
 * @param config - Configuration with strategy functions
 * @returns Updated state
 * 
 * @see UpdateApplierConfig - Configuration interface
 */
export function applyUpdateToState<TState, TUpdate>(
    state: TState,
    update: TUpdate,
    config: UpdateApplierConfig<TState, TUpdate>
): TState {
    // Handle field updates
    if (config.isFieldUpdate(update)) {
        const fieldUpdate = config.extractFieldUpdate(update);
        if (fieldUpdate) {
            return config.applyFieldUpdate(state, fieldUpdate.field, fieldUpdate.value);
        }
    }

    // Handle feature updates
    if (config.isProgressionUpdate(update)) {
        return config.applyProgressionUpdate(state, update);
    }

    // Handle entity updates
    if (config.isEntityUpdate(update)) {
        return config.applyEntityUpdate(state, update);
    }

    // Handle special updates
    if (config.isSpecialUpdate(update)) {
        return config.applySpecialUpdate(state, update);
    }

    // Unknown update type - return state unchanged
    // This allows for no-op updates like LINK_PROGRESSION/UNLINK_PROGRESSION
    // that are handled at the database level
    return state;
}
