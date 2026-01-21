import { RaceUpdateType } from '@shared/static-data';

import type { RaceEditState, RaceUpdate } from './types';
import type { UpdateApplierConfig } from '../shared/session/GenericUpdateApplier';

/**
 * Configuration for applying Race updates to state.
 * 
 * Provides strategy functions for all Race update types, allowing the generic
 * update applier to handle Race-specific update logic.
 * 
 * **Note**: Features are now managed independently via the feature state system.
 * Race updates only handle feature linking/unlinking (updating FeatureRaceMap)
 * and race-specific fields. Feature entities are managed through the feature state system.
 * 
 * @see packages/shared/docs/race-system/backend-implementation.md - Full documentation
 */
export const raceUpdateApplierConfig: UpdateApplierConfig<RaceEditState, RaceUpdate> = {
    /**
     * Applies a field update to the race state.
     */
    applyFieldUpdate: (state, field, value) => {
        return {
            ...state,
            [field]: value
        };
    },

    /**
     * Checks if an update is a field update.
     */
    isFieldUpdate: (update) => update.type === RaceUpdateType.UpdateRaceField,

    /**
     * Extracts field name and value from a field update.
     */
    extractFieldUpdate: (update) => {
        if (update.type === RaceUpdateType.UpdateRaceField) {
            return {
                field: update.payload.field,
                value: update.payload.value
            };
        }
        return null;
    },

    /**
     * Checks if an update is a feature update.
     * 
     * For races, this is not applicable since features are managed independently.
     * This method always returns false.
     */
    isProgressionUpdate: () => false,

    /**
     * Applies a feature update to the race state.
     * 
     * Not applicable for races since features are managed independently.
     */
    applyProgressionUpdate: (state) => state,

    /**
     * Checks if an update is an entity update.
     * 
     * For races, this is not applicable since feature entities are managed
     * through the feature state system. This method always returns false.
     */
    isEntityUpdate: () => false,

    /**
     * Applies an entity update to the race state.
     * 
     * Not applicable for races since feature entities are managed through
     * the feature state system.
     */
    applyEntityUpdate: (state) => state,

    /**
     * Checks if an update is a special update (race-specific).
     */
    isSpecialUpdate: (update) => {
        return update.type === RaceUpdateType.LinkFeature ||
            update.type === RaceUpdateType.UnlinkFeature;
    },

    /**
     * Applies a special update to the race state.
     */
    applySpecialUpdate: (state, update) => {
        switch (update.type) {
            case RaceUpdateType.LinkFeature:
                // Add feature ID to featureIds array if not already present
                if (state.featureIds.includes(update.payload.featureId)) {
                    return state;
                }
                return {
                    ...state,
                    featureIds: [...state.featureIds, update.payload.featureId]
                };

            case RaceUpdateType.UnlinkFeature:
                // Remove feature ID from featureIds array
                return {
                    ...state,
                    featureIds: state.featureIds.filter(id => id !== update.payload.featureId)
                };

            default:
                return state;
        }
    }
};
