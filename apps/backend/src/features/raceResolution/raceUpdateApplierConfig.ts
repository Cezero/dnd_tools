import type { FeatureEntity } from '@shared/schema';
import { RaceUpdateType } from '@shared/static-data';

import type { UpdateApplierConfig } from '../shared/session/GenericUpdateApplier';
import type { RaceEditState, RaceUpdate } from './types';

/**
 * Configuration for applying Race updates to state.
 * 
 * Provides strategy functions for all Race update types, allowing the generic
 * update applier to handle Race-specific update logic.
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
     * Checks if an update is a progression update.
     */
    isProgressionUpdate: (update) => {
        return update.type === RaceUpdateType.AddProgression ||
            update.type === RaceUpdateType.UpdateProgression ||
            update.type === RaceUpdateType.RemoveProgression;
    },

    /**
     * Applies a progression update to the race state.
     */
    applyProgressionUpdate: (state, update) => {
        switch (update.type) {
            case RaceUpdateType.AddProgression:
                return {
                    ...state,
                    featureProgressions: [...state.featureProgressions, update.payload.progression]
                };

            case RaceUpdateType.UpdateProgression: {
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

            case RaceUpdateType.RemoveProgression:
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
        return update.type === RaceUpdateType.AddEntity ||
            update.type === RaceUpdateType.UpdateEntity ||
            update.type === RaceUpdateType.RemoveEntity;
    },

    /**
     * Applies an entity update to the race state.
     */
    applyEntityUpdate: (state, update) => {
        switch (update.type) {
            case RaceUpdateType.AddEntity: {
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

            case RaceUpdateType.UpdateEntity: {
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

            case RaceUpdateType.RemoveEntity:
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
     * Checks if an update is a special update (race-specific).
     */
    isSpecialUpdate: (update) => {
        return update.type === RaceUpdateType.LinkProgression ||
            update.type === RaceUpdateType.UnlinkProgression;
    },

    /**
     * Applies a special update to the race state.
     */
    applySpecialUpdate: (state, update) => {
        switch (update.type) {
            case RaceUpdateType.LinkProgression:
            case RaceUpdateType.UnlinkProgression:
                // These operations are handled at the database level, not in state
                // State will be updated after the database operation completes
                return state;

            default:
                return state;
        }
    }
};
