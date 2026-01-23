import type { ClassEditState } from '@shared/schema';
import { ClassUpdateType } from '@shared/static-data';

import type { ClassUpdate } from './types';
import type { UpdateApplierConfig } from '../shared/session/GenericUpdateApplier';

/**
 * Configuration for applying Class updates to state.
 * 
 * Provides strategy functions for all Class update types, allowing the generic
 * update applier to handle Class-specific update logic.
 * 
 * **Note**: Features are now managed independently via the feature state system.
 * Class updates only handle feature linking/unlinking (updating FeatureClassMap)
 * and class-specific fields. Feature entities are managed through the feature state system.
 * 
 * @see packages/shared/docs/class-system/backend-implementation.md - Full documentation
 */
export const classUpdateApplierConfig: UpdateApplierConfig<ClassEditState, ClassUpdate> = {
    /**
     * Applies a field update to the class state.
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
    isFieldUpdate: (update) => update.type === ClassUpdateType.UpdateClassField,

    /**
     * Extracts field name and value from a field update.
     */
    extractFieldUpdate: (update) => {
        if (update.type === ClassUpdateType.UpdateClassField) {
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
     * For classes, this is not applicable since features are managed independently.
     * This method always returns false.
     */
    isProgressionUpdate: () => false,

    /**
     * Applies a feature update to the class state.
     * 
     * Not applicable for classes since features are managed independently.
     */
    applyProgressionUpdate: (state) => state,

    /**
     * Checks if an update is an entity update.
     * 
     * For classes, this is not applicable since feature entities are managed
     * through the feature state system. This method always returns false.
     */
    isEntityUpdate: () => false,

    /**
     * Applies an entity update to the class state.
     * 
     * Not applicable for classes since feature entities are managed through
     * the feature state system.
     */
    applyEntityUpdate: (state) => state,

    /**
     * Checks if an update is a special update (class-specific).
     */
    isSpecialUpdate: (update) => {
        return update.type === ClassUpdateType.SetSpellcastingProgression ||
            update.type === ClassUpdateType.SetSpellsKnownProgression ||
            update.type === ClassUpdateType.LinkFeature ||
            update.type === ClassUpdateType.UnlinkFeature;
    },

    /**
     * Applies a special update to the class state.
     */
    applySpecialUpdate: (state, update) => {
        switch (update.type) {
            case ClassUpdateType.SetSpellcastingProgression:
                return {
                    ...state,
                    spellcastingProgression: update.payload.progression as typeof state.spellcastingProgression
                };

            case ClassUpdateType.SetSpellsKnownProgression:
                return {
                    ...state,
                    spellsKnownProgression: update.payload.progression as typeof state.spellsKnownProgression
                };

            case ClassUpdateType.LinkFeature:
                // Add feature ID to featureIds array if not already present
                if (state.featureIds.includes(update.payload.featureId)) {
                    return state;
                }
                return {
                    ...state,
                    featureIds: [...state.featureIds, update.payload.featureId]
                };

            case ClassUpdateType.UnlinkFeature:
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
