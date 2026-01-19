import type { UpdateApplierConfig } from '../shared/session/GenericUpdateApplier';
import type { CharacterEditState, CharacterUpdate } from './types';

/**
 * Configuration for applying Character updates to state.
 * 
 * Provides strategy functions for all Character update types, allowing the generic
 * update applier to handle Character-specific update logic.
 * 
 * **Note**: Character updates are simpler than Class/Race updates - they don't have
 * progression/entity updates in the same way. Character updates are primarily field
 * updates and choice updates.
 */
export const characterUpdateApplierConfig: UpdateApplierConfig<CharacterEditState, CharacterUpdate> = {
    /**
     * Applies a field update to the character state.
     * 
     * Character doesn't have a generic field update type, so this handles
     * specific field update types like SET_ABILITY_SCORE, SET_RACE, etc.
     */
    applyFieldUpdate: (state, field, value) => {
        // Character updates are handled by specific update types, not generic field updates
        // This is a fallback that shouldn't normally be called
        return { ...state, [field]: value };
    },

    /**
     * Checks if an update is a field update.
     */
    isFieldUpdate: (update) => {
        return update.type === 'SET_ABILITY_SCORE' ||
            update.type === 'SET_RACE' ||
            update.type === 'SET_CLASS' ||
            update.type === 'SET_SECONDARY_CLASS' ||
            update.type === 'SET_LEVEL' ||
            update.type === 'SET_FEAT' ||
            update.type === 'REMOVE_FEAT' ||
            update.type === 'SET_DISALLOWED_SOURCE' ||
            update.type === 'REMOVE_DISALLOWED_SOURCE';
    },

    /**
     * Extracts field name and value from a field update.
     */
    extractFieldUpdate: (update) => {
        // Character updates don't use a generic field update pattern
        // Each update type has its own payload structure
        return null;
    },

    /**
     * Checks if an update is a progression update.
     */
    isProgressionUpdate: (update) => {
        // Character doesn't have progression updates in the same way
        return false;
    },

    /**
     * Applies a progression update to the character state.
     */
    applyProgressionUpdate: (state) => {
        // Not used for Character
        return state;
    },

    /**
     * Checks if an update is an entity update.
     */
    isEntityUpdate: (update) => {
        // Character doesn't have entity updates in the same way
        return false;
    },

    /**
     * Applies an entity update to the character state.
     */
    applyEntityUpdate: (state) => {
        // Not used for Character
        return state;
    },

    /**
     * Checks if an update is a special update (character-specific).
     */
    isSpecialUpdate: (update) => {
        return update.type === 'SET_SKILL_RANK' ||
            update.type === 'MAKE_CHOICE';
    },

    /**
     * Applies a special update to the character state.
     */
    applySpecialUpdate: (state, update) => {
        switch (update.type) {
            case 'SET_ABILITY_SCORE': {
                const abilityIndex = state.abilityScores.findIndex(as => as.abilityId === update.payload.abilityId);
                if (abilityIndex >= 0) {
                    return {
                        ...state,
                        abilityScores: [
                            ...state.abilityScores.slice(0, abilityIndex),
                            { ...state.abilityScores[abilityIndex], value: update.payload.value },
                            ...state.abilityScores.slice(abilityIndex + 1)
                        ]
                    };
                } else {
                    return {
                        ...state,
                        abilityScores: [...state.abilityScores, { abilityId: update.payload.abilityId, value: update.payload.value }]
                    };
                }
            }

            case 'SET_SKILL_RANK': {
                const skillIndex = state.skillRanks.findIndex(sr =>
                    sr.skillId === update.payload.skillId &&
                    sr.skillSubId === update.payload.skillSubId &&
                    sr.customSubtype === update.payload.customSubtype
                );
                if (update.payload.pointsSpent === 0) {
                    // Remove skill rank entry if pointsSpent is 0
                    if (skillIndex >= 0) {
                        return {
                            ...state,
                            skillRanks: [
                                ...state.skillRanks.slice(0, skillIndex),
                                ...state.skillRanks.slice(skillIndex + 1)
                            ]
                        };
                    }
                    return state;
                } else if (skillIndex >= 0) {
                    // Update existing skill rank
                    return {
                        ...state,
                        skillRanks: [
                            ...state.skillRanks.slice(0, skillIndex),
                            { ...state.skillRanks[skillIndex], pointsSpent: update.payload.pointsSpent },
                            ...state.skillRanks.slice(skillIndex + 1)
                        ]
                    };
                } else {
                    // Add new skill rank
                    return {
                        ...state,
                        skillRanks: [
                            ...state.skillRanks,
                            {
                                skillId: update.payload.skillId,
                                skillSubId: update.payload.skillSubId,
                                customSubtype: update.payload.customSubtype,
                                pointsSpent: update.payload.pointsSpent
                            }
                        ]
                    };
                }
            }

            case 'SET_RACE':
                return {
                    ...state,
                    raceId: update.payload.raceId
                };

            case 'SET_CLASS':
                return {
                    ...state,
                    classId: update.payload.classId
                };

            case 'SET_SECONDARY_CLASS':
                return {
                    ...state,
                    secondaryClassId: update.payload.secondaryClassId,
                    isGestalt: update.payload.secondaryClassId !== null
                };

            case 'SET_LEVEL':
                return {
                    ...state,
                    level: update.payload.level
                };

            case 'MAKE_CHOICE': {
                // Add or update feature choice
                const choiceIndex = state.featureChoices.findIndex(fc =>
                    fc.progressionId === update.payload.progressionId &&
                    fc.featureEntityId === update.payload.featureEntityId
                );
                if (choiceIndex >= 0) {
                    return {
                        ...state,
                        featureChoices: [
                            ...state.featureChoices.slice(0, choiceIndex),
                            {
                                ...state.featureChoices[choiceIndex],
                                appliesToId: update.payload.appliesToId,
                                appliesToSubId: update.payload.appliesToSubId
                            },
                            ...state.featureChoices.slice(choiceIndex + 1)
                        ]
                    };
                } else {
                    return {
                        ...state,
                        featureChoices: [
                            ...state.featureChoices,
                            {
                                id: 0, // Will be assigned by database
                                characterId: state.characterId,
                                progressionId: update.payload.progressionId,
                                advancementId: 0, // Will be assigned by database
                                featureEntityId: update.payload.featureEntityId,
                                appliesToId: update.payload.appliesToId,
                                appliesToSubId: update.payload.appliesToSubId,
                                choiceIndex: null
                            }
                        ]
                    };
                }
            }

            case 'SET_FEAT':
                if (!state.selectedFeats.includes(update.payload.featId)) {
                    return {
                        ...state,
                        selectedFeats: [...state.selectedFeats, update.payload.featId]
                    };
                }
                return state;

            case 'REMOVE_FEAT':
                return {
                    ...state,
                    selectedFeats: state.selectedFeats.filter(id => id !== update.payload.featId)
                };

            case 'SET_DISALLOWED_SOURCE':
                if (!state.disallowedSources.some(ds => ds.sourceBookId === update.payload.sourceBookId)) {
                    return {
                        ...state,
                        disallowedSources: [
                            ...state.disallowedSources,
                            { sourceBookId: update.payload.sourceBookId }
                        ]
                    };
                }
                return state;

            case 'REMOVE_DISALLOWED_SOURCE':
                return {
                    ...state,
                    disallowedSources: state.disallowedSources.filter(
                        ds => ds.sourceBookId !== update.payload.sourceBookId
                    )
                };

            default:
                return state;
        }
    }
};
