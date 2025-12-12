import React, { useMemo, useState, useEffect } from 'react';

import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { meetsPrerequisites } from '@/lib/characterUtils';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { FeatQueryHooks } from '@/services/query/FeatQueryHooks';
import { RaceQueryHooks } from '@/services/query/RaceQueryHooks';
import type { DnDClass, Race, Feat } from '@shared/schema';

// Custom hook that filters feats based on character qualifications
const useFilteredFeats = (state: TabComponentProps['state'], resolvedData: TabComponentProps['resolvedData']) => {
    const { data: featResponse, isLoading } = FeatQueryHooks.useFeatQuery({
        queryType: 'all'
    });

    // Fetch class and race details for prerequisite checking
    const [classDetails, setClassDetails] = useState<{ primary?: DnDClass; secondary?: DnDClass }>({});
    const [raceDetails, setRaceDetails] = useState<Race | null>(null);

    // Fetch class details when class IDs change
    useEffect(() => {
        const fetchClassDetails = async () => {
            const newClassDetails: { primary?: DnDClass; secondary?: DnDClass } = {};

            if (state.classId) {
                try {
                    const primaryClass = await ClassQueryHooks.getClassById(state.classId);
                    newClassDetails.primary = primaryClass;
                } catch (error) {
                    console.error('Failed to fetch primary class details:', error);
                }
            }

            if (state.isGestalt && state.secondaryClassId) {
                try {
                    const secondaryClass = await ClassQueryHooks.getClassById(state.secondaryClassId);
                    newClassDetails.secondary = secondaryClass;
                } catch (error) {
                    console.error('Failed to fetch secondary class details:', error);
                }
            }

            setClassDetails(newClassDetails);
        };

        fetchClassDetails();
    }, [state.classId, state.secondaryClassId, state.isGestalt]);

    // Fetch race details when raceId changes
    useEffect(() => {
        const fetchRaceDetails = async () => {
            let newRaceDetails: Race | null = null;
            if (state.raceId) {
                try {
                    const raceData = await RaceQueryHooks.getRaceById(state.raceId);
                    newRaceDetails = raceData;
                } catch (error) {
                    console.error('Failed to fetch race details:', error);
                }
            }
            setRaceDetails(newRaceDetails);
        };

        fetchRaceDetails();
    }, [state.raceId]);

    const allFeats = useMemo(() => featResponse?.results || [], [featResponse?.results]);

    const availableFeats = useMemo(() => {
        // Get granted feats from resolved data (includes both direct feats and proficiency feats)
        const grantedFeats = resolvedData.grantedFeats;
        const grantedFeatIds = grantedFeats.map(entity => entity.appliesToId).filter((id): id is number => id !== null && id !== undefined);

        // Combine user-selected feats with all granted feats
        const allOwnedFeats = new Set([...state.selectedFeats, ...grantedFeatIds]);

        return allFeats.filter(feat => {
            // Check if character already has this feat
            if (allOwnedFeats.has(feat.id)) {
                // If it's repeatable, check if they have the "all" version (appliesToSubId: -1)
                if (feat.repeatable === true) {
                    // Check if this feat was granted with appliesToSubId: -1 (all iterations)
                    const hasAllIterations = grantedFeats.some(entity =>
                        entity.appliesToId === feat.id && entity.appliesToSubId === -1
                    );

                    // If they have all iterations, filter it out
                    if (hasAllIterations) {
                        return false;
                    }

                    // Otherwise, allow it (they can take more iterations)
                    return true;
                }

                // Non-repeatable feat - filter it out
                return false;
            }

            // If feat has no prerequisites, it's available
            if (!feat.prereqs || feat.prereqs.length === 0) {
                return true;
            }

            // If we don't have sufficient character data to evaluate prerequisites, filter out the feat
            if (!state.abilityScores || state.abilityScores.length === 0 || !classDetails.primary) {
                return false;
            }

            // Create character object for prerequisite checking
            const character = {
                abilityScores: state.abilityScores,
                advancements: [{
                    skills: state.skillRanks?.map(sr => ({
                        skillId: sr.skillId,
                        pointsSpent: sr.pointsSpent
                    })) || [],
                    feats: Array.from(allOwnedFeats).map(featId => ({ featId }))
                }]
            };

            try {
                // Create a minimal character object that matches the expected interface
                const characterForPrereqs = {
                    ...character,
                    // Add required fields that meetsPrerequisites expects
                    id: 1, // Placeholder ID
                    name: 'Character',
                    level: state.level,
                    raceId: state.raceId,
                    alignmentId: 1, // Placeholder
                    allowVariantClasses: state.allowVariantClasses,
                    isGestalt: state.isGestalt,
                    ignoreLevelAdjustment: state.ignoreLevelAdjustment,
                    race: raceDetails ? { id: state.raceId || 0, name: raceDetails.name } : { id: 0, name: 'Unknown' }
                };

                return meetsPrerequisites(
                    feat as Feat,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    characterForPrereqs as any, // TODO: Fix this type when characterUtils is updated
                    classDetails.primary,
                    raceDetails,
                    { results: allFeats, total: allFeats.length }
                );
            } catch (error) {
                // If prerequisite checking fails, filter out the feat
                console.warn('Failed to check prerequisites for feat:', feat.name, error);
                return false;
            }
        });
    }, [allFeats, state.selectedFeats, state.abilityScores, state.skillRanks, state.allowVariantClasses, state.ignoreLevelAdjustment, state.isGestalt, state.level, state.raceId, classDetails, raceDetails, resolvedData.grantedFeats]);

    return {
        data: { results: availableFeats, total: availableFeats.length },
        isLoading
    };
};

export function FeatsTab({
    state,
    updateState,
    resolvedData,
    isLoading,
    triggerFeatureResolution
}: TabComponentProps): React.JSX.Element {
    const { data: featResponse, isLoading: isLoadingFeats } = useFilteredFeats(state, resolvedData);
    const [searchTerm, setSearchTerm] = useState('');

    const availableSlots = resolvedData.availableFeats;
    const selectedCount = state.selectedFeats.length;

    // Memoize availableFeats to prevent dependency issues
    const availableFeats = useMemo(() => featResponse?.results || [], [featResponse?.results]);

    // Filter feats based on search term
    const filteredFeats = useMemo(() => {
        if (!searchTerm.trim()) return availableFeats;

        const term = searchTerm.toLowerCase();
        return availableFeats.filter(feat =>
            feat.name.toLowerCase().includes(term) ||
            feat.description?.toLowerCase().includes(term) ||
            feat.benefit?.toLowerCase().includes(term)
        );
    }, [availableFeats, searchTerm]);

    // Get granted feats from resolved data
    const grantedFeats = useMemo(() => {
        return resolvedData.grantedFeats;
    }, [resolvedData.grantedFeats]);

    // Get selected feat details (user-selected feats)
    const selectedFeats = useMemo(() => {
        return state.selectedFeats.map(featId => {
            const feat = availableFeats.find(f => f.id === featId);
            return feat ? { ...feat, source: 'selected' as const } : null;
        }).filter(Boolean);
    }, [state.selectedFeats, availableFeats]);

    // Get granted feat details (from class/race features)
    const grantedFeatDetails = useMemo(() => {
        return grantedFeats.map(entity => {
            // Look in the unfiltered feat response since granted feats are filtered out of availableFeats
            const feat = featResponse?.results?.find(f => f.id === entity.appliesToId);
            return feat ? { ...feat, source: 'granted' as const } : null;
        }).filter(Boolean);
    }, [grantedFeats, featResponse?.results]);

    // Combine all owned feats for display
    const allOwnedFeats = useMemo(() => {
        return [...selectedFeats, ...grantedFeatDetails];
    }, [selectedFeats, grantedFeatDetails]);

    // Handle feat selection
    const handleFeatToggle = async (featId: number) => {
        const isSelected = state.selectedFeats.includes(featId);
        let newSelectedFeats: number[];

        if (isSelected) {
            // Remove the feat
            newSelectedFeats = state.selectedFeats.filter(id => id !== featId);
        } else {
            // Add the feat (if we have available slots)
            if (selectedCount >= availableSlots) return;
            newSelectedFeats = [...state.selectedFeats, featId];
        }

        updateState({
            type: CharacterEditStateUpdateType.SET_SELECTED_FEATS,
            payload: { selectedFeats: newSelectedFeats }
        });

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

    if (isLoadingFeats) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">
                        Loading feats and character data...
                    </div>
                </div>
            </div>
        );
    }

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
                                            </div>
                                            {feat.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                    {feat.description}
                                                </p>
                                            )}
                                            {feat.benefit && (
                                                <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                                                    <span className="font-medium">Benefit:</span> {feat.benefit}
                                                </p>
                                            )}
                                            {feat.prerequisites && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="font-medium">Prerequisites:</span> {feat.prerequisites}
                                                </p>
                                            )}
                                        </div>
                                        {feat.source === 'selected' && (
                                            <button
                                                onClick={() => handleFeatToggle(feat.id)}
                                                className="ml-3 text-red-500 hover:text-red-700 text-sm font-medium"
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
                            {filteredFeats.length} of {availableFeats.length} feats
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

                                                {feat.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                        {feat.description}
                                                    </p>
                                                )}

                                                {feat.benefit && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                                                        <span className="font-medium">Benefit:</span> {feat.benefit}
                                                    </p>
                                                )}

                                                {feat.prerequisites && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="font-medium">Prerequisites:</span> {feat.prerequisites}
                                                    </p>
                                                )}
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
        </div>
    );
}
