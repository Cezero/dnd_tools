import React, { useEffect, useState, useMemo } from 'react';
import { z } from 'zod';

import { GenericList } from '@/components/generic-list';
import { FeatService } from '@/features/feat/FeatService';
import { meetsPrerequisites } from '@/lib';
import { SpecialFeatureId } from '@shared/static-data';
import type {
    FeatSchema,
    RaceInQueryResponse,
    GetRaceResponse,
    GetClassResponse,
    CharacterWithAllDetailsResponse,
    CharacterAdvancementWithDetailsResponse
} from '@shared/schema';

interface FeatsTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
    races?: RaceInQueryResponse[];
    selectedRaceDetails?: GetRaceResponse | null;
    selectedClassDetails?: GetClassResponse | null;
    targetAdvancement?: CharacterAdvancementWithDetailsResponse;
    onAdvancementUpdate?: (advancement: CharacterAdvancementWithDetailsResponse) => void;
}

export function FeatsTab({
    character,
    onUpdate,
    races = [],
    selectedRaceDetails,
    selectedClassDetails,
    targetAdvancement,
    onAdvancementUpdate
}: FeatsTabProps): React.JSX.Element {
    const [allFeats, setAllFeats] = useState<z.infer<typeof FeatSchema>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Use target advancement if provided, otherwise use the first advancement (for new characters)
    const advancement = targetAdvancement || character.advancements[0];
    const isNewCharacter = !targetAdvancement; // If no target advancement, we're creating a new character

    // Load all feats from backend
    useEffect(() => {
        const loadFeats = async () => {
            try {
                setIsLoading(true);
                const featResponse = await FeatService.featQuery({ queryType: 'all' });
                setAllFeats(featResponse.results);
            } catch (error) {
                console.error('Failed to load feats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFeats();
    }, []);

    // Get feats that the class grants as proficiencies (to exclude from selection)
    const getClassGrantedFeats = (): Set<number> => {
        if (!selectedClassDetails?.features) return new Set();

        const excludedFeatIds = new Set<number>();

        // Extract proficiencies from feature progressions
        selectedClassDetails.features
            .filter(prog => prog.featureId === SpecialFeatureId.ClassProficiency) // Use SpecialFeatureId instead of appliesToType
            .forEach(prog => {
                // If appliesTo is -1, the class grants proficiency with all items of that type
                if (prog.appliesTo === -1) {
                    excludedFeatIds.add(prog.featureId);
                }
                // If appliesTo is positive, the class only grants proficiency with specific items
                // So we don't exclude the feat (player might want to take it for other items)
            });

        return excludedFeatIds;
    };

    // Filter feats that character qualifies for and aren't already granted by class
    const availableFeats = useMemo(() => {
        const classGrantedFeats = getClassGrantedFeats();

        return allFeats.filter(feat =>
            meetsPrerequisites(feat, character, selectedClassDetails, selectedRaceDetails, { total: allFeats.length, results: allFeats }) &&
            !classGrantedFeats.has(feat.id)
        );
    }, [allFeats, character, selectedRaceDetails, selectedClassDetails]);

    // Calculate how many feats character can select for this advancement
    const getAvailableFeatSlots = (): number => {
        let slots = 0;

        if (isNewCharacter) {
            // Level 1 characters get 1 feat
            if (character.advancements.length >= 1) slots += 1;

            // Additional feats at levels 3, 6, 9, 12, 15, 18
            const bonusLevels = [3, 6, 9, 12, 15, 18];
            bonusLevels.forEach(level => {
                if (character.advancements.length >= level) slots += 1;
            });

            // Human bonus feat
            if (selectedRaceDetails?.name?.toLowerCase().includes('human')) {
                slots += 1;
            }
        } else {
            // For leveling up, check if this level grants a feat
            const level = advancement?.level || 1;

            // Standard feat levels: 1, 3, 6, 9, 12, 15, 18
            const featLevels = [1, 3, 6, 9, 12, 15, 18];
            if (featLevels.includes(level)) {
                slots += 1;
            }

            // Human bonus feat (every level)
            if (selectedRaceDetails?.name?.toLowerCase().includes('human')) {
                slots += 1;
            }

            // Fighter bonus feats (every even level)
            if (selectedClassDetails?.name?.toLowerCase().includes('fighter') && level % 2 === 0) {
                slots += 1;
            }
        }

        return slots;
    };

    const availableSlots = getAvailableFeatSlots();
    const selectedCount = advancement?.feats?.length || 0;

    // Get selected feat names from advancement
    const getSelectedFeatNames = (): string[] => {
        if (!advancement?.feats) return [];
        return advancement.feats.map(featEntry => {
            const feat = allFeats.find(f => f.id === featEntry.featId);
            return feat?.name || '';
        }).filter(Boolean);
    };

    // Handle feat selection changes
    const handleSelectedIdsChange = (selectedIds: (string | number)[]) => {
        // Limit selections to available slots
        if (selectedIds.length > availableSlots) {
            // Keep only the first N selections up to the limit
            selectedIds = selectedIds.slice(0, availableSlots);
        }

        // Convert selected IDs to feat entries
        const selectedFeatEntries = selectedIds.map(id => {
            const feat = allFeats.find(f => f.id === id);
            if (!feat || !advancement) return null;

            return {
                advancementId: advancement.id,
                featId: feat.id
            };
        }).filter(Boolean);

        // Update the advancement
        const updatedAdvancement = {
            ...advancement,
            feats: selectedFeatEntries
        };

        if (onAdvancementUpdate) {
            // For leveling up, use the callback
            onAdvancementUpdate(updatedAdvancement);
        } else {
            // For new character creation, update the character
            onUpdate({
                advancements: [
                    updatedAdvancement
                ]
            });
        }
    };

    // Get currently selected feat IDs
    const getSelectedFeatIds = (): (string | number)[] => {
        if (!advancement?.feats) return [];
        return advancement.feats.map(featEntry => featEntry.featId);
    };

    // GenericList columns configuration
    const columns = [
        {
            accessorKey: 'name',
            header: 'Feat Name',
            cell: ({ row }: any) => (
                <div className="font-medium text-gray-900 dark:text-white">
                    {row.original.name}
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }: any) => (
                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                    {row.original.description || 'No description available'}
                </div>
            ),
        },
        {
            accessorKey: 'benefit',
            header: 'Benefit',
            cell: ({ row }: any) => (
                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                    {row.original.benefit || 'No benefit description'}
                </div>
            ),
        },
    ];

    if (isLoading) {
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

    const selectedFeatNames = getSelectedFeatNames();

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Feats {!isNewCharacter && `(Level ${advancement?.level})`}
                </h2>

                {/* Selected Feats */}
                {selectedFeatNames.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Selected Feats ({selectedFeatNames.length})
                        </h3>
                        <div className="space-y-3">
                            {selectedFeatNames.map((featName, index) => {
                                const feat = allFeats.find(f => f.name === featName);
                                return (
                                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                    {featName}
                                                </h4>
                                                {feat?.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                        {feat.description}
                                                    </p>
                                                )}
                                                {feat?.benefit && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                                                        <span className="font-medium">Benefit:</span> {feat.benefit}
                                                    </p>
                                                )}
                                                {feat?.prerequisites && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="font-medium">Prerequisites:</span> {feat.prerequisites}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newFeatEntries = advancement?.feats?.filter(f => {
                                                        const feat = allFeats.find(feat => feat.id === f.featId);
                                                        return feat?.name !== featName;
                                                    }) || [];

                                                    const updatedAdvancement = {
                                                        ...advancement,
                                                        feats: newFeatEntries
                                                    };

                                                    if (onAdvancementUpdate) {
                                                        onAdvancementUpdate(updatedAdvancement);
                                                    } else {
                                                        onUpdate({
                                                            advancements: [
                                                                updatedAdvancement
                                                            ]
                                                        });
                                                    }
                                                }}
                                                className="ml-3 text-red-500 hover:text-red-700 text-sm font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Available Feats List */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Available Feats ({availableSlots - selectedCount} remaining)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Showing feats you qualify for based on your character's abilities, skills, and level.
                        {advancement?.classId && !selectedClassDetails && (
                            <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                                (Loading class details...)
                            </span>
                        )}
                    </p>
                </div>

                <GenericList
                    storageKey={`character-feats-${advancement?.level || 1}`}
                    columns={columns}
                    serviceFunction={async () => ({
                        results: availableFeats,
                        total: availableFeats.length
                    })}
                    itemDesc="feats"
                    initialLimit={20}
                    isOptionSelector={true}
                    selectedIds={getSelectedFeatIds()}
                    onSelectedIdsChange={handleSelectedIdsChange}
                />
            </div>
        </div>
    );
} 
