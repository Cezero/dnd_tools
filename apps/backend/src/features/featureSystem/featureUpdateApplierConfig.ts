import type { FeatureEntity, FeaturePrerequisite, FeatureWithRelations } from '@shared/schema';
import { FeatureUpdateType } from '@shared/static-data';

import type { FeatureUpdate, FeatureState } from '@shared/schema';
import type { UpdateApplierConfig } from '../shared/session/GenericUpdateApplier';

/**
 * Configuration for applying Feature updates to state.
 * 
 * Provides strategy functions for all Feature update types, allowing the generic
 * update applier to handle Feature-specific update logic.
 * 
 * Since features are now independent entities with their own state, updates
 * operate directly on the FeatureWithRelations state.
 * 
 * @see packages/shared/docs/feature-system/backend-implementation.md - Full documentation
 */
export const featureUpdateApplierConfig: UpdateApplierConfig<FeatureState, FeatureUpdate> = {
    /**
     * Applies a field update to the feature state.
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
    isFieldUpdate: (update) => update.type === FeatureUpdateType.UpdateFeatureField,

    /**
     * Extracts field name and value from a field update.
     */
    extractFieldUpdate: (update) => {
        if (update.type === FeatureUpdateType.UpdateFeatureField) {
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
     * For features, this is not applicable since features are the state itself.
     * This method always returns false.
     */
    isProgressionUpdate: () => false,

    /**
     * Applies a feature update to the state.
     * 
     * Not applicable for features since features are the state itself.
     */
    applyProgressionUpdate: (state) => state,

    /**
     * Checks if an update is an entity update.
     */
    isEntityUpdate: (update) => {
        return update.type === FeatureUpdateType.AddEntity ||
            update.type === FeatureUpdateType.UpdateEntity ||
            update.type === FeatureUpdateType.RemoveEntity;
    },

    /**
     * Applies an entity update to the feature state.
     */
    applyEntityUpdate: (state, update) => {
        switch (update.type) {
            case FeatureUpdateType.AddEntity: {
                // Generate a temporary ID for the new entity (will be assigned by database on save)
                const tempId = Date.now(); // Temporary ID, will be replaced on save
                const entityWithFeatureId: FeatureEntity = {
                    ...update.payload.entity,
                    id: tempId,
                    featureId: state.id
                };
                return {
                    ...state,
                    entities: [...(state.entities || []), entityWithFeatureId]
                };
            }

            case FeatureUpdateType.UpdateEntity: {
                const entityIndex = state.entities?.findIndex(e => e.id === update.payload.entityId);
                if (entityIndex === undefined || entityIndex === -1) return state;

                return {
                    ...state,
                    entities: [
                        ...(state.entities || []).slice(0, entityIndex),
                        { ...state.entities![entityIndex], ...update.payload.entity },
                        ...(state.entities || []).slice(entityIndex + 1)
                    ]
                };
            }

            case FeatureUpdateType.RemoveEntity:
                return {
                    ...state,
                    entities: (state.entities || []).filter(e => e.id !== update.payload.entityId)
                };

            default:
                return state;
        }
    },

    /**
     * Checks if an update is a special update (feature-specific).
     * 
     * For features, prerequisite updates are considered "special" updates.
     */
    isSpecialUpdate: (update) => {
        return update.type === FeatureUpdateType.AddPrerequisite ||
            update.type === FeatureUpdateType.UpdatePrerequisite ||
            update.type === FeatureUpdateType.RemovePrerequisite;
    },

    /**
     * Applies a special update to the feature state.
     * 
     * Handles prerequisite updates.
     */
    applySpecialUpdate: (state, update) => {
        switch (update.type) {
            case FeatureUpdateType.AddPrerequisite: {
                // Generate a temporary ID for the new prerequisite (will be assigned by database on save)
                const tempId = Date.now(); // Temporary ID, will be replaced on save
                const prerequisiteWithFeatureId: FeaturePrerequisite = {
                    ...update.payload.prerequisite,
                    id: tempId,
                    featureId: state.id
                };
                return {
                    ...state,
                    prerequisites: [...(state.prerequisites || []), prerequisiteWithFeatureId]
                };
            }

            case FeatureUpdateType.UpdatePrerequisite: {
                const prerequisiteIndex = state.prerequisites?.findIndex(p => p.id === update.payload.prerequisiteId);
                if (prerequisiteIndex === undefined || prerequisiteIndex === -1) return state;

                return {
                    ...state,
                    prerequisites: [
                        ...(state.prerequisites || []).slice(0, prerequisiteIndex),
                        { ...state.prerequisites![prerequisiteIndex], ...update.payload.prerequisite },
                        ...(state.prerequisites || []).slice(prerequisiteIndex + 1)
                    ]
                };
            }

            case FeatureUpdateType.RemovePrerequisite:
                return {
                    ...state,
                    prerequisites: (state.prerequisites || []).filter(p => p.id !== update.payload.prerequisiteId)
                };

            default:
                return state;
        }
    }
};
