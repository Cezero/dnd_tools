
import { raceUpdateApplierConfig } from './raceUpdateApplierConfig';
import type { RaceEditState, RaceUpdate } from './types';
import { applyUpdateToState as genericApplyUpdateToState } from '../shared/session/GenericUpdateApplier';

/**
 * Applies an update to the race edit state.
 * 
 * **Implementation Note**: This function delegates to the generic update applier
 * with Race-specific configuration. All update logic is handled by the generic
 * applier using the strategy functions in `raceUpdateApplierConfig`.
 * 
 * This function handles action-based updates to the race state,
 * ensuring immutability and proper state transitions.
 * 
 * @param state - Current race edit state
 * @param update - Update operation to apply
 * @returns Updated race edit state
 * 
 * @see GenericUpdateApplier - Generic implementation
 * @see raceUpdateApplierConfig - Race-specific update strategies
 */
export function applyUpdateToState(state: RaceEditState, update: RaceUpdate): RaceEditState {
    return genericApplyUpdateToState(state, update, raceUpdateApplierConfig);
}
