import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { useDiceBox } from '@/components/dice-box';
import type { LocalDiceRollResult } from '@/components/dice-box/types';
import { CustomSelect } from '@/components/forms/FormComponents';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { LanguageService } from '@/lib/LanguageService';
import { hasNoMaxRanks } from '@/lib/skill-utils';
import { useCacheFunctions } from '@/services/cache';
import {
    ALIGNMENT_LIST,
    LANGUAGE_MAP,
    GetAbilityModifier,
    AbilityId,
} from '@shared/static-data';

import type { AgeTableEntry, HeightWeightEntry } from './types';

const AGE_TABLE: Record<string, AgeTableEntry> = {
    'human': { adulthood: 15, category1: { dice: 1, sides: 4 }, category2: { dice: 1, sides: 6 }, category3: { dice: 2, sides: 6 } },
    'dwarf': { adulthood: 40, category1: { dice: 3, sides: 6 }, category2: { dice: 5, sides: 6 }, category3: { dice: 7, sides: 6 } },
    'elf': { adulthood: 110, category1: { dice: 4, sides: 6 }, category2: { dice: 6, sides: 6 }, category3: { dice: 10, sides: 6 } },
    'gnome': { adulthood: 40, category1: { dice: 4, sides: 6 }, category2: { dice: 6, sides: 6 }, category3: { dice: 9, sides: 6 } },
    'half-elf': { adulthood: 20, category1: { dice: 1, sides: 6 }, category2: { dice: 2, sides: 6 }, category3: { dice: 3, sides: 6 } },
    'half-orc': { adulthood: 14, category1: { dice: 1, sides: 4 }, category2: { dice: 1, sides: 6 }, category3: { dice: 2, sides: 6 } },
    'halfling': { adulthood: 20, category1: { dice: 2, sides: 4 }, category2: { dice: 3, sides: 6 }, category3: { dice: 4, sides: 6 } }
};

const HEIGHT_WEIGHT_TABLE: Record<string, { male: HeightWeightEntry; female: HeightWeightEntry }> = {
    'human': {
        male: { baseHeightInches: 58, heightModifier: { dice: 2, sides: 10 }, baseWeight: 120, weightModifier: { dice: 2, sides: 4 } },
        female: { baseHeightInches: 53, heightModifier: { dice: 2, sides: 10 }, baseWeight: 85, weightModifier: { dice: 2, sides: 4 } }
    },
    'dwarf': {
        male: { baseHeightInches: 45, heightModifier: { dice: 2, sides: 4 }, baseWeight: 130, weightModifier: { dice: 2, sides: 6 } },
        female: { baseHeightInches: 43, heightModifier: { dice: 2, sides: 4 }, baseWeight: 100, weightModifier: { dice: 2, sides: 6 } }
    },
    'elf': {
        male: { baseHeightInches: 53, heightModifier: { dice: 2, sides: 6 }, baseWeight: 85, weightModifier: { dice: 1, sides: 6 } },
        female: { baseHeightInches: 53, heightModifier: { dice: 2, sides: 6 }, baseWeight: 80, weightModifier: { dice: 1, sides: 6 } }
    },
    'gnome': {
        male: { baseHeightInches: 36, heightModifier: { dice: 2, sides: 4 }, baseWeight: 40, weightModifier: null },
        female: { baseHeightInches: 34, heightModifier: { dice: 2, sides: 4 }, baseWeight: 35, weightModifier: null }
    },
    'half-elf': {
        male: { baseHeightInches: 55, heightModifier: { dice: 2, sides: 8 }, baseWeight: 100, weightModifier: { dice: 2, sides: 4 } },
        female: { baseHeightInches: 53, heightModifier: { dice: 2, sides: 8 }, baseWeight: 80, weightModifier: { dice: 2, sides: 4 } }
    },
    'half-orc': {
        male: { baseHeightInches: 58, heightModifier: { dice: 2, sides: 12 }, baseWeight: 150, weightModifier: { dice: 2, sides: 6 } },
        female: { baseHeightInches: 53, heightModifier: { dice: 2, sides: 12 }, baseWeight: 110, weightModifier: { dice: 2, sides: 6 } }
    },
    'halfling': {
        male: { baseHeightInches: 32, heightModifier: { dice: 2, sides: 4 }, baseWeight: 30, weightModifier: null },
        female: { baseHeightInches: 30, heightModifier: { dice: 2, sides: 4 }, baseWeight: 25, weightModifier: null }
    }
};

/**
 * Normalize gender for lookup
 */
function normalizeGender(gender: string | null | undefined): 'male' | 'female' {
    if (!gender) return 'male';
    const normalized = gender.toLowerCase().trim();
    if (normalized === 'f' || normalized.startsWith('fem')) {
        return 'female';
    }
    if (normalized === 'm' || normalized.startsWith('mal')) {
        return 'male';
    }
    // Default to male for unclear values
    return 'male';
}

/**
 * Normalize a name for lookup (lowercase, trim, handle common variations)
 */
function normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Class categories for age calculation - using normalized names for direct lookup
 */
const CLASS_CATEGORY_1 = new Set(['barbarian', 'rogue', 'sorcerer']);
const CLASS_CATEGORY_3 = new Set(['cleric', 'druid', 'monk', 'wizard']);
// Category 2 is the default (Bard, Fighter, Paladin, Ranger)

/**
 * Get full dice notation including base adulthood age based on race and class names
 */
function getAgeDiceNotation(raceName: string, className: string): string {
    // Normalize names for direct lookup
    const normalizedRace = normalizeName(raceName);
    const normalizedClass = normalizeName(className);

    // Direct lookup in age table, default to human if not found
    const raceEntry = AGE_TABLE[normalizedRace] ?? AGE_TABLE['human'];

    // Determine which category the class belongs to using direct lookup
    let diceConfig: { dice: number; sides: number };
    if (CLASS_CATEGORY_1.has(normalizedClass)) {
        diceConfig = raceEntry.category1;
    } else if (CLASS_CATEGORY_3.has(normalizedClass)) {
        diceConfig = raceEntry.category3;
    } else {
        // Default to category 2 (Bard, Fighter, Paladin, Ranger)
        diceConfig = raceEntry.category2;
    }

    // Create full dice notation including base age (e.g., "15 + 1d6", "40 + 3d6")
    const notation = `${raceEntry.adulthood} + ${diceConfig.dice}d${diceConfig.sides}`;

    return notation;
}

/**
 * Get height and weight dice configurations based on race and gender
 */
function getHeightWeightConfig(raceName: string, gender: string | null | undefined): {
    baseHeightInches: number;
    heightModifierNotation: string;
    baseWeight: number;
    weightModifierNotation: string | null;
} {
    const normalizedRace = normalizeName(raceName);
    const normalizedGender = normalizeGender(gender);

    // Direct lookup in table, default to human if not found
    const raceData = HEIGHT_WEIGHT_TABLE[normalizedRace] ?? HEIGHT_WEIGHT_TABLE['human'];
    const entry = raceData[normalizedGender];

    const heightModifierNotation = `${entry.heightModifier.dice}d${entry.heightModifier.sides}`;
    const weightModifierNotation = entry.weightModifier
        ? `${entry.weightModifier.dice}d${entry.weightModifier.sides}`
        : null;

    return {
        baseHeightInches: entry.baseHeightInches,
        heightModifierNotation,
        baseWeight: entry.baseWeight,
        weightModifierNotation
    };
}

export function DescriptionTab({
    state,
    updateState,
    isLoading,
    resolvedData
}: TabComponentProps): React.JSX.Element {
    const { getRaceSummaryById, getClassSummaryById } = useCacheFunctions();
    const { rollDice, rollDiceGroups, isReady, onRollComplete } = useDiceBox();
    const [isRollingAge, setIsRollingAge] = useState(false);
    const isAgeRollPendingRef = useRef(false);
    const [isRollingHeightWeight, setIsRollingHeightWeight] = useState(false);
    const heightWeightConfigRef = useRef<{
        baseHeightInches: number;
        baseWeight: number;
        weightModifierNotation: string | null;
    } | null>(null);

    // Set up roll complete callback to handle age and height/weight calculations
    useEffect(() => {
        const unsubscribe = onRollComplete((result: LocalDiceRollResult | LocalDiceRollResult[]) => {
            const results = Array.isArray(result) ? result : [result];

            // Handle age roll result
            if (isAgeRollPendingRef.current) {
                const ageResult = results.find(r => r.group?.startsWith('age-roll'));

                if (ageResult) {
                    // The result.value already includes the base age since we passed the full formula
                    updateState({ type: CharacterEditStateUpdateType.SET_AGE, payload: { age: ageResult.value } });
                    isAgeRollPendingRef.current = false;
                    setIsRollingAge(false);
                }
            }

            // Handle height/weight roll results
            if (heightWeightConfigRef.current) {
                const heightResult = results.find(r => r.group?.startsWith('height-roll'));
                const weightResult = results.find(r => r.group?.startsWith('weight-roll'));

                if (heightResult) {
                    const heightModifierRoll = heightResult.value;
                    const finalHeight = heightWeightConfigRef.current.baseHeightInches + heightModifierRoll;

                    if (weightResult) {
                        // Weight modifier was rolled
                        const weightModifierRoll = weightResult.value;
                        const finalWeight = heightWeightConfigRef.current.baseWeight + (heightModifierRoll * weightModifierRoll);
                        updateState({
                            type: CharacterEditStateUpdateType.SET_HEIGHT,
                            payload: { height: finalHeight }
                        });
                        updateState({
                            type: CharacterEditStateUpdateType.SET_WEIGHT,
                            payload: { weight: `${finalWeight} lb.` }
                        });
                        heightWeightConfigRef.current = null;
                        setIsRollingHeightWeight(false);
                    } else if (heightWeightConfigRef.current.weightModifierNotation === null) {
                        // Weight modifier is "× 1 lb" - just add height modifier to weight
                        const finalWeight = heightWeightConfigRef.current.baseWeight + heightModifierRoll;
                        updateState({
                            type: CharacterEditStateUpdateType.SET_HEIGHT,
                            payload: { height: finalHeight }
                        });
                        updateState({
                            type: CharacterEditStateUpdateType.SET_WEIGHT,
                            payload: { weight: `${finalWeight} lb.` }
                        });
                        heightWeightConfigRef.current = null;
                        setIsRollingHeightWeight(false);
                    }
                    // If weight modifier exists but not rolled yet, wait for it
                }
            }
        });

        return unsubscribe;
    }, [onRollComplete, updateState]);

    const handleRollRandomAge = async (): Promise<void> => {
        if (!state.raceId || !state.classId || !isReady) {
            return;
        }

        setIsRollingAge(true);
        isAgeRollPendingRef.current = true;
        try {
            const raceData = getRaceSummaryById(state.raceId);
            const classData = getClassSummaryById(state.classId);

            if (raceData?.name && classData?.name) {
                const notation = getAgeDiceNotation(raceData.name, classData.name);
                const groupName = `age-roll: ${raceData.name}, ${classData.name}`;

                // Roll dice using dice-box with full formula (e.g., "15 + 1d6")
                // Group name includes race and class for display
                rollDice(notation, groupName);
            } else {
                setIsRollingAge(false);
                isAgeRollPendingRef.current = false;
            }
        } catch (error) {
            console.error('Error rolling random age:', error);
            setIsRollingAge(false);
            isAgeRollPendingRef.current = false;
        }
    };

    const canRollAge = state.raceId !== null && state.classId !== null && isReady;

    const handleRollRandomHeightWeight = async (): Promise<void> => {
        if (!state.raceId || !isReady) {
            return;
        }

        setIsRollingHeightWeight(true);
        try {
            const raceData = getRaceSummaryById(state.raceId);

            if (raceData?.name) {
                const config = getHeightWeightConfig(raceData.name, state.gender);
                heightWeightConfigRef.current = {
                    baseHeightInches: config.baseHeightInches,
                    baseWeight: config.baseWeight,
                    weightModifierNotation: config.weightModifierNotation
                };

                const notations: string[] = [];
                const groups: string[] = [];

                // Always roll height modifier (just the dice, we'll add base in calculation)
                notations.push(config.heightModifierNotation);
                groups.push(`height-roll: ${raceData.name}`);

                // Roll weight modifier if it's not "× 1 lb" (just the dice, we'll calculate in callback)
                if (config.weightModifierNotation) {
                    notations.push(config.weightModifierNotation);
                    groups.push(`weight-roll: ${raceData.name}`);
                }

                // Roll both dice using dice-box
                rollDiceGroups(notations, groups);
            } else {
                setIsRollingHeightWeight(false);
                heightWeightConfigRef.current = null;
            }
        } catch (error) {
            console.error('Error rolling random height/weight:', error);
            setIsRollingHeightWeight(false);
            heightWeightConfigRef.current = null;
        }
    };

    const canRollHeightWeight = state.raceId !== null && isReady;

    // Calculate languages
    const languageData = useMemo(() => {
        if (!state.raceId) {
            return {
                automaticLanguages: [] as number[],
                availableBonusLanguages: [] as number[],
                skillBasedLanguages: [] as number[],
                intModifier: 0,
                maxBonusLanguages: 0,
                allKnownLanguages: [] as number[]
            };
        }

        // Calculate automatic languages from all features (any source)
        const automaticLanguages = LanguageService.getAutomaticLanguages(resolvedData.features || []);

        // Calculate available bonus languages from all features (any source)
        // Remove duplicates since a language can be available from multiple sources
        const availableBonusLanguages = Array.from(new Set(
            LanguageService.getBonusLanguages(resolvedData.features || [])
        ));

        // Calculate INT modifier
        const intelligenceScore = state.abilityScores.find(a => a.abilityId === AbilityId.Intelligence);
        const intValue = intelligenceScore?.value ?? 10;
        const intModifier = GetAbilityModifier(intValue);
        const maxBonusLanguages = Math.max(0, intModifier);

        // Get skill-based languages from skill ranks (skills with no max rank limit, e.g., Speak Language)
        const skillBasedLanguages = state.skillRanks
            .filter(skill => hasNoMaxRanks(skill.skillId))
            .map(skill => {
                // Try skillSubId first, then customSubtype
                if (skill.skillSubId !== null && skill.skillSubId !== undefined) {
                    return skill.skillSubId;
                }
                if (skill.customSubtype) {
                    const parsed = parseInt(skill.customSubtype, 10);
                    return isNaN(parsed) ? null : parsed;
                }
                return null;
            })
            .filter((id): id is number => id !== null);

        // Combine all known languages and remove duplicates
        const allKnownLanguages = Array.from(new Set([
            ...automaticLanguages,
            ...state.selectedBonusLanguages,
            ...skillBasedLanguages
        ]));

        return {
            automaticLanguages,
            availableBonusLanguages,
            skillBasedLanguages,
            intModifier,
            maxBonusLanguages,
            allKnownLanguages
        };
    }, [state.raceId, state.abilityScores, state.selectedBonusLanguages, state.skillRanks, resolvedData.features]);

    // Handle adding a bonus language
    const handleAddBonusLanguage = useCallback((languageId: number) => {
        // Ensure languageData exists and has the required properties
        if (!languageData) {
            return;
        }
        // Don't add if already selected (shouldn't happen due to dropdown filtering, but safety check)
        if (state.selectedBonusLanguages.includes(languageId)) {
            return;
        }
        // Don't add if we've reached the max
        if (state.selectedBonusLanguages.length >= languageData.maxBonusLanguages) {
            return;
        }
        // Validate that the language is actually available (safety check)
        if (!languageData.availableBonusLanguages.includes(languageId)) {
            return;
        }
        updateState({
            type: CharacterEditStateUpdateType.SET_SELECTED_BONUS_LANGUAGES,
            payload: { selectedBonusLanguages: [...state.selectedBonusLanguages, languageId] }
        });
    }, [state.selectedBonusLanguages, languageData, updateState]);

    // Handle removing a bonus language
    const handleRemoveBonusLanguage = useCallback((languageId: number) => {
        updateState({
            type: CharacterEditStateUpdateType.SET_SELECTED_BONUS_LANGUAGES,
            payload: { selectedBonusLanguages: state.selectedBonusLanguages.filter(id => id !== languageId) }
        });
    }, [state.selectedBonusLanguages, updateState]);

    // Filter available bonus languages (exclude already selected)
    const availableBonusLanguagesForSelection = useMemo(() => {
        if (!languageData) {
            return [];
        }
        return languageData.availableBonusLanguages.filter(
            langId => !state.selectedBonusLanguages.includes(langId)
        );
    }, [languageData, state.selectedBonusLanguages]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Description
            </h2>

            {/* Loading State */}
            {isLoading && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Loading character data...
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Character Name
                            </h3>
                            <input
                                type="text"
                                value={state.name}
                                onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: e.target.value } })}
                                placeholder="Enter character name..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Alignment
                            </h3>
                            <CustomSelect
                                value={state.alignmentId || 0}
                                onValueChange={(value) => updateState({ type: CharacterEditStateUpdateType.SET_ALIGNMENT, payload: { alignmentId: value } })}
                                options={ALIGNMENT_LIST}
                                placeholder="Select alignment..."
                                componentExtraClassName="mb-4"
                            />
                        </div>
                    </div>
                </div>

                {/* Physical Description */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Physical Description
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Age, Height, Weight on same line */}
                        <div className="md:col-span-2">
                            <div className="flex items-end gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Age
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={state.age || ''}
                                            onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_AGE, payload: { age: e.target.value ? parseInt(e.target.value) : null } })}
                                            placeholder="Enter age..."
                                            className="w-[100px] h-[37px] px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRollRandomAge}
                                            disabled={!canRollAge || isRollingAge}
                                            className="px-3 py-2 h-[37px] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 whitespace-nowrap"
                                            title={!canRollAge ? (isReady ? 'Select race and class to roll random age' : 'Dice box not ready') : 'Roll random age based on race and class'}
                                        >
                                            {isRollingAge ? 'Rolling...' : 'Roll Age'}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Height (inches)
                                    </label>
                                    <input
                                        type="number"
                                        value={state.height || ''}
                                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_HEIGHT, payload: { height: e.target.value ? parseInt(e.target.value) : null } })}
                                        placeholder="Enter height..."
                                        className="w-[100px] h-[37px] px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        &nbsp;
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleRollRandomHeightWeight}
                                        disabled={!canRollHeightWeight || isRollingHeightWeight}
                                        className="px-3 py-2 h-[37px] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 whitespace-nowrap"
                                        title={!canRollHeightWeight ? (isReady ? 'Select race to roll random height and weight' : 'Dice box not ready') : 'Roll random height and weight based on race and gender'}
                                    >
                                        {isRollingHeightWeight ? 'Rolling...' : 'Roll Height/Weight'}
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Weight
                                    </label>
                                    <input
                                        type="text"
                                        value={state.weight || ''}
                                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_WEIGHT, payload: { weight: e.target.value } })}
                                        placeholder="Enter weight..."
                                        className="w-[100px] h-[37px] px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Eyes, Hair, Gender on same line */}
                        <div className="md:col-span-2">
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Eyes
                                    </label>
                                    <input
                                        type="text"
                                        value={state.eyes || ''}
                                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_EYES, payload: { eyes: e.target.value } })}
                                        placeholder="Enter eye color..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Hair
                                    </label>
                                    <input
                                        type="text"
                                        value={state.hair || ''}
                                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_HAIR, payload: { hair: e.target.value } })}
                                        placeholder="Enter hair color..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Gender
                                    </label>
                                    <input
                                        type="text"
                                        value={state.gender || ''}
                                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_GENDER, payload: { gender: e.target.value } })}
                                        placeholder="Enter gender..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Languages */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Languages
                    </h3>
                    <div className="space-y-4">
                        {/* Display all known languages */}
                        {languageData.allKnownLanguages.length > 0 ? (
                            <div className="flex flex-wrap gap-2 items-center">
                                {languageData.allKnownLanguages.map((languageId) => {
                                    const language = LANGUAGE_MAP[languageId];
                                    if (!language) return null;

                                    const isAutomatic = languageData.automaticLanguages.includes(languageId);
                                    const isSkillBased = languageData.skillBasedLanguages.includes(languageId);
                                    const isBonus = state.selectedBonusLanguages.includes(languageId);
                                    const canRemove = isBonus && !isAutomatic && !isSkillBased;

                                    return (
                                        <span
                                            key={languageId}
                                            className="group relative inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300"
                                        >
                                            {language.name}
                                            {canRemove && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveBonusLanguage(languageId)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                                    aria-label={`Remove ${language.name}`}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No languages known.
                            </p>
                        )}

                        {/* Bonus language selection dropdown */}
                        {languageData.maxBonusLanguages > 0 &&
                            state.selectedBonusLanguages.length < languageData.maxBonusLanguages &&
                            availableBonusLanguagesForSelection.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bonus Languages (Choose {languageData.maxBonusLanguages - state.selectedBonusLanguages.length} more)
                                    </label>
                                    <CustomSelect
                                        value={null}
                                        onValueChange={(value) => {
                                            if (value !== null && value !== undefined) {
                                                // Convert to number if needed (Select component may pass strings)
                                                const languageId = typeof value === 'string' ? parseInt(value, 10) : value;
                                                if (!isNaN(languageId) && typeof languageId === 'number') {
                                                    handleAddBonusLanguage(languageId);
                                                }
                                            }
                                        }}
                                        options={availableBonusLanguagesForSelection.map(langId => ({
                                            id: langId,
                                            name: LANGUAGE_MAP[langId]?.name || `Language ${langId}`
                                        }))}
                                        placeholder="Select a bonus language..."
                                        componentExtraClassName="flex items-center gap-2"
                                    />
                                </div>
                            )}
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Notes
                    </h3>
                    <textarea
                        value={state.notes || ''}
                        onChange={(e) => updateState({ type: CharacterEditStateUpdateType.SET_NOTES, payload: { notes: e.target.value } })}
                        placeholder="Enter character notes, background, or other information..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
}
