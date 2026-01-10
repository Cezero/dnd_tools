import { useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { SelectedEntityDisplay } from '@/features/character';
import { FeatSubIdSelectionModal } from '@/features/character/components/FeatSubIdSelectionModal';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { useCacheFunctions } from '@/services/cache';
import { getClassNameFromCache, getFeatNameFromCache, getRaceNameFromCache } from '@/services/cache/IdMapHelpers';
import { CompanionQueryHooks } from '@/services/query/CompanionQueryHooks';
import { DomainQueryHooks } from '@/services/query/DomainQueryHooks';
import type { FeatCacheEntry, FeatInQueryResponse, GetAllCompanionsResponse } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureFeatChoiceFilter, CompanionType, FeatureSourceType } from '@shared/static-data';
import { filterAvailableFeats } from '../utils/featFiltering';

export function ChoicesTab({
    state,
    updateState,
    resolvedData,
    isLoading,
    triggerFeatureResolution: _triggerFeatureResolution,
    handleChoiceSelection,
    sharedData,
    character
}: TabComponentProps): React.JSX.Element {
    const queryClient = useQueryClient();
    const { getDomainSelectByEdition, getClassNameById } = useCacheFunctions();

    // State for domain options
    const [domainOptions, setDomainOptions] = useState<{ id: number; name: string; abbreviation?: string }[]>([]);
    const [isLoadingDomains, setIsLoadingDomains] = useState(false);

    // State for feat sub-id selection modal
    const [featSubIdModalOpen, setFeatSubIdModalOpen] = useState(false);
    const [selectedFeatForSubId, setSelectedFeatForSubId] = useState<FeatInQueryResponse | null>(null);
    const [pendingFeatChoiceId, setPendingFeatChoiceId] = useState<string | null>(null);

    // State for feat search/filtering (for feat choices) - keyed by choiceId
    const [featSearchTerms, setFeatSearchTerms] = useState<Record<string, string>>({});

    // Get filtered feats for each feat choice
    const [filteredFeatsForChoices, setFilteredFeatsForChoices] = useState<Record<string, FeatInQueryResponse[]>>({});
    const [isFilteringFeats, setIsFilteringFeats] = useState(false);

    useEffect(() => {
        if (!character || resolvedData.pendingChoices.length === 0) {
            setFilteredFeatsForChoices({});
            return;
        }

        const filterFeatsForChoices = async () => {
            setIsFilteringFeats(true);
            const filtered: Record<string, FeatInQueryResponse[]> = {};

            if (!character) {
                setFilteredFeatsForChoices({});
                setIsFilteringFeats(false);
                return;
            }

            // Create a map of feat ID to feature data from resolved progressions
            const featFeatureMap = new Map<number, { description?: string | null; summary?: string | null }>();
            if (resolvedData.progressions) {
                resolvedData.progressions.forEach(progression => {
                    if (progression.sourceType === FeatureSourceType.Feat && progression.featId && progression.feature) {
                        featFeatureMap.set(progression.featId, {
                            description: progression.feature.description,
                            summary: progression.feature.summary
                        });
                    }
                });
            }

            for (const choice of resolvedData.pendingChoices) {
                if (choice.type === EntityAppliesToType.Feat) {
                    // Find the corresponding entity to check filterType
                    let entityFilterType: number | null = null;
                    for (const progression of resolvedData.progressions) {
                        if (progression.entities) {
                            const entity = progression.entities.find(e =>
                                `${progression.id}-${e.id}` === choice.id
                            );
                            if (entity) {
                                entityFilterType = entity.filterType ?? null;
                                break;
                            }
                        }
                    }

                    // Start with all feats
                    let availableFeats = sharedData.allFeats;

                    // Apply filterType filtering (e.g., FighterBonus)
                    if (entityFilterType === FeatureFeatChoiceFilter.FighterBonus) {
                        availableFeats = availableFeats.filter(feat => feat.fighterBonus === true);
                    } else if (entityFilterType === FeatureFeatChoiceFilter.MetamagicOrItemCreation) {
                        // Filter for metamagic or item creation feats
                        // This would need to be determined by feat category or flags
                        // For now, include all feats (can be refined later)
                    }

                    // Get all available feats filtered by prerequisites
                    const allFilteredFeats = await filterAvailableFeats(availableFeats, state, resolvedData, sharedData, character);

                    // Apply search filter if there's a search term for this choice
                    const searchTerm = featSearchTerms[choice.id]?.toLowerCase() || '';
                    const filteredBySearch = searchTerm
                        ? allFilteredFeats.filter(feat => {
                            const featureData = featFeatureMap.get(feat.id);
                            return feat.name.toLowerCase().includes(searchTerm) ||
                                featureData?.description?.toLowerCase().includes(searchTerm) ||
                                featureData?.summary?.toLowerCase().includes(searchTerm);
                        })
                        : allFilteredFeats;

                    filtered[choice.id] = filteredBySearch;
                }
            }

            setFilteredFeatsForChoices(filtered);
            setIsFilteringFeats(false);
        };

        filterFeatsForChoices().catch(error => {
            console.error('Error filtering feats for choices:', error);
            setFilteredFeatsForChoices({});
            setIsFilteringFeats(false);
        });
    }, [
        // Use stable keys to prevent infinite loops
        resolvedData.pendingChoices.length,
        resolvedData.progressions.length,
        state.level,
        state.classId,
        state.raceId,
        state.abilityScores?.length,
        state.selectedFeats.length,
        sharedData.allFeats.length,
        character?.id,
        // Re-filter when search terms change (use JSON.stringify to detect value changes)
        JSON.stringify(featSearchTerms)
    ]);

    // Create a map of feat ID to feature data from resolved progressions (for display)
    const featFeatureMap = useMemo(() => {
        const map = new Map<number, { description?: string | null; summary?: string | null }>();
        if (resolvedData.progressions) {
            resolvedData.progressions.forEach(progression => {
                if (progression.sourceType === FeatureSourceType.Feat && progression.featId && progression.feature) {
                    map.set(progression.featId, {
                        description: progression.feature.description,
                        summary: progression.feature.summary
                    });
                }
            });
        }
        return map;
    }, [resolvedData.progressions]);

    // Derive selectedChoices directly from global state
    const selectedChoices = useMemo(() => {
        const choices: Record<string, number[]> = {};
        state.featureChoices.forEach(choice => {
            const choiceId = `${choice.progressionId}-${choice.featureEntityId}`;
            if (!choices[choiceId]) {
                choices[choiceId] = [];
            }
            choices[choiceId].push(choice.appliesToId);
        });
        return choices;
    }, [state.featureChoices]);

    // Create a stable list of choices that includes both pending and selected choices
    // This ensures the order stays consistent and selected choices are still shown
    const [allChoices, setAllChoices] = useState<Array<{ choice: typeof resolvedData.pendingChoices[0]; isSelected: boolean; selectedId?: number }>>([]);

    // Fetch all companions (cached via TanStack Query) for Familiar/Animal Companion choices
    const { data: allCompanionsData } = CompanionQueryHooks.useGetCompanions(undefined, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    } as UseQueryOptions<GetAllCompanionsResponse>);

    // Memoize companions filtered by type for quick lookup
    const companionsByType = useMemo(() => {
        const byType = new Map<CompanionType, Array<{ id: number; name: string }>>();
        if (allCompanionsData?.results) {
            for (const companion of allCompanionsData.results) {
                const type = companion.type as CompanionType;
                if (!byType.has(type)) {
                    byType.set(type, []);
                }
                const monsterName = companion.monster?.name || `Companion ${companion.id}`;
                byType.get(type)!.push({
                    id: companion.id,
                    name: monsterName,
                });
            }
        }
        return byType;
    }, [allCompanionsData]);

    useEffect(() => {
        const loadAllChoices = async () => {
            // Create a map of selected choices by their choice key (progressionId-featureEntityId)
            const selectedChoicesMap = new Map<string, { progressionId: number; featureEntityId: number; appliesToId: number }>();
            state.featureChoices.forEach(choice => {
                const choiceKey = `${choice.progressionId}-${choice.featureEntityId}`;
                if (!selectedChoicesMap.has(choiceKey)) {
                    selectedChoicesMap.set(choiceKey, {
                        progressionId: choice.progressionId,
                        featureEntityId: choice.featureEntityId,
                        appliesToId: choice.appliesToId
                    });
                }
            });

            // Calculate class levels from character advancements
            const classLevels = new Map<number, number>();
            if (character?.advancements) {
                for (const adv of character.advancements) {
                    const currentLevel = classLevels.get(adv.classId) ?? 0;
                    classLevels.set(adv.classId, currentLevel + 1);

                    if (adv.secondaryClassId) {
                        const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                        classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                    }
                }
            }

            // Use backend-provided pending choices
            // These are only the unselected choices - we'll add selected ones from state
            const pendingChoicesMap = new Map(resolvedData.pendingChoices.map(c => [c.id, c]));

            // Build the combined list with selection status, preserving order from progressions
            // Sort by progression level and entity order to ensure stable ordering
            const combined: Array<{ choice: typeof resolvedData.pendingChoices[0]; isSelected: boolean; selectedId?: number }> = [];

            // Iterate through progressions in order to maintain stable ordering
            // Sort progressions by sourceType and level to ensure consistent order
            const sortedProgressions = [...resolvedData.progressions].sort((a, b) => {
                // First sort by sourceType (Race, Class, etc.)
                if (a.sourceType !== b.sourceType) {
                    return a.sourceType - b.sourceType;
                }
                // Then by level
                if (a.level !== b.level) {
                    return a.level - b.level;
                }
                // Finally by ID for stability
                return a.id - b.id;
            });

            for (const progression of sortedProgressions) {
                if (!progression.entities) continue;

                // Sort entities by ID for stable ordering
                const sortedEntities = [...(progression.entities || [])].sort((a, b) => a.id - b.id);

                for (const entity of sortedEntities) {
                    if (entity.type !== EntityType.Choice) continue;

                    const choiceId = `${progression.id}-${entity.id}`;
                    const choiceKey = `${progression.id}-${entity.id}`;
                    const selected = selectedChoicesMap.get(choiceKey);

                    // If this choice is selected, we need to create a pending choice object for display
                    // Otherwise, use the pending choice from backend
                    if (selected) {
                        // Build proper choice name based on type (matching backend logic)
                        const className = progression.classId ? getClassNameFromCache(queryClient, progression.classId) : undefined;
                        const raceName = progression.raceId ? getRaceNameFromCache(queryClient, progression.raceId) : undefined;
                        const source = className || raceName || progression.feature?.name || 'Unknown';
                        let choiceName = '';
                        if (entity.appliesTo === EntityAppliesToType.Domain) {
                            choiceName = `${source}: Select a Domain`;
                        } else if (entity.appliesTo === EntityAppliesToType.Feat) {
                            if (entity.filterType === FeatureFeatChoiceFilter.FighterBonus) {
                                choiceName = `${source}: Select a Fighter Bonus Feat`;
                            } else {
                                choiceName = `${source}: Select a Feat`;
                            }
                        } else if (entity.appliesTo === EntityAppliesToType.Skill) {
                            choiceName = `${source}: Select a Skill`;
                        } else if (entity.appliesTo === EntityAppliesToType.Spell) {
                            choiceName = `${source}: Select a Spell`;
                        } else if (entity.appliesTo === EntityAppliesToType.AnimalCompanion) {
                            choiceName = `${source}: Select an Animal Companion`;
                        } else if (entity.appliesTo === EntityAppliesToType.Familiar) {
                            choiceName = `${source}: Select a Familiar`;
                        } else {
                            choiceName = `${source}: Make a Choice`;
                        }

                        // Build options array based on choice type
                        const options: Array<{ id: string; name: string; description: string; value: number }> = [];

                        if (entity.appliesTo === EntityAppliesToType.Familiar || entity.appliesTo === EntityAppliesToType.AnimalCompanion) {
                            // Get companions of the appropriate type
                            const companionType = entity.appliesTo === EntityAppliesToType.Familiar
                                ? CompanionType.Familiar
                                : CompanionType.AnimalCompanion;
                            const availableCompanions = companionsByType.get(companionType) || [];

                            availableCompanions.forEach(companion => {
                                options.push({
                                    id: `companion-${companion.id}`,
                                    name: companion.name,
                                    description: `${companionType === CompanionType.Familiar ? 'Familiar' : 'Animal Companion'}: ${companion.name}`,
                                    value: companion.id,
                                });
                            });
                        } else if (entity.appliesTo === EntityAppliesToType.Domain) {
                            // Use domain options from state
                            domainOptions.forEach(domain => {
                                options.push({
                                    id: `domain-${domain.id}`,
                                    name: domain.name,
                                    description: `Domain: ${domain.name}`,
                                    value: domain.id,
                                });
                            });
                        } else if (entity.appliesTo === EntityAppliesToType.Feat) {
                            // For feats, we'll use the filtered feats from the existing logic
                            // This will be handled separately in the rendering logic
                            const featName = selected.appliesToId
                                ? getFeatNameFromCache(queryClient, selected.appliesToId) || sharedData.allFeats.find(f => f.id === selected.appliesToId)?.name
                                : undefined;
                            options.push({
                                id: `feat-${selected.appliesToId}`,
                                name: featName || 'Selected Feat',
                                description: '',
                                value: selected.appliesToId,
                            });
                        }

                        const syntheticChoice = {
                            id: choiceId,
                            type: entity.appliesTo as EntityAppliesToType,
                            name: choiceName,
                            description: choiceName,
                            source,
                            level: progression.level,
                            required: true,
                            maxSelections: entity.value || 1,
                            minSelections: 1,
                            options, // Include all available options for dropdown
                            progressionId: progression.id,
                            featureEntityId: entity.id,
                        };
                        combined.push({
                            choice: syntheticChoice as typeof resolvedData.pendingChoices[0],
                            isSelected: true,
                            selectedId: selected.appliesToId
                        });
                    } else {
                        // Use pending choice from backend
                        const pendingChoice = pendingChoicesMap.get(choiceId);
                        if (pendingChoice) {
                            combined.push({
                                choice: pendingChoice,
                                isSelected: false,
                                selectedId: undefined
                            });
                        }
                    }
                }
            }

            setAllChoices(combined);
        };

        loadAllChoices().catch(console.error);
    }, [
        // Only depend on stable values that indicate actual changes
        resolvedData.progressions.length,
        state.featureChoices.length,
        state.editionId,
        companionsByType.size, // Rebuild when companions are loaded
        domainOptions.length, // Rebuild when domain options change
    ]);

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
    const handleSelectionChange = useCallback(async (choiceId: string, selectedValues: number[], subId?: number | null) => {
        if (selectedValues.length > 0) {
            // First try to find in pending choices
            let choice = resolvedData.pendingChoices.find(c => c.id === choiceId);

            // If not found, look up from progressions (for already-selected choices)
            if (!choice) {
                const [progressionId, featureEntityId] = choiceId.split('-').map(Number);
                if (!isNaN(progressionId) && !isNaN(featureEntityId)) {
                    const progression = resolvedData.progressions.find(p => p.id === progressionId);
                    const entity = progression?.entities?.find(e => e.id === featureEntityId);
                    if (entity && entity.type === EntityType.Choice) {
                        // Create a synthetic choice object with the necessary fields
                        choice = {
                            id: choiceId,
                            type: entity.appliesTo as EntityAppliesToType,
                        } as typeof resolvedData.pendingChoices[0];
                    }
                }
            }

            if (choice) {
                const selectedId = selectedValues[0];

                // Check if this is a feat choice that requires useSubId
                if (choice.type === EntityAppliesToType.Feat) {
                    const featData = sharedData.allFeats.find(f => f.id === selectedId);
                    if (featData?.useSubId && subId === undefined) {
                        // Feat requires sub-id selection, show modal
                        setSelectedFeatForSubId(featData);
                        setPendingFeatChoiceId(choiceId);
                        setFeatSubIdModalOpen(true);
                        return; // Don't proceed with choice creation yet
                    }
                }

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
                    appliesToSubId: subId ?? null,
                    choiceIndex: null
                };

                // Remove any existing choice for this progression/entity combination before adding the new one
                // This prevents duplicates when changing a selection
                const existingChoicesFiltered = state.featureChoices.filter(choice =>
                    !(choice.progressionId === progressionId && choice.featureEntityId === featureEntityId)
                );

                // Add the choice to the global state first (optimistic update)
                // This allows the UI to update immediately without waiting for feature resolution
                updateState({
                    type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES,
                    payload: {
                        featureChoices: [...existingChoicesFiltered, newChoice]
                    }
                });

                // Handle the choice asynchronously to avoid blocking the UI
                // Use setTimeout to defer the feature resolution to the next event loop,
                // allowing the UI to update first and preventing the blanking effect
                setTimeout(async () => {
                    try {
                        if (choice.type === EntityAppliesToType.Domain) {
                            const domainData = await queryClient.fetchQuery({
                                queryKey: DomainQueryHooks.getDomainByIdQueryKey(selectedId),
                                queryFn: () => DomainQueryHooks.getDomainByIdQueryFn({ pathParams: { id: selectedId } }),
                                staleTime: 5 * 60 * 1000, // 5 minutes
                                gcTime: 10 * 60 * 1000, // 10 minutes
                            });
                            if (domainData?.features && handleChoiceSelection) {
                                await handleChoiceSelection(choice.type, selectedId, domainData.features);
                            }
                        } else if (choice.type === EntityAppliesToType.Feat) {
                            // Feats don't have features - they have benefits that are applied directly
                            // The feat is already tracked in featureChoices, and getAllCharacterFeats will include it
                            // Just trigger feature resolution to ensure benefits are recalculated
                            if (_triggerFeatureResolution) {
                                await _triggerFeatureResolution();
                            }
                        } else if (handleChoiceSelection) {
                            await handleChoiceSelection(choice.type, selectedId, []);
                        }
                    } catch (error) {
                        console.error(`Error handling choice selection:`, error);
                    }
                }, 0);
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
    }, [resolvedData.pendingChoices, resolvedData.progressions, handleChoiceSelection, updateState, state.featureChoices, state.characterId, sharedData.allFeats, queryClient, _triggerFeatureResolution]);

    // Handle weapon selection from modal
    const handleWeaponSelection = useCallback(async (weaponId: number) => {
        if (pendingFeatChoiceId) {
            // Get the selected feat ID from the pending choice
            const choice = resolvedData.pendingChoices.find(c => c.id === pendingFeatChoiceId);
            if (choice && selectedFeatForSubId) {
                // Get the selected value from pending queries
                const pendingQuery = pendingQueries[pendingFeatChoiceId];
                if (pendingQuery) {
                    // Complete the choice selection with sub-id
                    await handleSelectionChange(pendingFeatChoiceId, [pendingQuery.id], weaponId);
                }
            }
            setFeatSubIdModalOpen(false);
            setSelectedFeatForSubId(null);
            setPendingFeatChoiceId(null);
        }
    }, [pendingFeatChoiceId, selectedFeatForSubId, resolvedData.pendingChoices, pendingQueries, handleSelectionChange, sharedData.allFeats]);

    // Check if there are any choices to display (pending or selected)
    const hasChoices = allChoices.length > 0;

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
            {!hasChoices && !isLoading && (
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
            {!isLoading && hasChoices && (
                <div className="space-y-6">
                    {allChoices.map(({ choice, isSelected, selectedId }) => {
                        if (!choice) return null;

                        // Special handling for feat choices - use the same view as FeatsTab
                        if (choice.type === EntityAppliesToType.Feat) {
                            const filteredFeats = filteredFeatsForChoices[choice.id] || [];
                            const selectedFeatId = isSelected ? selectedId : undefined;
                            const searchTerm = featSearchTerms[choice.id] || '';

                            // Override choice name if it's a race choice and we have race data
                            let displayName = choice.name;
                            if (choice.name.startsWith('Race:') && sharedData.race) {
                                displayName = choice.name.replace('Race:', `${sharedData.race.name}:`);
                            }

                            // Update display name when a choice is selected
                            if (isSelected && selectedFeatId) {
                                const selectedFeat = sharedData.allFeats.find(f => f.id === selectedFeatId);
                                if (selectedFeat) {
                                    // Change "Select a Fighter Bonus Feat" to "Bonus Feat Selected"
                                    // Change "Select a Feat" to "Feat Selected"
                                    if (displayName.includes('Select a Fighter Bonus Feat')) {
                                        displayName = displayName.replace('Select a Fighter Bonus Feat', 'Bonus Feat Selected');
                                    } else if (displayName.includes('Select a Feat')) {
                                        displayName = displayName.replace('Select a Feat', 'Feat Selected');
                                    } else if (displayName.includes('Select')) {
                                        // Generic fallback for other choice types
                                        displayName = displayName.replace(/Select.*$/, 'Selected');
                                    }
                                }
                            }

                            // If a feat is selected, show only the selected feat with a remove button
                            if (isSelected && selectedFeatId) {
                                const selectedFeat = sharedData.allFeats.find(f => f.id === selectedFeatId);
                                if (!selectedFeat) return null;

                                return (
                                    <div key={choice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        <h3 className="text-lg font-medium mb-4">{displayName}</h3>
                                        <div className="p-3 border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                        {selectedFeat.name}
                                                    </h4>
                                                    {(() => {
                                                        const featureData = featFeatureMap.get(selectedFeat.id);
                                                        return (
                                                            <>
                                                                {featureData?.description && (
                                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                                        {featureData.description}
                                                                    </p>
                                                                )}
                                                                {featureData?.summary && (
                                                                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                                                                        <span className="font-medium">Summary:</span> {featureData.summary}
                                                                    </p>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleSelectionChange(choice.id, []);
                                                    }}
                                                    className="ml-3 px-4 py-2 rounded-md text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            // Otherwise, show the full list of available feats
                            // Make sure displayName is reset to original when not selected
                            if (!isSelected) {
                                // Reset to original name if not selected
                                displayName = choice.name;
                                if (choice.name.startsWith('Race:') && sharedData.race) {
                                    displayName = choice.name.replace('Race:', `${sharedData.race.name}:`);
                                }
                            }

                            return (
                                <div key={choice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h3 className="text-lg font-medium mb-4">{displayName}</h3>

                                    {/* Search input */}
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="Search feats..."
                                            value={searchTerm}
                                            onChange={(e) => setFeatSearchTerms(prev => ({ ...prev, [choice.id]: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        Showing {filteredFeats.length} feats you qualify for based on your character's abilities, skills, and level.
                                    </p>

                                    {/* Feat list */}
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredFeats.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                No feats available matching your search.
                                            </p>
                                        ) : (
                                            filteredFeats.map((feat) => {
                                                const featIsSelected = selectedFeatId === feat.id;
                                                return (
                                                    <div
                                                        key={feat.id}
                                                        className={`p-3 border rounded-lg ${featIsSelected
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                                    {feat.name}
                                                                </h4>
                                                                {(() => {
                                                                    const featureData = featFeatureMap.get(feat.id);
                                                                    return (
                                                                        <>
                                                                            {featureData?.description && (
                                                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                                                    {featureData.description}
                                                                                </p>
                                                                            )}
                                                                            {featureData?.summary && (
                                                                                <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                                                                                    <span className="font-medium">Summary:</span> {featureData.summary}
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newValues = featIsSelected ? [] : [feat.id];
                                                                    handleSelectionChange(choice.id, newValues);
                                                                }}
                                                                className={`ml-3 px-4 py-2 rounded-md text-sm font-medium ${featIsSelected
                                                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                                                                    : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                                                                    }`}
                                                            >
                                                                {featIsSelected ? 'Remove' : 'Select'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // Non-feat choices use the original rendering
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

            {/* Feat Sub-ID Selection Modal */}
            <FeatSubIdSelectionModal
                isOpen={featSubIdModalOpen}
                onClose={() => {
                    setFeatSubIdModalOpen(false);
                    setSelectedFeatForSubId(null);
                    setPendingFeatChoiceId(null);
                }}
                onConfirm={handleWeaponSelection}
                feat={selectedFeatForSubId as FeatCacheEntry | null}
                resolvedProgressions={resolvedData.progressions}
            />
        </div>
    );
}
