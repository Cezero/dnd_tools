import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { SelectedEntityDisplay } from '@/features/character';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { useCacheFunctions } from '@/services/cache';
import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import { EntityAppliesToType } from '@shared/static-data';

export function ChoicesTab({
    state,
    updateState,
    resolvedData,
    isLoading,
    triggerFeatureResolution: _triggerFeatureResolution,
    handleChoiceSelection
}: TabComponentProps): React.JSX.Element {
    const { getDomainSelectByEdition } = useCacheFunctions();

    // State for domain options
    const [domainOptions, setDomainOptions] = useState<{ id: number; name: string; abbreviation?: string }[]>([]);
    const [isLoadingDomains, setIsLoadingDomains] = useState(false);

    // Derive selectedChoices directly from global state
    const selectedChoices = useMemo(() => {
        const choices: Record<string, number[]> = {};
        console.log('Deriving selectedChoices from state.featureChoices:', state.featureChoices);
        state.featureChoices.forEach(choice => {
            const choiceId = `${choice.progressionId}-${choice.featureEntityId}`;
            console.log(`Processing choice: progressionId=${choice.progressionId}, featureEntityId=${choice.featureEntityId}, appliesToId=${choice.appliesToId}, choiceId=${choiceId}`);
            if (!choices[choiceId]) {
                choices[choiceId] = [];
            }
            choices[choiceId].push(choice.appliesToId);
        });
        console.log('Final selectedChoices:', choices);
        return choices;
    }, [state.featureChoices]);

    // Fetch domain options when edition changes
    useEffect(() => {
        const fetchDomainOptions = async () => {
            if (state.editionId) {
                setIsLoadingDomains(true);
                try {
                    const domains = await getDomainSelectByEdition(state.editionId);
                    setDomainOptions(domains || []);
                } catch (error) {
                    console.error('Failed to fetch domain options:', error);
                    setDomainOptions([]);
                } finally {
                    setIsLoadingDomains(false);
                }
            } else {
                setDomainOptions([]);
            }
        };
        fetchDomainOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.editionId]);

    // Track pending queries keyed by choiceId
    const [pendingQueries, setPendingQueries] = useState<Record<string, { type: number; id: number }>>({});


    // Get all selected domain IDs from pending queries
    const selectedDomainIds = Object.values(pendingQueries)
        .filter(query => query.type === EntityAppliesToType.Domain)
        .map(query => query.id);

    // Handle choice selection with imperative API
    const handleSelectionChange = useCallback(async (choiceId: string, selectedValues: number[]) => {
        if (selectedValues.length > 0) {
            const choice = resolvedData.pendingChoices.find(c => c.id === choiceId);
            if (choice) {
                const selectedId = selectedValues[0];

                // Add to pending queries map
                setPendingQueries(prev => ({
                    ...prev,
                    [choiceId]: { type: choice.type, id: selectedId }
                }));

                // Update the global state with the choice
                const [progressionId, featureEntityId] = choiceId.split('-').map(Number);
                const newChoice = {
                    id: Date.now(), // Temporary ID for local state
                    characterId: state.characterId || 0,
                    progressionId,
                    advancementId: 0, // Will be set when saving to backend
                    featureEntityId,
                    appliesToId: selectedId,
                    appliesToSubId: null,
                    choiceIndex: null
                };

                // Add the choice to the global state
                updateState({
                    type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES,
                    payload: {
                        featureChoices: [...state.featureChoices, newChoice]
                    }
                });

                // Handle the choice immediately with imperative API
                if (choice.type === EntityAppliesToType.Domain) {
                    try {
                        const domainData = await DomainQueryHooks.getDomainById(selectedId);
                        if (domainData?.features && handleChoiceSelection) {
                            await handleChoiceSelection(choice.type, selectedId, domainData.features);
                        }
                    } catch (error) {
                        console.error(`Error fetching domain ${selectedId}:`, error);
                    }
                } else if (handleChoiceSelection) {
                    await handleChoiceSelection(choice.type, selectedId, []);
                }
            }
        } else {
            setPendingQueries(prev => {
                const newQueries = { ...prev };
                delete newQueries[choiceId];
                return newQueries;
            });

            // Remove the choice from the global state
            const [progressionId, featureEntityId] = choiceId.split('-').map(Number);
            updateState({
                type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES,
                payload: {
                    featureChoices: state.featureChoices.filter(choice =>
                        !(choice.progressionId === progressionId && choice.featureEntityId === featureEntityId)
                    )
                }
            });
        }
    }, [resolvedData.pendingChoices, handleChoiceSelection, updateState, state.featureChoices, state.characterId]);

    // Check if prerequisites are met
    const hasPrerequisites = resolvedData.pendingChoices.length > 0;

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
                Character Choices
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
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Loading character choices...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* No Choices Message */}
            {!hasPrerequisites && !isLoading && (
                <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No choices need to be made
                        </p>
                    </div>
                </div>
            )}

            {/* Choices Content */}
            {!isLoading && hasPrerequisites && (
                <div className="space-y-6">
                    {resolvedData.pendingChoices.map((choice) => {
                        console.log('Rendering choice:', { id: choice.id, name: choice.name, type: choice.type });
                        return (
                            <div key={choice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                {choice.maxSelections === 1 ? (
                                    <>
                                        <h3 className="text-lg font-medium mb-2">{choice.name}</h3>
                                        <div className="grid grid-cols-2 gap-4 align-top">
                                            <div>
                                                <CustomSelect
                                                    options={choice.type === EntityAppliesToType.Domain && state.editionId
                                                        ? domainOptions
                                                        : choice.options.map(opt => ({ id: opt.value, name: opt.name }))
                                                    }
                                                    disabled={isLoadingDomains}
                                                    value={(() => {
                                                        const selectedValue = selectedChoices[choice.id]?.[0] || null;
                                                        console.log(`Choice ${choice.id}: selectedValue=${selectedValue}, selectedChoices[${choice.id}]=${JSON.stringify(selectedChoices[choice.id])}`);
                                                        return selectedValue;
                                                    })()}
                                                    onValueChange={(selectedValue) => {
                                                        const newValues = selectedValue ? [selectedValue] : [];
                                                        handleSelectionChange(choice.id, newValues);
                                                    }}
                                                    placeholder={`Select ...`}
                                                    componentExtraClassName="flex items-center gap-2"
                                                    triggerExtraClassName="w-30 pl-1"
                                                />
                                            </div>
                                            <div>
                                                {selectedChoices[choice.id]?.[0] && (
                                                    <SelectedEntityDisplay
                                                        choiceType={choice.type}
                                                        selectedValue={selectedChoices[choice.id][0]}
                                                        showHeader={false}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">{choice.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            Select {choice.minSelections} to {choice.maxSelections} options
                                        </p>
                                        <div className="space-y-2">
                                            {choice.options.map((option) => (
                                                <label key={option.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedChoices[choice.id]?.includes(option.value) || false}
                                                        onChange={(e) => {
                                                            const currentValues = selectedChoices[choice.id] || [];
                                                            const newValues = e.target.checked
                                                                ? [...currentValues, option.value]
                                                                : currentValues.filter(v => v !== option.value);
                                                            handleSelectionChange(choice.id, newValues);
                                                        }}
                                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {option.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
