import type { FeatureEntity, FeatureProgression } from '@shared/schema';
import { ClassUpdateType } from '@shared/static-data';

import type { UpdateApplierConfig } from '../shared/session/GenericUpdateApplier';
import type { ClassEditState, ClassUpdate } from './types';

/**
 * Configuration for applying Class updates to state.
 * 
 * Provides strategy functions for all Class update types, allowing the generic
 * update applier to handle Class-specific update logic.
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
     * Checks if an update is a progression update.
     */
    isProgressionUpdate: (update) => {
        return update.type === ClassUpdateType.AddProgression ||
            update.type === ClassUpdateType.UpdateProgression ||
            update.type === ClassUpdateType.RemoveProgression;
    },

    /**
     * Applies a progression update to the class state.
     */
    applyProgressionUpdate: (state, update) => {
        switch (update.type) {
            case ClassUpdateType.AddProgression:
                return {
                    ...state,
                    featureProgressions: [...state.featureProgressions, update.payload.progression]
                };

            case ClassUpdateType.UpdateProgression: {
                const index = state.featureProgressions.findIndex(p => p.id === update.payload.progressionId);
                if (index === -1) return state;

                return {
                    ...state,
                    featureProgressions: [
                        ...state.featureProgressions.slice(0, index),
                        { ...state.featureProgressions[index], ...update.payload.progression },
                        ...state.featureProgressions.slice(index + 1)
                    ]
                };
            }

            case ClassUpdateType.RemoveProgression:
                return {
                    ...state,
                    featureProgressions: state.featureProgressions.filter(p => p.id !== update.payload.progressionId)
                };

            default:
                return state;
        }
    },

    /**
     * Checks if an update is an entity update.
     */
    isEntityUpdate: (update) => {
        return update.type === ClassUpdateType.AddEntity ||
            update.type === ClassUpdateType.UpdateEntity ||
            update.type === ClassUpdateType.RemoveEntity;
    },

    /**
     * Applies an entity update to the class state.
     */
    applyEntityUpdate: (state, update) => {
        switch (update.type) {
            case ClassUpdateType.AddEntity: {
                const progressionIndex = state.featureProgressions.findIndex(p => p.id === update.payload.progressionId);
                if (progressionIndex === -1) return state;

                const progression = state.featureProgressions[progressionIndex];
                // Ensure the entity has the correct progressionId
                const entityWithProgressionId: FeatureEntity = {
                    ...update.payload.entity,
                    progressionId: update.payload.progressionId
                };
                return {
                    ...state,
                    featureProgressions: [
                        ...state.featureProgressions.slice(0, progressionIndex),
                        {
                            ...progression,
                            entities: [...(progression.entities || []), entityWithProgressionId]
                        },
                        ...state.featureProgressions.slice(progressionIndex + 1)
                    ]
                };
            }

            case ClassUpdateType.UpdateEntity: {
                return {
                    ...state,
                    featureProgressions: state.featureProgressions.map(progression => {
                        const entityIndex = progression.entities?.findIndex(e => e.id === update.payload.entityId);
                        if (entityIndex === undefined || entityIndex === -1) return progression;

                        return {
                            ...progression,
                            entities: [
                                ...(progression.entities || []).slice(0, entityIndex),
                                { ...progression.entities![entityIndex], ...update.payload.entity },
                                ...(progression.entities || []).slice(entityIndex + 1)
                            ]
                        };
                    })
                };
            }

            case ClassUpdateType.RemoveEntity:
                return {
                    ...state,
                    featureProgressions: state.featureProgressions.map(progression => ({
                        ...progression,
                        entities: (progression.entities || []).filter(e => e.id !== update.payload.entityId)
                    }))
                };

            default:
                return state;
        }
    },

    /**
     * Checks if an update is a special update (class-specific).
     */
    isSpecialUpdate: (update) => {
        return update.type === ClassUpdateType.SetSpellcastingProgression ||
            update.type === ClassUpdateType.SetSpellsKnownProgression ||
            update.type === ClassUpdateType.LinkProgression ||
            update.type === ClassUpdateType.UnlinkProgression;
    },

    /**
     * Applies a special update to the class state.
     */
    applySpecialUpdate: (state, update) => {
        switch (update.type) {
            case ClassUpdateType.SetSpellcastingProgression:
                return {
                    ...state,
                    spellcastingProgression: update.payload.progression
                };

            case ClassUpdateType.SetSpellsKnownProgression:
                return {
                    ...state,
                    spellsKnownProgression: update.payload.progression
                };

            case ClassUpdateType.LinkProgression:
            case ClassUpdateType.UnlinkProgression:
                // These operations are handled at the database level, not in state
                // State will be updated after the database operation completes
                return state;

            default:
                return state;
        }
    }
};
