import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback } from 'react';

import { useDiceBox } from '@/components/dice-box';
import { CustomSelect } from '@/components/forms/FormComponents';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { LanguageService } from '@/lib/LanguageService';
import type { RaceSummary, Race, CharacterWithAllDetailsResponse } from '@shared/schema';
import {
    ABILITY_LIST,
    ABILITY_MAP,
    ABILITY_NAME_MAP,
    GetAbilityModifier,
    GetAbilityModifierString,
    GetPointBuyCost,
    LANGUAGE_MAP,
    SIZE_MAP,
    SpecialFeatureId,
    PointBuyOptions,
    AbilityGenerationMethod,
    ABILITY_GENERATION_METHOD_LIST,
    POINT_BUY_OPTIONS_LIST
} from '@shared/static-data';

import { getClassById } from '../../class/ClassUtils';
import { CharacterUtils } from '../CharacterUtils';

interface AbilitiesRaceTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
    races?: RaceSummary[];
    selectedRaceDetails?: Race | null;
}

export function AbilitiesRaceTab({
    character,
    onUpdate,
    races = [],
    selectedRaceDetails
}: AbilitiesRaceTabProps): React.JSX.Element {
    const { rollDice, rollDiceGroups, isReady, isRolling, lastResult, onRollComplete } = useDiceBox();
    const [generationMethod, setGenerationMethod] = useState<AbilityGenerationMethod>(AbilityGenerationMethod.manual);
    const [rolledValues, setRolledValues] = useState<number[]>([]);
    const [isRollingAbilitySet, setIsRollingAbilitySet] = useState(false);
    const [_pendingRolls, setPendingRolls] = useState<Set<string>>(new Set());
    const [_assignedAbilitiesForOrder, setAssignedAbilitiesForOrder] = useState<Set<string>>(new Set());
    const [showChevrons, setShowChevrons] = useState(true);
    const [pointBuyConfig, setPointBuyConfig] = useState<PointBuyOptions>(PointBuyOptions.Challenging);
    const [customPointBuy, setCustomPointBuy] = useState<number>(22);
    const [favoredClassData, setFavoredClassData] = useState<{ id: number; name: string } | null>(null);

    // Load favored class data when race changes
    useEffect(() => {
        const loadFavoredClass = async () => {
            if (selectedRaceDetails?.favoredClassId && selectedRaceDetails.favoredClassId !== -1) {
                const classData = await getClassById(selectedRaceDetails.favoredClassId);
                if (classData) {
                    setFavoredClassData({ id: classData.id, name: classData.name });
                } else {
                    setFavoredClassData(null);
                }
            } else {
                setFavoredClassData(null);
            }
        };

        loadFavoredClass();
    }, [selectedRaceDetails?.favoredClassId]);

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
        const abilityScore = character.abilityScores.find(attr => attr.abilityId === abilityId);
        return abilityScore?.value ?? null;
    }, [character.abilityScores]);

    const getTotalPointsSpent = useCallback((): number => {
        return ABILITY_LIST.reduce((total, ability) => {
            const score = getAbilityScore(ability.id);
            return total + (score !== null ? GetPointBuyCost(score) : 0);
        }, 0);
    }, [getAbilityScore]);

    const getRemainingPoints = useCallback((): number => {
        return getPointBuyLimit() - getTotalPointsSpent();
    }, [getPointBuyLimit, getTotalPointsSpent]);

    // Set ability score
    const setAbilityScore = useCallback((abilityId: number, value: number) => {
        const updatedAbilityScores = [...character.abilityScores];
        const existingIndex = updatedAbilityScores.findIndex(attr => attr.abilityId === abilityId);

        if (existingIndex >= 0) {
            updatedAbilityScores[existingIndex] = {
                ...updatedAbilityScores[existingIndex],
                value: value
            };
        } else {
            updatedAbilityScores.push({
                id: 0,
                characterId: character.id,
                abilityId: abilityId,
                value: value
            });
        }

        onUpdate({ abilityScores: updatedAbilityScores });
    }, [character.abilityScores, character.id, onUpdate]);

    const handleAbilityChange = useCallback((abilityId: number, value: number) => {
        // Enforce 8-18 range for Point Buy
        if (generationMethod === AbilityGenerationMethod.pointBuy) {
            value = Math.max(8, Math.min(18, value));

            // Check if this would increase the ability score
            const currentValue = getAbilityScore(abilityId);
            if (currentValue !== null && value > currentValue) {
                // Calculate the additional cost
                const additionalCost = GetPointBuyCost(value) - GetPointBuyCost(currentValue);
                const remainingPoints = getRemainingPoints();

                // Prevent increase if not enough points
                if (additionalCost > remainingPoints) {
                    return; // Don't update if not enough points
                }
            }
        }

        setAbilityScore(abilityId, value);
    }, [generationMethod, getAbilityScore, getRemainingPoints, setAbilityScore]);

    // Set up roll complete callback
    useEffect(() => {
        const unsubscribe = onRollComplete((result) => {
            console.log('Roll complete:', result);

            // Handle both single result and array of results
            const results = Array.isArray(result) ? result : [result];

            if (generationMethod === AbilityGenerationMethod.inorder) {
                // Handle 3d6 order - assign all results at once
                const newAbilityScores = [...character.abilityScores];
                let allAssigned = true;

                results.forEach(result => {
                    const ability = ABILITY_LIST.find(ability => ability.name === result.group);
                    if (ability) {
                        console.log('Assigning', result.value, 'to', ability.name);
                        const existingIndex = newAbilityScores.findIndex(attr => attr.abilityId === ability.id);
                        if (existingIndex >= 0) {
                            newAbilityScores[existingIndex] = {
                                ...newAbilityScores[existingIndex],
                                value: result.value
                            };
                        } else {
                            newAbilityScores.push({
                                id: 0,
                                characterId: character.id,
                                abilityId: ability.id,
                                value: result.value
                            });
                        }
                    } else {
                        allAssigned = false;
                    }
                });

                if (allAssigned) {
                    onUpdate({ abilityScores: newAbilityScores });
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
                        console.log('Manual roll - assigning', result.value, 'to ability', result.group, result);
                        handleAbilityChange(abilityId, result.value);
                    }
                });
            }
        });

        return unsubscribe;
    }, [onRollComplete, generationMethod, character.abilityScores, character.id, rolledValues, onUpdate, handleAbilityChange]);



    const handleRollAbility = (abilityId: number) => {
        const abilityName = ABILITY_MAP[abilityId]?.name || `Ability ${abilityId}`;
        rollDice('3d6', abilityName);
    };

    const handleRaceChange = (raceId: number | null) => {
        onUpdate({
            raceId: raceId || 0,
            race: raceId ? { id: raceId, name: '' } : { id: 0, name: '' }
        });
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
                    id: 0,
                    characterId: character.id,
                    abilityId: ability.id,
                    value: 8
                }));
                onUpdate({ abilityScores: newAbilityScores });
            }
        }
    };

    const handleRollAbilitySet = () => {
        setIsRollingAbilitySet(true);
        setRolledValues([]);
        setAssignedAbilitiesForOrder(new Set());

        // Clear all assigned abilities when rolling new values
        onUpdate({ abilityScores: [] });

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
            const sourceAbilityScore = character.abilityScores.find(attr => attr.value === value);
            if (sourceAbilityScore) {
                const existingValue = getAbilityScore(targetAbilityId);

                // Remove the source ability
                const updatedAbilityScores = character.abilityScores.filter(attr => attr.abilityId !== sourceAbilityScore.abilityId);

                // Add the target ability
                if (targetAbilityId !== sourceAbilityScore.abilityId) {
                    updatedAbilityScores.push({
                        id: 0,
                        characterId: character.id,
                        abilityId: targetAbilityId,
                        value: value
                    });
                }

                let newRolledValues = [...rolledValues];

                // If the target ability already had a value, add it back to the pool
                if (existingValue !== null && existingValue !== 0) {
                    newRolledValues = [...newRolledValues, existingValue];
                }

                onUpdate({ abilityScores: updatedAbilityScores });
                setRolledValues(newRolledValues);
            }
        } else if (source === 'ability' && targetAbilityId === undefined) {
            // Moving from ability back to pool
            const updatedAbilityScores = character.abilityScores.filter(attr => attr.value !== value);
            onUpdate({ abilityScores: updatedAbilityScores });
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

    // Helper functions using race data
    const getSizeForRace = (raceId: number): string => {
        const race = races.find(r => r.id === raceId);
        if (!race) return 'Medium';
        return SIZE_MAP[race.sizeId]?.name || 'Medium';
    };

    const getLanguageNames = (languageIds: number[]): string => {
        return languageIds
            .map(id => LANGUAGE_MAP[id]?.name)
            .filter(Boolean)
            .join(', ') || 'None';
    };

    const getAutomaticLanguages = (): number[] => {
        if (!selectedRaceDetails?.features) return [];
        return LanguageService.getAutomaticLanguages(selectedRaceDetails.features);
    };

    const getBonusLanguages = (): number[] => {
        if (!selectedRaceDetails?.features) return [];
        return LanguageService.getBonusLanguages(selectedRaceDetails.features);
    };

    const getAbilityAdjustments = (): string => {
        if (!selectedRaceDetails?.features) return 'None';
        return CharacterUtils.getFormattedAbilityAdjustments(selectedRaceDetails.features);
    };

    const getFavoredClass = (): string => {
        if (!selectedRaceDetails) return 'None';
        if (selectedRaceDetails.favoredClassId === -1) return 'Any';
        return favoredClassData?.name || 'Loading...';
    };

    const truncateDescription = (description: string | null): string => {
        if (!description) return '';
        return description.length > 1000 ? description.substring(0, 1000) + '...' : description;
    };

    const getRacialModifier = (abilityId: number): number => {
        if (!selectedRaceDetails?.features) return 0;
        return CharacterUtils.getAbilityAdjustment(selectedRaceDetails.features, abilityId);
    };

    const getAdjustedAbilityValue = (abilityId: number): number | null => {
        const baseValue = getAbilityScore(abilityId);
        if (baseValue === null) return null;
        const racialModifier = getRacialModifier(abilityId);
        return baseValue + racialModifier;
    };

    const getModifierTextColor = (modifier: number): string => {
        if (modifier > 0) {
            return 'text-green-600 dark:text-green-400';
        } else if (modifier < 0) {
            return 'text-red-600 dark:text-red-400';
        }
        return 'text-gray-500 dark:text-gray-400';
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
                Abilities & Race
            </h2>

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
                            {ABILITY_LIST.map((ability) => (
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
                                                    value={getAbilityScore(ability.id) || ''}
                                                    onChange={(e) => handleAbilityChange(ability.id, parseInt(e.target.value) || 0)}
                                                    className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    min="1"
                                                    max="20"
                                                    draggable={getAbilityScore(ability.id) !== undefined}
                                                    onDragStart={(e) => getAbilityScore(ability.id) !== undefined && handleDragStart(e, getAbilityScore(ability.id)!, 'ability')}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, ability.id)}
                                                />
                                            ) : (
                                                <div
                                                    className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-gray-100 dark:bg-gray-600 cursor-move min-h-[28px] flex items-center justify-center"
                                                    draggable={getAbilityScore(ability.id) !== undefined}
                                                    onDragStart={(e) => getAbilityScore(ability.id) !== undefined && handleDragStart(e, getAbilityScore(ability.id)!, 'ability')}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, ability.id)}
                                                >
                                                    {getAbilityScore(ability.id) || ''}
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
                                                {getRacialModifier(ability.id) > 0 ? `+${getRacialModifier(ability.id)}` : getRacialModifier(ability.id)}
                                            </div>
                                        </div>

                                        {/* Adjusted Score */}
                                        <div>
                                            <div className="text-sm text-gray-500 w-12 text-center">Score</div>
                                            <div className="w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-gray-100 dark:bg-gray-600 min-h-[28px] flex items-center justify-center">
                                                {getAdjustedAbilityValue(ability.id) !== null ? getAdjustedAbilityValue(ability.id) : ''}
                                            </div>
                                        </div>

                                        {/* Modifier */}
                                        <div>
                                            <div className="text-sm text-gray-500 w-12 text-center">Mod</div>
                                            <div className={`w-12 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-gray-100 dark:bg-gray-600 font-medium min-h-[28px] flex items-center justify-center ${getAdjustedAbilityValue(ability.id) !== null ? getModifierTextColor(GetAbilityModifier(getAdjustedAbilityValue(ability.id)!)) : 'text-gray-500 dark:text-gray-400'}`}>
                                                {getAdjustedAbilityValue(ability.id) !== null ? GetAbilityModifierString(getAdjustedAbilityValue(ability.id)!) : ''}
                                            </div>
                                        </div>

                                        {/* Point Cost (Point Buy only) */}
                                        {generationMethod === AbilityGenerationMethod.pointBuy && (
                                            <div>
                                                <div className="text-sm text-gray-500 w-8 text-center">Cost</div>
                                                <div className="w-8 py-1 text-center">
                                                    {getAbilityScore(ability.id) !== null ? GetPointBuyCost(getAbilityScore(ability.id)!) : 0}
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
                                                        <td className="text-sm text-center font-medium">{GetPointBuyCost(score)}</td>
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
                                                        <td className="text-sm text-center font-medium">{GetPointBuyCost(score)}</td>
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
                            value={character.raceId}
                            onValueChange={handleRaceChange}
                            options={races}
                            label="Race"
                            placeholder="Select"
                            labelExtraClassName='text-lg font-semibold'
                            componentExtraClassName="flex items-center mb-4 gap-2"
                            itemTextExtraClassName='w-16'
                        />

                        {/* Race Details Panel */}
                        {character.raceId > 0 && selectedRaceDetails && (
                            <>
                                {/* Key Attributes */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Size:</strong> {getSizeForRace(character.raceId)}</p>
                                        <p><strong>Speed:</strong> {selectedRaceDetails.speed} ft.</p>
                                        <p><strong>Favored Class:</strong> {getFavoredClass()}</p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Languages:</strong> {getLanguageNames(getAutomaticLanguages())}</p>
                                        <p><strong>Bonus Languages:</strong> {getLanguageNames(getBonusLanguages())}</p>
                                        <p><strong>Ability Adjustments:</strong> {getAbilityAdjustments()}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedRaceDetails.description && (
                                    <div className="mt-4">
                                        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                                        <div className="prose-custom max-w-none text-sm">
                                            <ProcessMarkdown
                                                id={`race-${selectedRaceDetails.name}-description`}
                                                markdown={truncateDescription(selectedRaceDetails.description)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Racial Features */}
                                {selectedRaceDetails.features && selectedRaceDetails.features.filter(fp =>
                                    fp.featureId !== SpecialFeatureId.AutomaticLanguage &&
                                    fp.featureId !== SpecialFeatureId.BonusLanguage &&
                                    fp.featureId !== SpecialFeatureId.AbilityAdjustment
                                ).length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">
                                                {selectedRaceDetails.name} Racial Features
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedRaceDetails.features
                                                    .filter(fp =>
                                                        fp.featureId !== SpecialFeatureId.AutomaticLanguage &&
                                                        fp.featureId !== SpecialFeatureId.BonusLanguage &&
                                                        fp.featureId !== SpecialFeatureId.AbilityAdjustment
                                                    )
                                                    .map(feature => (
                                                        <div key={feature.id} className="text-sm">
                                                            <div className="prose-custom max-w-none">
                                                                <ProcessMarkdown
                                                                    id={`feature-${feature.id}-description`}
                                                                    markdown={feature.feature?.description || ''}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 
