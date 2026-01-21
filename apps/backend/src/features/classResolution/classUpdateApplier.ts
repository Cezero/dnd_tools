
import { classUpdateApplierConfig } from './classUpdateApplierConfig';
import type { ClassEditState, ClassUpdate } from './types';
import { applyUpdateToState as genericApplyUpdateToState } from '../shared/session/GenericUpdateApplier';

/**
 * Applies an update to the class edit state.
 * 
 * **Implementation Note**: This function delegates to the generic update applier
 * with Class-specific configuration. All update logic is handled by the generic
 * applier using the strategy functions in `classUpdateApplierConfig`.
 * 
 * This function handles action-based updates to the class state,
 * ensuring immutability and proper state transitions.
 * 
 * @param state - Current class edit state
 * @param update - Update operation to apply
 * @returns Updated class edit state
 * 
 * @see GenericUpdateApplier - Generic implementation
 * @see classUpdateApplierConfig - Class-specific update strategies
 */
export function applyUpdateToState(state: ClassEditState, update: ClassUpdate): ClassEditState {
    return genericApplyUpdateToState(state, update, classUpdateApplierConfig);
}
