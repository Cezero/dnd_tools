import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useDiceBox } from '@/components/dice-box';
import { CustomSelect } from '@/components/forms/FormComponents';
import { useLogPanel } from '@/components/log-panel';
import { useToast } from '@/components/toast/useToast';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { RaceDisplay } from '@/features/race/RaceDisplay';
import { useDebounce } from '@/hooks/useDebounce';
import { useCacheFunctions } from '@/services/cache';
import {
    ABILITY_LIST,
    ABILITY_MAP,
    ABILITY_NAME_MAP,
    GetAbilityModifier,
    GetAbilityModifierString,
    GetPointBuyCost,
    ValidateAbilityScore,
    PointBuyOptions,
    AbilityGenerationMethod,
    ABILITY_GENERATION_METHOD_LIST,
    POINT_BUY_OPTIONS_LIST,
    SpecialFeatureId,
    EntityAppliesToType,
    CoreComponent
} from '@shared/static-data';

/**
 * Abilities and race tab component for managing character ability scores and race selection.
 * 
 * **Sync Pattern**: This tab follows the standardized state → useEffect → applyUpdate pattern.
 * - Updates state via `updateState()` when abilities or race change
 * - CharacterEdit automatically syncs changes to resolution session via useEffect hooks
 * - Do NOT call `resolution.applyUpdate()` directly from this tab
 * 
 * @see CharacterEdit component for sync pattern documentation
 */
export function AbilitiesRaceTab({
    state,
    updateState,
    resolvedData: _resolvedData,
    isLoading,
    triggerFeatureResolution,
    sharedData
}: TabComponentProps): React.JSX.Element {
    const { getRaceSelectByEdition } = useCacheFunctions();
    const { rollDice, rollDiceGroups, isReady, isRolling, lastResult, onRollComplete } = useDiceBox();
    const toastManager = useToast();
    const logPanel = useLogPanel();
    const [generationMethod, setGenerationMethod] = useState<AbilityGenerationMethod>(AbilityGenerationMethod.manual);
    const [rolledValues, setRolledValues] = useState<number[]>([]);
    const [isRollingAbilitySet, setIsRollingAbilitySet] = useState(false);
    const [_pendingRolls, setPendingRolls] = useState<Set<string>>(new Set());
    const [_assignedAbilitiesForOrder, setAssignedAbilitiesForOrder] = useState<Set<string>>(new Set());
    const [showChevrons, setShowChevrons] = useState(true);
    const [pointBuyConfig, setPointBuyConfig] = useState<PointBuyOptions>(PointBuyOptions.Challenging);
    const [customPointBuy, setCustomPointBuy] = useState<number>(22);

    // State for debounced input handling
    const [inputValues, setInputValues] = useState<Record<number, string>>({});
    const [focusedAbilityId, setFocusedAbilityId] = useState<number | null>(null);

    const getPointBuyLimit = useCallback((): number => {
        switch (pointBuyConfig) {
            case PointBuyOptions.LowPowered: return 15;
            case PointBuyOptions.Challenging: return 22;
            case PointBuyOptions.Tougher: return 28;
            case PointBuyOptions.HighPowered: return 32;
            case PointBuyOptions.Custom: return customPointBuy;
            default: return 22;
        }
    }, [pointBuyConfig, customPointBuy]);

    // Get ability score
    const getAbilityScore = useCallback((abilityId: number): number | null => {
        const abilityScore = state.abilityScores.find(attr => attr.abilityId === abilityId);
        return abilityScore?.value ?? null;
    }, [state.abilityScores]);

    const getTotalPointsSpent = useCallback((): number => {
        try {
            return ABILITY_LIST.reduce((total, ability) => {
                try {
                    const score = getAbilityScore(ability.id);
                    // Only calculate point buy cost for scores in valid range (8-18)
                    if (score !== null && score >= 8 && score <= 18) {
                        try {
                            return total + GetPointBuyCost(score);
                        } catch (error) {
                            console.error(`Error calculating point buy cost for ${ability.name} (${score}):`, error);
                            // If GetPointBuyCost throws, skip this score
                            return total;
                        }
                    }
                    return total;
                } catch (error) {
                    console.error(`Error processing ability ${ability.name} in point calculation:`, error);
                    // Continue with current total
                    return total;
                }
            }, 0);
        } catch (error) {
            console.error('Error calculating total points spent:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toastManager?.add({
                title: 'Error Calculating Points',
                description: `Failed to calculate total points spent: ${errorMessage}`,
                type: 'error',
            });
            logPanel.addLogEntry({
                message: `Error calculating total points spent: ${errorMessage}`,
                type: 'error',
                source: 'abilities-race-tab',
            });
            // Return 0 as safe fallback
            return 0;
        }
    }, [getAbilityScore, toastManager, logPanel]);

    const getRemainingPoints = useCallback((): number => {
        return getPointBuyLimit() - getTotalPointsSpent();
    }, [getPointBuyLimit, getTotalPointsSpent]);

    // Safe wrapper for GetPointBuyCost that handles errors gracefully
    const getSafePointBuyCost = useCallback((score: number): number => {
        if (score < 8 || score > 18) {
            return 0; // Invalid range for point buy
        }
        try {
            return GetPointBuyCost(score);
        } catch (error) {
            console.error(`Error calculating point buy cost for score ${score}:`, error);
            return 0; // Return 0 as safe fallback
        }
    }, []);

    // Set ability score
    const setAbilityScore = useCallback((abilityId: number, value: number) => {
        const updatedAbilityScores = [...state.abilityScores];
        const existingIndex = updatedAbilityScores.findIndex(attr => attr.abilityId === abilityId);

        if (existingIndex >= 0) {
            updatedAbilityScores[existingIndex] = {
                ...updatedAbilityScores[existingIndex],
                value: value
            };
        } else {
            updatedAbilityScores.push({
                id: Date.now(), // Temporary ID for new ability score
                characterId: 0, // Will be set when character is saved
                abilityId: abilityId,
                value: value
            });
        }

        updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: updatedAbilityScores } });
    }, [state.abilityScores, updateState]);

    const handleAbilityChange = useCallback((abilityId: number, value: number) => {
        // General validation: 3-18 range
        if (!ValidateAbilityScore(value)) {
            return; // Don't update if invalid
        }

        // Point Buy specific validation
        if (generationMethod === AbilityGenerationMethod.pointBuy) {
            // Enforce 8-18 range for Point Buy
            if (value < 8 || value > 18) {
                return; // Don't update if outside point buy range
            }

            // Check if this would increase the ability score
            const currentValue = getAbilityScore(abilityId);
            if (currentValue !== null && value > currentValue) {
                try {
                    // Calculate the additional cost
                    const additionalCost = GetPointBuyCost(value) - GetPointBuyCost(currentValue);
                    const remainingPoints = getRemainingPoints();

                    // Prevent increase if not enough points
                    if (additionalCost > remainingPoints) {
                        return; // Don't update if not enough points
                    }
                } catch (error) {
                    // If GetPointBuyCost throws an error, log it and don't update
                    console.error('Error calculating point buy cost:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    toastManager?.add({
                        title: 'Point Buy Calculation Error',
                        description: `Failed to calculate point buy cost: ${errorMessage}`,
                        type: 'error',
                    });
                    logPanel.addLogEntry({
                        message: `Point buy calculation error: ${errorMessage}`,
                        type: 'error',
                        source: 'abilities-race-tab',
                    });
                    return;
                }
            }
        }

        setAbilityScore(abilityId, value);
    }, [generationMethod, getAbilityScore, getRemainingPoints, setAbilityScore, toastManager, logPanel]);

    // Handle immediate input changes (no validation)
    const handleInputChange = useCallback((abilityId: number, value: string) => {
        setInputValues(prev => ({ ...prev, [abilityId]: value }));
    }, []);

    // Handle focus events
    const handleInputFocus = useCallback((abilityId: number) => {
        setFocusedAbilityId(abilityId);
        const currentValue = getAbilityScore(abilityId);
        setInputValues(prev => ({
            ...prev,
            [abilityId]: currentValue !== null ? currentValue.toString() : ''
        }));
    }, [getAbilityScore]);

    // Handle blur events (immediate validation)
    const handleInputBlur = useCallback((abilityId: number) => {
        setFocusedAbilityId(null);
        const inputValue = inputValues[abilityId];
        if (inputValue !== undefined) {
            const parsedValue = parseInt(inputValue) || 0;
            handleAbilityChange(abilityId, parsedValue);
            setInputValues(prev => {
                const newValues = { ...prev };
                delete newValues[abilityId];
                return newValues;
            });
        }
    }, [inputValues, handleAbilityChange]);

    // Debounced validation for ability changes
    const debouncedAbilityChange = useDebounce(inputValues, 1000);

    // Effect to handle debounced changes
    useEffect(() => {
        if (focusedAbilityId && debouncedAbilityChange[focusedAbilityId] !== undefined) {
            const parsedValue = parseInt(debouncedAbilityChange[focusedAbilityId]) || 0;
            handleAbilityChange(focusedAbilityId, parsedValue);
        }
    }, [debouncedAbilityChange, focusedAbilityId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Set up roll complete callback
    useEffect(() => {
        const unsubscribe = onRollComplete((result) => {
            // Handle both single result and array of results
            const results = Array.isArray(result) ? result : [result];

            if (generationMethod === AbilityGenerationMethod.inorder) {
                // Handle 3d6 order - assign all results at once
                const newAbilityScores = [...state.abilityScores];
                let allAssigned = true;

                results.forEach(result => {
                    const ability = ABILITY_LIST.find(ability => ability.name === result.group);
                    if (ability) {
                        const existingIndex = newAbilityScores.findIndex(attr => attr.abilityId === ability.id);
                        if (existingIndex >= 0) {
                            newAbilityScores[existingIndex] = {
                                ...newAbilityScores[existingIndex],
                                value: result.value
                            };
                        } else {
                            newAbilityScores.push({
                                id: Date.now(), // Temporary ID for new ability score
                                characterId: 0, // Will be set when character is saved
                                abilityId: ability.id,
                                value: result.value
                            });
                        }
                    } else {
                        allAssigned = false;
                    }
                });

                if (allAssigned) {
                    updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: newAbilityScores } });
                    setIsRollingAbilitySet(false);
                }
            } else if (generationMethod === AbilityGenerationMethod.arrange || generationMethod === AbilityGenerationMethod.drop) {
                // Handle arrange and drop methods - add to pool
                const newValues = [...rolledValues];
                results.forEach(result => {
                    if (result.group.startsWith('ability-set-')) {
                        const index = parseInt(result.group.split('-')[2]);
                        newValues[index] = result.value;
                    }
                });

                setRolledValues(newValues);

                // Check if all 6 rolls are complete
                const allComplete = newValues.length >= 6 && newValues.every(val => val !== undefined);
                if (allComplete) {
                    setIsRollingAbilitySet(false);
                }
            } else if (generationMethod === AbilityGenerationMethod.manual) {
                // Handle individual ability rolls in manual method
                results.forEach(result => {
                    // Check if the group is an ability name (for individual rolls)
                    const abilityId = ABILITY_NAME_MAP[result.group];
                    if (abilityId !== undefined) {
                        handleAbilityChange(abilityId, result.value);
                    }
                });
            }
        });

        return unsubscribe;
    }, [onRollComplete, generationMethod, state.abilityScores, rolledValues, updateState, handleAbilityChange]);

    const handleRollAbility = (abilityId: number) => {
        const abilityName = ABILITY_MAP[abilityId]?.name || `Ability ${abilityId}`;
        rollDice('3d6', abilityName);
    };

    const handleRaceChange = async (raceId: number | null) => {

        updateState({
            type: CharacterEditStateUpdateType.SET_RACE,
            payload: { raceId: raceId || null }
        });

        // Don't trigger feature resolution here - wait for race data to load
        // The useEffect below will handle triggering when race data is available
    };

    const handleGenerationMethodChange = (method: AbilityGenerationMethod) => {
        setGenerationMethod(method);
        // Clear rolled values when changing method, but preserve assigned abilities
        setRolledValues([]);
        // Don't reset abilities - let the new method work with existing assignments
        setShowChevrons(method === AbilityGenerationMethod.manual || method === AbilityGenerationMethod.pointBuy);

        // Auto-populate abilities to 8 when switching to Point Buy if all are undefined
        if (method === AbilityGenerationMethod.pointBuy) {
            const allUndefined = ABILITY_LIST.every(ability => getAbilityScore(ability.id) === null);
            if (allUndefined) {
                const newAbilityScores = ABILITY_LIST.map(ability => ({
                    id: Date.now() + ability.id, // Temporary ID for new ability score
                    characterId: 0, // Will be set when character is saved
                    abilityId: ability.id,
                    value: 8
                }));
                updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: newAbilityScores } });
            }
        }
    };

    const handleRollAbilitySet = () => {
        setIsRollingAbilitySet(true);
        setRolledValues([]);
        setAssignedAbilitiesForOrder(new Set());

        // Clear all assigned abilities when rolling new values
        updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: [] } });

        const diceFormula = generationMethod === AbilityGenerationMethod.drop ? '4d6dl1' : '3d6';
        const numRolls = 6;

        // Create arrays for notations and groups
        const notations = Array(numRolls).fill(diceFormula);

        let groups: string[];
        if (generationMethod === AbilityGenerationMethod.inorder) {
            // Use ability names as group names for 3d6 order
            groups = ABILITY_LIST.map(ability => ability.name);
        } else {
            // Use ability-set-{index} for arrange and drop methods
            groups = Array.from({ length: numRolls }, (_, i) => `ability-set-${i}`);
        }

        // Track pending rolls
        setPendingRolls(new Set(groups));

        // Roll all dice at once using rollDiceGroups
        rollDiceGroups(notations, groups);
    };

    const handleDragStart = (e: React.DragEvent, value: number, source: 'pool' | 'ability') => {
        e.dataTransfer.setData('application/json', JSON.stringify({ value, source }));
    };

    const handleDragStartFromPool = (e: React.DragEvent, value: number, index: number) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ value, source: 'pool', index }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetAbilityId?: number) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const { value, source, index } = data;

        if (source === 'pool' && targetAbilityId !== undefined) {
            // Moving from pool to ability
            const existingValue = getAbilityScore(targetAbilityId);
            setAbilityScore(targetAbilityId, value);
            let newRolledValues = [...rolledValues];

            // Remove the specific value by index, not by filtering
            if (index !== undefined) {
                newRolledValues.splice(index, 1);
            } else {
                // Fallback to filtering if no index (for backward compatibility)
                newRolledValues = newRolledValues.filter(v => v !== value);
            }

            // If the target ability already had a value, add it back to the pool
            if (existingValue !== null && existingValue !== 0) {
                newRolledValues = [...newRolledValues, existingValue];
            }

            setRolledValues(newRolledValues);
        } else if (source === 'ability' && targetAbilityId !== undefined) {
            // Moving from one ability to another ability
            const sourceAbilityScore = state.abilityScores.find(attr => attr.value === value);
            if (sourceAbilityScore) {
                const existingValue = getAbilityScore(targetAbilityId);

                // Remove the source ability
                const updatedAbilityScores = state.abilityScores.filter(attr => attr.abilityId !== sourceAbilityScore.abilityId);

                // Add the target ability
                if (targetAbilityId !== sourceAbilityScore.abilityId) {
                    updatedAbilityScores.push({
                        id: Date.now(), // Temporary ID for new ability score
                        characterId: 0, // Will be set when character is saved
                        abilityId: targetAbilityId,
                        value: value
                    });
                }

                let newRolledValues = [...rolledValues];

                // If the target ability already had a value, add it back to the pool
                if (existingValue !== null && existingValue !== 0) {
                    newRolledValues = [...newRolledValues, existingValue];
                }

                updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: updatedAbilityScores } });
                setRolledValues(newRolledValues);
            }
        } else if (source === 'ability' && targetAbilityId === undefined) {
            // Moving from ability back to pool
            const updatedAbilityScores = state.abilityScores.filter(attr => attr.value !== value);
            updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: updatedAbilityScores } });
            setRolledValues([...rolledValues, value]);
        }
    };

    const getGenerationMethodDescription = (method: AbilityGenerationMethod): string => {
        switch (method) {
            case AbilityGenerationMethod.manual:
                return 'Enter ability scores manually. You can roll individual dice for each ability or type in values directly.';
            case AbilityGenerationMethod.inorder:
                return 'Roll 3d6 for each ability in order.';
            case AbilityGenerationMethod.arrange:
                return 'Roll 3d6 six times, then arrange the results as desired among your abilities.';
            case AbilityGenerationMethod.drop:
                return 'Roll 4d6 and drop the lowest die six times, then arrange the results as desired among your abilities.';
            case AbilityGenerationMethod.pointBuy:
                return 'Use the point buy method to assign ability scores. The DM will determine the number of points you are allowed to spend.';
            default:
                return '';
        }
    };

    // Get races from cache system
    const [races, setRaces] = useState<CoreComponent[]>([]);
    const [isLoadingRaces, setIsLoadingRaces] = useState(false);

    // Get selected race details from sharedData
    const [selectedRaceDetails, setSelectedRaceDetails] = useState<{ features?: unknown[] } | null>(null);

    // Track which race we've already resolved to prevent infinite loops
    const resolvedRaceIdRef = useRef<number | null>(null);

    // Fetch races when editionId changes
    useEffect(() => {
        const fetchRaces = async () => {
            if (state.editionId) {
                setIsLoadingRaces(true);
                try {
                    const racesData = getRaceSelectByEdition(state.editionId);
                    setRaces(racesData || []);
                } catch (error) {
                    console.error('Failed to fetch races:', error);
                    setRaces([]);
                } finally {
                    setIsLoadingRaces(false);
                }
            } else {
                setRaces([]);
            }
        };
        fetchRaces();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.editionId]);

    // Use race data from sharedData (fetched in CharacterEdit with cache)
    // Update selectedRaceDetails when sharedData.race changes
    useEffect(() => {
        if (sharedData.race && state.raceId) {
            // sharedData.race doesn't have an id property, but we know it matches state.raceId
            setSelectedRaceDetails({ ...sharedData.race, features: sharedData.race.features } as { features?: unknown[] });
        } else if (!state.raceId) {
            setSelectedRaceDetails(null);
        }
    }, [sharedData.race, state.raceId]);

    // Trigger feature resolution when race data is loaded
    useEffect(() => {
        if (state.raceId && selectedRaceDetails && !sharedData.isLoadingRace && resolvedRaceIdRef.current !== state.raceId) {
            resolvedRaceIdRef.current = state.raceId;
            triggerFeatureResolution();
        }
    }, [state.raceId, selectedRaceDetails, sharedData.isLoadingRace, triggerFeatureResolution]);

    // Helper function to get racial modifier for ability scores
    const getRacialModifier = useCallback((abilityId: number): number => {
        if (!selectedRaceDetails?.features) return 0;

        // Look for ability adjustment features
        const abilityFeatures = selectedRaceDetails.features.filter((fp: unknown) => {
            const feature = fp as { featureId: number; entities?: { appliesTo: number; appliesToId: number; value: number }[] };
            return feature.featureId === SpecialFeatureId.AbilityAdjustment &&
                feature.entities?.some(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId);
        });

        const abilityEntity = abilityFeatures
            .flatMap((fp: unknown) => {
                const feature = fp as { entities?: { appliesTo: number; appliesToId: number; value: number }[] };
                return feature.entities || [];
            })
            .find(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId);

        return abilityEntity?.value ?? 0;
    }, [selectedRaceDetails?.features]);

    const getAdjustedAbilityValue = useCallback((abilityId: number): number | null => {
        const baseValue = getAbilityScore(abilityId);
        if (baseValue === null) return null;
        const racialModifier = getRacialModifier(abilityId);
        return baseValue + racialModifier;
    }, [getAbilityScore, getRacialModifier]);

    const getModifierTextColor = (modifier: number): string => {
        if (modifier > 0) {
            return 'text-green-600 dark:text-green-400';
        } else if (modifier < 0) {
            return 'text-red-600 dark:text-red-400';
        }
        return 'text-gray-500 dark:text-gray-400';
    };

    // Memoized ability calculations to avoid repeated computations
    const abilityCalculations = useMemo(() => {
        try {
            return ABILITY_LIST.map(ability => {
                try {
                    const baseValue = getAbilityScore(ability.id);
                    const adjustedValue = getAdjustedAbilityValue(ability.id);
                    const modifier = adjustedValue !== null ? GetAbilityModifier(adjustedValue) : 0;
                    const modifierString = adjustedValue !== null ? GetAbilityModifierString(adjustedValue) : '';
                    const modifierColor = adjustedValue !== null ? getModifierTextColor(modifier) : 'text-gray-500 dark:text-gray-400';
                    // Only calculate point buy cost when using point buy method and score is within valid range
                    let pointCost = 0;
                    if (generationMethod === AbilityGenerationMethod.pointBuy && baseValue !== null && baseValue >= 8 && baseValue <= 18) {
                        try {
                            pointCost = GetPointBuyCost(baseValue);
                        } catch (error) {
                            console.error(`Error calculating point buy cost for ${ability.name} (${baseValue}):`, error);
                            // Continue with pointCost = 0
                        }
                    }

                    return {
                        ability,
                        baseValue,
                        adjustedValue,
                        modifier,
                        modifierString,
                        modifierColor,
                        pointCost
                    };
                } catch (error) {
                    console.error(`Error processing ability ${ability.name}:`, error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    toastManager?.add({
                        title: 'Error Processing Ability',
                        description: `Failed to process ${ability.name}: ${errorMessage}`,
                        type: 'error',
                    });
                    logPanel.addLogEntry({
                        message: `Error processing ability ${ability.name}: ${errorMessage}`,
                        type: 'error',
                        source: 'abilities-race-tab',
                    });
                    // Return a safe default value
                    return {
                        ability,
                        baseValue: null,
                        adjustedValue: null,
                        modifier: 0,
                        modifierString: '',
                        modifierColor: 'text-gray-500 dark:text-gray-400',
                        pointCost: 0
                    };
                }
            });
        } catch (error) {
            console.error('Error in ability calculations:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toastManager?.add({
                title: 'Error Calculating Abilities',
                description: `Failed to calculate ability values: ${errorMessage}`,
                type: 'error',
            });
            logPanel.addLogEntry({
                message: `Error calculating abilities: ${errorMessage}`,
                type: 'error',
                source: 'abilities-race-tab',
            });
            // Return empty array as fallback
            return [];
        }
    }, [getAbilityScore, getAdjustedAbilityValue, generationMethod, toastManager, logPanel]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
                Abilities & Race
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ability Scores */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        Ability Scores
                    </h3>

                    {/* Generation Method Selection */}
                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <CustomSelect
                                value={generationMethod}
                                onValueChange={handleGenerationMethodChange}
                                options={ABILITY_GENERATION_METHOD_LIST}
                                useAbbreviation={false}
                                label="Generation Method"
                                labelExtraClassName="w-40 mb-1"
                                placeholder="Select generation method..."
                                componentExtraClassName="flex items-center"
                                itemTextExtraClassName="w-26"
                            />
                            {generationMethod === AbilityGenerationMethod.pointBuy ? (
                                <div className="flex items-center gap-2">
                                    <CustomSelect
                                        value={pointBuyConfig}
                                        onValueChange={(value) => setPointBuyConfig(value as PointBuyOptions)}
                                        options={POINT_BUY_OPTIONS_LIST}
                                        useAbbreviation={false}
                                        placeholder="Point Pool..."
                                        componentExtraClassName="w-36"
                                        itemTextExtraClassName="w-28"
                                    />
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={pointBuyConfig === PointBuyOptions.Custom ? customPointBuy : getPointBuyLimit()}
                                            onChange={(e) => setCustomPointBuy(parseInt(e.target.value) || 22)}
                                            disabled={pointBuyConfig !== PointBuyOptions.Custom}
                                            className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            min="1"
                                            max="100"
                                            placeholder="Points"
                                        />
                                        {pointBuyConfig === PointBuyOptions.Custom && (
                                            <div className="absolute right-[-3px] top-0 bottom-0 flex flex-col justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-t"
                                                    onClick={() => {
                                                        if (customPointBuy < 100) {
                                                            setCustomPointBuy(customPointBuy + 1);
                                                        }
                                                    }}
                                                >
                                                    <ChevronUpIcon className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-b"
                                                    onClick={() => {
                                                        if (customPointBuy > 1) {
                                                            setCustomPointBuy(customPointBuy - 1);
                                                        }
                                                    }}
                                                >
                                                    <ChevronDownIcon className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (generationMethod === AbilityGenerationMethod.arrange || generationMethod === AbilityGenerationMethod.drop || generationMethod === AbilityGenerationMethod.inorder) && (
                                <button
                                    onClick={handleRollAbilitySet}
                                    disabled={!isReady || isRollingAbilitySet}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                                >
                                    {isRollingAbilitySet ? 'Rolling...' : 'Roll'}
                                </button>
                            )}
                        </div>

                        {/* Method Description */}
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                {getGenerationMethodDescription(generationMethod)}
                            </p>
                        </div>
                    </div>

                    {/* Two-column layout for abilities and rolled values */}
                    <div className="flex gap-6">
                        {/* Ability Scores - Left Column */}
                        <div className="flex-1 space-y-2">
                            {abilityCalculations.map(({ ability, baseValue, adjustedValue, modifierString, modifierColor, pointCost }) => (
                                <div key={ability.id} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-semibold text-xl w-12">{ability.abbreviation}</div>
                                        <div className="text-sm text-gray-500">{ability.name}</div>
                                    </div>
                                    {/* Ability Score Row */}
                                    <div className="ml-2 flex flex-row gap-4 items-center">
                                        <div className={`${showChevrons ? 'grid grid-cols-[46px_16px]' : ''}`}>
                                            <div className="text-sm text-gray-500 w-12 text-center">Base</div>
                                            {showChevrons && <div></div> /* Spacer */}
                                            {showChevrons ? (
                                                <input
                                                    type="number"
                                                    value={focusedAbilityId === ability.id ? (inputValues[ability.id] ?? '') : (baseValue || '')}
                                                    onChange={(e) => handleInputChange(ability.id, e.target.value)}
                                                    onFocus={() => handleInputFocus(ability.id)}
                                                    onBlur={() => handleInputBlur(ability.id)}
                                                    className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    min="3"
                                                    max="18"
                                                    draggable={baseValue !== null}
                                                    onDragStart={(e) => baseValue !== null && handleDragStart(e, baseValue, 'ability')}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, ability.id)}
                                                />
                                            ) : (
                                                <div
                                                    className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-gray-100 dark:bg-gray-600 cursor-move min-h-[28px] flex items-center justify-center"
                                                    draggable={baseValue !== null}
                                                    onDragStart={(e) => baseValue !== null && handleDragStart(e, baseValue, 'ability')}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, ability.id)}
                                                >
                                                    {baseValue || ''}
                                                </div>
                                            )}

                                            {showChevrons && (
                                                <div className="flex flex-col justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        disabled={generationMethod === AbilityGenerationMethod.pointBuy && getRemainingPoints() <= 0}
                                                        className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-t disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => {
                                                            const currentValue = getAbilityScore(ability.id);
                                                            if (currentValue < 20) {
                                                                handleAbilityChange(ability.id, currentValue + 1);
                                                            }
                                                        }}
                                                    >
                                                        <ChevronUpIcon className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-4 h-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white text-xs flex items-center justify-center rounded-b"
                                                        onClick={() => {
                                                            const currentValue = getAbilityScore(ability.id);
                                                            if (currentValue > 1) {
                                                                handleAbilityChange(ability.id, currentValue - 1);
                                                            }
                                                        }}
                                                    >
                                                        <ChevronDownIcon className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Racial Modifier */}
                                        <div>
                                            <div className="text-sm text-gray-500 w-12 text-center">Race</div>
                                            <div className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-gray-100 dark:bg-gray-600">
                                                {(() => {
                                                    const modifier = getRacialModifier(ability.id);
                                                    return modifier > 0 ? `+${modifier}` : modifier;
                                                })()}
                                            </div>
                                        </div>

                                        {/* Adjusted Score */}
                                        <div>
                                            <div className="text-sm text-gray-500 w-12 text-center">Score</div>
                                            <div className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-gray-100 dark:bg-gray-600 min-h-[28px] flex items-center justify-center">
                                                {adjustedValue !== null ? adjustedValue : ''}
                                            </div>
                                        </div>

                                        {/* Modifier */}
                                        <div>
                                            <div className="text-sm text-gray-500 w-12 text-center">Mod</div>
                                            <div className={`w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-gray-100 dark:bg-gray-600 font-medium min-h-[28px] flex items-center justify-center ${modifierColor}`}>
                                                {modifierString}
                                            </div>
                                        </div>

                                        {/* Point Cost (Point Buy only) */}
                                        {generationMethod === AbilityGenerationMethod.pointBuy && (
                                            <div>
                                                <div className="text-sm text-gray-500 w-8 text-center">Cost</div>
                                                <div className="w-8 py-1 text-center">
                                                    {pointCost}
                                                </div>
                                            </div>
                                        )}

                                        {/* Roll Button */}
                                        {generationMethod === AbilityGenerationMethod.manual && (
                                            <div>
                                                <div className="text-sm">&nbsp;</div>
                                                <button
                                                    onClick={() => handleRollAbility(ability.id)}
                                                    disabled={!isReady || isRolling}
                                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                                                >
                                                    {isRolling && lastResult?.group === ability.id.toString() ? 'Rolling...' : `Roll ${ability.abbreviation}`}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Rolled Values Pool - Right Column */}
                        {(generationMethod === AbilityGenerationMethod.arrange || generationMethod === AbilityGenerationMethod.drop) && (
                            <div className="w-40 flex flex-col gap-2">
                                <h4 className="text-md text-center font-semibold">Available Values</h4>
                                <div
                                    className="min-h-[221px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700/50 flex justify-center"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e)}
                                >
                                    <div className="flex flex-col gap-2">
                                        {rolledValues.map((value, index) => (
                                            <div
                                                key={index}
                                                className="w-10 h-8 border border-gray-300 dark:border-gray-600 rounded text-center bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white font-medium cursor-move flex items-center justify-center"
                                                draggable
                                                onDragStart={(e) => handleDragStartFromPool(e, value, index)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e)}
                                            >
                                                {value}
                                            </div>
                                        ))}
                                    </div>
                                    {rolledValues.length === 0 && (
                                        <div className="text-gray-500 dark:text-gray-400 text-sm mt-8">
                                            Drop values here
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Point Buy Cost Chart - Right Column */}
                        {generationMethod === AbilityGenerationMethod.pointBuy && (
                            <div className="flex flex-col">
                                <h4 className="text-md text-center font-semibold">Point Buy Costs</h4>
                                <div className="grid grid-cols-2 gap-x-2">
                                    {/* Left Column: Scores 9-13 */}
                                    <div>
                                        <table className="md-table">
                                            <thead>
                                                <tr>
                                                    <th className="text-sm text-center">Score</th>
                                                    <th className="text-sm text-center">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 5 }, (_, i) => i + 9).map(score => (
                                                    <tr key={score}>
                                                        <td className="text-sm text-center text-gray-600 dark:text-gray-400">{score}</td>
                                                        <td className="text-sm text-center font-medium">{getSafePointBuyCost(score)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Right Column: Scores 14-18 */}
                                    <div>
                                        <table className="md-table">
                                            <thead>
                                                <tr>
                                                    <th className="text-sm text-center">Score</th>
                                                    <th className="text-sm text-center">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 5 }, (_, i) => i + 14).map(score => (
                                                    <tr key={score}>
                                                        <td className="text-sm text-center text-gray-600 dark:text-gray-400">{score}</td>
                                                        <td className="text-sm text-center font-medium">{getSafePointBuyCost(score)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Total Points Spent (Point Buy only) */}
                    {generationMethod === AbilityGenerationMethod.pointBuy && (
                        <div className="ml-2 flex flex-row gap-4 items-center mt-2">
                            <div className="w-64"></div>
                            <div className="border border-dotted border-gray-300 dark:border-gray-600 rounded-lg flex flex-row gap-1">
                                <div className="w-12">
                                    <div className="text-sm text-gray-500 text-center">Used</div>
                                    <div className="w-12 py-1 text-center">
                                        {getTotalPointsSpent()}
                                    </div>
                                </div>
                                <div className="w-12">
                                    <div className="text-sm text-gray-500 text-center">Left</div>
                                    <div className={`w-12 py-1 text-center font-medium ${getRemainingPoints() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {getRemainingPoints()}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const _resetAbilities: { [key: number]: number } = {};
                                    ABILITY_LIST.forEach(ability => {
                                        setAbilityScore(ability.id, 8);
                                    });
                                }}
                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Race Selection and Details */}
                <div className="space-y-6">
                    {/* Race Selection */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                        <CustomSelect
                            value={state.raceId}
                            onValueChange={handleRaceChange}
                            options={Array.isArray(races) ? races : []}
                            label="Race"
                            placeholder={isLoadingRaces ? "Loading races..." : "Select"}
                            disabled={isLoadingRaces}
                            labelExtraClassName='text-lg font-semibold'
                            componentExtraClassName="flex items-center mb-4 gap-2"
                            itemTextExtraClassName='w-16'
                        />

                        {/* Race Details Panel */}
                        {state.raceId && selectedRaceDetails && (
                            <div className="mt-4">
                                <RaceDisplay
                                    race={selectedRaceDetails as unknown as Parameters<typeof RaceDisplay>[0]['race']}
                                    showHeader={false}
                                    showActions={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
