import React, { useMemo, useState } from 'react';

import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { useCacheFunctions } from '@/services/cache/CacheFunctions';
import type { FeatInQueryResponse } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

import { FeatSubIdSelectionModal } from '../components/FeatSubIdSelectionModal';

/**
 * Feats tab component for managing character feat selection.
 * 
 * **Sync Pattern**: This tab follows the standardized state → useEffect → applyUpdate pattern.
 * - Updates state via `updateState()` when feats change
 * - CharacterEdit automatically syncs changes to resolution session via useEffect hooks
 * - Do NOT call `resolution.applyUpdate()` directly from this tab
 * 
 * @see CharacterEdit component for sync pattern documentation
 */
export function FeatsTab({
    formattedCharacter: _formattedCharacter,
    state,
    updateState,
    resolvedData,
    isLoading,
    triggerFeatureResolution,
    sharedData,
    character: _character
}: TabComponentProps): React.JSX.Element {
    const { getItemNameMap } = useCacheFunctions();

    // Use qualifiedFeats from resolvedData instead of separate API call
    // qualifiedFeats contains all feats the character qualifies for (filtered by prerequisites, etc.)
    const [searchTerm, setSearchTerm] = useState('');
    const [modalFeat, setModalFeat] = useState<FeatInQueryResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Get item name map directly from cache (synchronous, no state needed)
    const itemNameMap = getItemNameMap();

    const availableSlots = resolvedData.availableFeatsCount;
    const selectedCount = state.selectedFeats.length;

    // Use qualifiedFeats from resolvedData (list of feats the character qualifies for)
    // Note: This is the list of qualified feats, not the count (availableFeatsCount is the count)
    const qualifiedFeats = useMemo(() => resolvedData.qualifiedFeats || [], [resolvedData.qualifiedFeats]);

    // Create a map of feat ID to feature data from resolved progressions
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

    // Filter feats based on search term (including feature description and summary)
    const filteredFeats = useMemo(() => {
        if (!searchTerm.trim()) return qualifiedFeats;

        const term = searchTerm.toLowerCase();
        return qualifiedFeats.filter(feat => {
            const featureData = featFeatureMap.get(feat.id);
            return feat.name.toLowerCase().includes(term) ||
                featureData?.description?.toLowerCase().includes(term) ||
                featureData?.summary?.toLowerCase().includes(term);
        });
    }, [qualifiedFeats, searchTerm, featFeatureMap]);


    // Get granted feats from resolved data
    const grantedFeats = useMemo(() => {
        return resolvedData.grantedFeats;
    }, [resolvedData.grantedFeats]);

    // Get selected feat details (user-selected feats)
    // Use sharedData.allFeats for lookup since owned feats are filtered out of availableFeats
    const selectedFeats = useMemo(() => {
        return state.selectedFeats.map(featId => {
            const feat = sharedData.allFeats.find(f => f.id === featId);
            if (!feat) return null;

            // Get sub-id from state.featSubIds (stored in AdvancementFeat.featSubId)
            const featSubId = state.featSubIds[featId];
            const subIdName = featSubId && featSubId > 0
                ? itemNameMap.get(featSubId)
                : undefined;

            return {
                ...feat,
                source: 'selected' as const,
                subIdName
            };
        }).filter(Boolean);
    }, [state.selectedFeats, sharedData.allFeats, state.featSubIds, itemNameMap]);

    // Get granted feat details (from class/race features)
    // Filter out proficiency feats (those granted by race/class proficiencies)
    const grantedFeatDetails = useMemo(() => {
        return grantedFeats
            .filter(entity => {
                // Exclude proficiency feats - these are granted by proficiency entities
                // and should not be shown in the "Your Feats" view
                return !(entity.type === EntityType.Other && entity.appliesTo === EntityAppliesToType.Proficiency);
            })
            .map(entity => {
                // Look in sharedData.allFeats since granted feats are filtered out of availableFeats
                const feat = sharedData.allFeats.find(f => f.id === entity.appliesToId);
                if (!feat) return null;

                // Get sub-id name if present (for granted feats with useSubId)
                const subIdName = entity.appliesToSubId && entity.appliesToSubId > 0
                    ? itemNameMap.get(entity.appliesToSubId)
                    : undefined;

                return { ...feat, source: 'granted' as const, subIdName };
            })
            .filter(Boolean);
    }, [grantedFeats, sharedData.allFeats, itemNameMap]);

    // Get choice-based feat details (from CharacterFeatureChoice, e.g., fighter bonus feats)
    const choiceFeatDetails = useMemo(() => {
        const choiceFeats: Array<FeatInQueryResponse & { source: 'choice'; subIdName?: string; sourceFeature?: string }> = [];

        // Extract feat choices from state.featureChoices
        for (const choice of state.featureChoices) {
            // Look up the FeatureEntity in resolved progressions to determine if this is a feat choice
            let entityAppliesTo: number | null = null;
            let sourceFeatureName: string | null = null;

            for (const progression of resolvedData.progressions) {
                if (progression.id === choice.progressionId && progression.entities) {
                    const entity = progression.entities.find(e => e.id === choice.featureEntityId);
                    if (entity) {
                        entityAppliesTo = entity.appliesTo;
                        sourceFeatureName = progression.feature?.name || null;
                        break;
                    }
                }
            }

            // Only include if this is a feat choice
            if (entityAppliesTo === EntityAppliesToType.Feat) {
                // Use qualifiedFeats for lookup since it has all the required properties
                const feat = resolvedData.qualifiedFeats?.find(f => f.id === choice.appliesToId);
                if (feat) {
                    const subIdName = choice.appliesToSubId && choice.appliesToSubId > 0
                        ? itemNameMap.get(choice.appliesToSubId)
                        : undefined;

                    choiceFeats.push({
                        ...feat,
                        source: 'choice' as const,
                        subIdName,
                        sourceFeature: sourceFeatureName || undefined,
                    });
                }
            }
        }

        return choiceFeats;
    }, [state.featureChoices, resolvedData.progressions, resolvedData.qualifiedFeats, itemNameMap]);

    // Combine all owned feats for display (selected, granted, and choice-based)
    const allOwnedFeats = useMemo(() => {
        return [...selectedFeats, ...grantedFeatDetails, ...choiceFeatDetails];
    }, [selectedFeats, grantedFeatDetails, choiceFeatDetails]);

    // Handle feat selection (regular feats)
    const handleFeatToggle = async (featId: number) => {
        const isSelected = state.selectedFeats.includes(featId);
        let newSelectedFeats: number[];

        if (isSelected) {
            // Remove the feat
            newSelectedFeats = state.selectedFeats.filter(id => id !== featId);

            // Remove feat sub-id if it exists
            const newFeatSubIds = { ...state.featSubIds };
            delete newFeatSubIds[featId];

            updateState({
                type: CharacterEditStateUpdateType.SET_SELECTED_FEATS,
                payload: { selectedFeats: newSelectedFeats }
            });

            updateState({
                type: CharacterEditStateUpdateType.SET_FEAT_SUB_IDS,
                payload: { featSubIds: newFeatSubIds }
            });

            // Trigger feature resolution when feats change
            await triggerFeatureResolution();
        } else {
            // Add the feat (if we have available slots)
            if (selectedCount >= availableSlots) return;

            // Check if the feat requires a sub-id selection
            const feat = qualifiedFeats.find(f => f.id === featId);
            if (feat?.useSubId) {
                // Show modal for weapon selection
                setModalFeat(feat);
                setIsModalOpen(true);
            } else {
                // Add the feat directly
                newSelectedFeats = [...state.selectedFeats, featId];
                updateState({
                    type: CharacterEditStateUpdateType.SET_SELECTED_FEATS,
                    payload: { selectedFeats: newSelectedFeats }
                });
                // Trigger feature resolution when feats change
                await triggerFeatureResolution();
            }
        }
    };

    // Handle weapon selection from modal
    const handleWeaponSelection = async (weaponId: number) => {
        if (!modalFeat) return;

        // Add the feat to selected feats
        const newSelectedFeats = state.selectedFeats.includes(modalFeat.id)
            ? state.selectedFeats
            : [...state.selectedFeats, modalFeat.id];

        // Store the weapon sub-id for this feat
        const newFeatSubIds = { ...state.featSubIds, [modalFeat.id]: weaponId };

        updateState({
            type: CharacterEditStateUpdateType.SET_SELECTED_FEATS,
            payload: { selectedFeats: newSelectedFeats }
        });

        updateState({
            type: CharacterEditStateUpdateType.SET_FEAT_SUB_IDS,
            payload: { featSubIds: newFeatSubIds }
        });

        // Close modal and reset
        setIsModalOpen(false);
        setModalFeat(null);

        // Trigger feature resolution when feats change
        await triggerFeatureResolution();
    };

    // Check if a feat can be selected
    const canSelectFeat = (feat: { id: number }) => {
        if (selectedCount >= availableSlots && !state.selectedFeats.includes(feat.id)) {
            return false;
        }
        return true;
    };


    // No longer need separate loading state since qualifiedFeats comes from resolvedData
    // The isLoading prop from TabComponentProps covers the overall resolution loading state

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Feats
                </h2>

                {/* Owned Feats (Selected + Granted) */}
                {allOwnedFeats.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Your Feats ({allOwnedFeats.length})
                        </h3>
                        <div className="space-y-3">
                            {allOwnedFeats.map((feat) => (
                                <div key={feat.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white">
                                                    {feat.name}
                                                    {(feat as { subIdName?: string }).subIdName && (
                                                        <span className="text-gray-600 dark:text-gray-400 font-normal">
                                                            {' '}({(feat as { subIdName: string }).subIdName})
                                                        </span>
                                                    )}
                                                </h4>
                                                {feat.source === 'granted' && (
                                                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                        Granted
                                                    </span>
                                                )}
                                                {feat.source === 'selected' && (
                                                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                        Selected
                                                    </span>
                                                )}
                                                {feat.source === 'choice' && (
                                                    <>
                                                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                                            Choice
                                                        </span>
                                                        {(feat as { sourceFeature?: string }).sourceFeature && (
                                                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                                                                {(feat as { sourceFeature: string }).sourceFeature}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
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
                                        {(feat.source === 'selected' || feat.source === 'choice') && (
                                            <button
                                                onClick={() => {
                                                    if (feat.source === 'selected') {
                                                        handleFeatToggle(feat.id);
                                                    } else {
                                                        // For choice-based feats, we'd need to remove from featureChoices
                                                        // This would require updating the choice system
                                                        // For now, just show a message or handle it via ChoicesTab
                                                        console.log('Choice-based feats should be removed via ChoicesTab');
                                                    }
                                                }}
                                                className="ml-3 text-red-500 hover:text-red-700 text-sm font-medium"
                                                disabled={feat.source === 'choice'}
                                                title={feat.source === 'choice' ? 'Remove this feat via the Choices tab' : 'Remove feat'}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Available Feats List */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Available Feats ({availableSlots - selectedCount} remaining)
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {filteredFeats.length} of {qualifiedFeats.length} feats
                        </div>
                    </div>

                    {/* Search input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search feats..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing feats you qualify for based on your character's abilities, skills, and level.
                        {isLoading && (
                            <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                                (Loading character data...)
                            </span>
                        )}
                    </p>
                </div>

                {/* Feats List */}
                <div className="max-h-96 overflow-y-auto">
                    {filteredFeats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            {searchTerm ? 'No feats match your search.' : 'No feats available.'}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredFeats.map((feat) => {
                                const isSelected = state.selectedFeats.includes(feat.id);
                                const canSelect = canSelectFeat(feat);

                                return (
                                    <div
                                        key={feat.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!canSelect ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        {feat.name}
                                                    </h4>
                                                    {feat.repeatable && (
                                                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                            Repeatable
                                                        </span>
                                                    )}
                                                </div>
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

                                            <div className="ml-4 flex-shrink-0">
                                                <button
                                                    onClick={() => handleFeatToggle(feat.id)}
                                                    disabled={!canSelect}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isSelected
                                                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                                                        : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                                                        } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''
                                                        }`}
                                                >
                                                    {isSelected ? 'Remove' : 'Select'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Feat Sub-ID Selection Modal */}
            <FeatSubIdSelectionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setModalFeat(null);
                }}
                onConfirm={(weaponId: number) => handleWeaponSelection(weaponId)}
                feat={modalFeat}
                resolvedProgressions={resolvedData.progressions}
            />
        </div>
    );
}
