import { useState, useCallback } from 'react';

import type { CharacterEditState, CharacterEditStateUpdate } from './types';
import { CharacterEditStateUpdateType } from './types';

/**
 * Custom hook for managing centralized character edit state.
 * Provides a single source of truth for all character data and eliminates
 * the need for per-tab state management.
 */
export function useCharacterEditState(initialState?: Partial<CharacterEditState>) {
    const [state, setState] = useState<CharacterEditState>({
        // Core Character Identity
        characterId: null,
        name: '',
        level: 1,
        currentAdvancementId: null,

        // Race & Abilities
        raceId: null,
        abilityScores: [],
        abilityBonuses: [],

        // Class & Configuration
        classId: null,
        secondaryClassId: null,
        isGestalt: false,
        editionId: null,
        allowVariantClasses: false,
        ignoreLevelAdjustment: false,
        disallowedSources: [],

        // User Choices
        featureChoices: [],

        // Resolved Outputs
        resolvedProgressions: [],
        isLoadingResolution: false,
        resolutionError: null,

        // Derived Data
        classSkills: [],
        skillBonuses: [],
        pendingChoices: [],
        grantedFeats: [],
        availableFeats: 0,

        // Skills Tab UI State
        skillRanks: [],
        skillPointsAvailable: 0,
        maxClassSkillRanks: 4,
        maxCrossClassSkillRanks: 2,

        // Feats Tab UI State
        selectedFeats: [],
        featSubIds: {},

        // Description Tab UI State
        alignmentId: null,
        age: null,
        height: null,
        weight: null,
        eyes: null,
        hair: null,
        gender: null,
        notes: null,

        // Equipment Tab UI State
        equipment: [],
        money: { platinum: 0, gold: 0, silver: 0, copper: 0 },

        // Combat Tab UI State
        attackDefinitions: [],

        // Apply any initial state overrides
        ...initialState
    });

    const updateState = useCallback((update: CharacterEditStateUpdate) => {
        setState(prev => {
            switch (update.type) {
                case CharacterEditStateUpdateType.SET_CHARACTER_ID:
                    return { ...prev, characterId: update.payload.characterId };
                case CharacterEditStateUpdateType.SET_NAME:
                    return { ...prev, name: update.payload.name };
                case CharacterEditStateUpdateType.SET_LEVEL:
                    return { ...prev, level: update.payload.level };
                case CharacterEditStateUpdateType.SET_RACE:
                    return { ...prev, raceId: update.payload.raceId };
                case CharacterEditStateUpdateType.SET_ABILITY_SCORES:
                    return { ...prev, abilityScores: update.payload.abilityScores };
                case CharacterEditStateUpdateType.SET_ABILITY_BONUSES:
                    return { ...prev, abilityBonuses: update.payload.abilityBonuses };
                case CharacterEditStateUpdateType.SET_CLASS:
                    return { ...prev, classId: update.payload.classId };
                case CharacterEditStateUpdateType.SET_SECONDARY_CLASS:
                    return { ...prev, secondaryClassId: update.payload.secondaryClassId };
                case CharacterEditStateUpdateType.SET_IS_GESTALT:
                    return { ...prev, isGestalt: update.payload.isGestalt };
                case CharacterEditStateUpdateType.SET_EDITION:
                    return { ...prev, editionId: update.payload.editionId };
                case CharacterEditStateUpdateType.SET_ALLOW_VARIANT_CLASSES:
                    return { ...prev, allowVariantClasses: update.payload.allowVariantClasses };
                case CharacterEditStateUpdateType.SET_IGNORE_LEVEL_ADJUSTMENT:
                    return { ...prev, ignoreLevelAdjustment: update.payload.ignoreLevelAdjustment };
                case CharacterEditStateUpdateType.SET_DISALLOWED_SOURCES:
                    return { ...prev, disallowedSources: update.payload.disallowedSources };
                case CharacterEditStateUpdateType.SET_FEATURE_CHOICES:
                    return { ...prev, featureChoices: update.payload.featureChoices };
                case CharacterEditStateUpdateType.SET_SKILL_RANKS:
                    return { ...prev, skillRanks: update.payload.skillRanks };
                case CharacterEditStateUpdateType.SET_SKILL_POINTS_AVAILABLE:
                    return { ...prev, skillPointsAvailable: update.payload.skillPointsAvailable };
                case CharacterEditStateUpdateType.SET_MAX_CLASS_SKILL_RANKS:
                    return { ...prev, maxClassSkillRanks: update.payload.maxClassSkillRanks };
                case CharacterEditStateUpdateType.SET_MAX_CROSS_CLASS_SKILL_RANKS:
                    return { ...prev, maxCrossClassSkillRanks: update.payload.maxCrossClassSkillRanks };
                case CharacterEditStateUpdateType.SET_SELECTED_FEATS:
                    return { ...prev, selectedFeats: update.payload.selectedFeats };
                case CharacterEditStateUpdateType.SET_FEAT_SUB_IDS:
                    return { ...prev, featSubIds: update.payload.featSubIds };
                case CharacterEditStateUpdateType.SET_ALIGNMENT:
                    return { ...prev, alignmentId: update.payload.alignmentId };
                case CharacterEditStateUpdateType.SET_AGE:
                    return { ...prev, age: update.payload.age };
                case CharacterEditStateUpdateType.SET_HEIGHT:
                    return { ...prev, height: update.payload.height };
                case CharacterEditStateUpdateType.SET_WEIGHT:
                    return { ...prev, weight: update.payload.weight };
                case CharacterEditStateUpdateType.SET_EYES:
                    return { ...prev, eyes: update.payload.eyes };
                case CharacterEditStateUpdateType.SET_HAIR:
                    return { ...prev, hair: update.payload.hair };
                case CharacterEditStateUpdateType.SET_GENDER:
                    return { ...prev, gender: update.payload.gender };
                case CharacterEditStateUpdateType.SET_NOTES:
                    return { ...prev, notes: update.payload.notes };
                case CharacterEditStateUpdateType.SET_EQUIPMENT:
                    return { ...prev, equipment: update.payload.equipment };
                case CharacterEditStateUpdateType.SET_MONEY:
                    return { ...prev, money: update.payload.money };
                case CharacterEditStateUpdateType.SET_RESOLVED_DATA:
                    return {
                        ...prev,
                        ...update.payload,
                        isLoadingResolution: false,
                        resolutionError: null
                    };
                case CharacterEditStateUpdateType.SET_RESOLUTION_LOADING:
                    return { ...prev, isLoadingResolution: update.payload.isLoading };
                case CharacterEditStateUpdateType.SET_RESOLUTION_ERROR:
                    return { ...prev, resolutionError: update.payload.error, isLoadingResolution: false };
                case CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID:
                    return { ...prev, currentAdvancementId: update.payload.currentAdvancementId };
                case CharacterEditStateUpdateType.SET_ATTACK_DEFINITIONS:
                    return { ...prev, attackDefinitions: update.payload.attackDefinitions };
                default:
                    return prev;
            }
        });
    }, []);

    return { state, updateState };
}
