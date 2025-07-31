import React, { useEffect, useState, useMemo } from 'react';
import { GenericList } from '@/components/generic-list';
import { FeatService } from '@/features/feat/FeatService';
import { getBABProgression, ProgressionType } from '@shared/static-data';
import { FeatPrerequisiteType } from '@shared/static-data';
import type { RaceInQueryResponse, GetRaceResponse, FeatInQueryResponse, GetClassResponse } from '@shared/schema';
import type { CharacterData } from '../types';

interface FeatsTabProps {
    character: CharacterData;
    onUpdate: (data: Partial<CharacterData>) => void;
    races?: RaceInQueryResponse[];
    selectedRaceDetails?: GetRaceResponse | null;
    selectedClassDetails?: GetClassResponse | null;
}

interface FeatWithPrerequisites extends FeatInQueryResponse {
    prereqs: Array<{
        typeId: number;
        referenceId: number | null;
        amount: number | null;
        index: number;
    }>;
    benefits: Array<{
        typeId: number;
        referenceId: number | null;
        amount: number | null;
        index: number;
    }>;
}

export function FeatsTab({
    character,
    onUpdate,
    races = [],
    selectedRaceDetails,
    selectedClassDetails
}: FeatsTabProps): React.JSX.Element {
    const [allFeats, setAllFeats] = useState<FeatWithPrerequisites[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load all feats from backend
    useEffect(() => {
        const loadFeats = async () => {
            try {
                setIsLoading(true);
                const featResponse = await FeatService.featQuery({ queryType: 'all' });
                setAllFeats(featResponse.results as FeatWithPrerequisites[]);
            } catch (error) {
                console.error('Failed to load feats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFeats();
    }, []);

    // Calculate character's BAB based on class and level
    const getCharacterBAB = (): number => {
        if (!character.class || !character.level || !selectedClassDetails) return 0;

        // Use actual class BAB progression
        const babProgression = selectedClassDetails.babProgression;
        const bab = getBABProgression(character.level, babProgression);

        // Extract the first BAB value (e.g., "+6" -> 6)
        const babMatch = bab.match(/\+(\d+)/);
        return babMatch ? parseInt(babMatch[1]) : 0;
    };

    // Get ability score with racial modifiers
    const getAbilityScore = (abilityId: number): number => {
        const baseScore = character.abilities[abilityId] || 0;
        if (!selectedRaceDetails?.abilityAdjustments) return baseScore;

        const racialMod = selectedRaceDetails.abilityAdjustments.find(adj => adj.abilityId === abilityId);
        return baseScore + (racialMod?.value || 0);
    };

    // Get skill ranks
    const getSkillRanks = (skillId: number): number => {
        return character.skills[skillId] || 0;
    };

    // Check if character meets feat prerequisites
    const meetsPrerequisites = (feat: FeatWithPrerequisites): boolean => {
        if (!feat.prereqs || feat.prereqs.length === 0) return true;

        return feat.prereqs.every(prereq => {
            switch (prereq.typeId) {
                case FeatPrerequisiteType.ABILITY:
                    if (!prereq.referenceId || !prereq.amount) return true;
                    return getAbilityScore(prereq.referenceId) >= prereq.amount;

                case FeatPrerequisiteType.SKILL:
                    if (!prereq.referenceId || !prereq.amount) return true;
                    return getSkillRanks(prereq.referenceId) >= prereq.amount;

                case FeatPrerequisiteType.FEAT:
                    if (!prereq.referenceId) return true;
                    // Check if character has the required feat
                    const requiredFeat = allFeats.find(f => f.id === prereq.referenceId);
                    if (!requiredFeat) return false;
                    return character.feats.includes(requiredFeat.name);

                case FeatPrerequisiteType.BAB:
                    if (!prereq.amount) return true;
                    return getCharacterBAB() >= prereq.amount;

                case FeatPrerequisiteType.SPELLCASTING:
                    // Check if character's class can cast spells
                    if (!selectedClassDetails) return false;
                    return selectedClassDetails.canCastSpells || selectedClassDetails.spellProgression !== null;

                case FeatPrerequisiteType.SPECIAL:
                    // Special prerequisites would need custom logic
                    return true;

                default:
                    return true;
            }
        });
    };

    // Get feats that the class grants as proficiencies (to exclude from selection)
    const getClassGrantedFeats = (): Set<number> => {
        if (!selectedClassDetails?.proficiencies) return new Set();

        const excludedFeatIds = new Set<number>();

        selectedClassDetails.proficiencies.forEach(prof => {
            // If itemId is -1, the class grants proficiency with all items of that type
            // So exclude this feat entirely
            if (prof.itemId === -1) {
                excludedFeatIds.add(prof.featId);
            }
            // If itemId is positive, the class only grants proficiency with specific items
            // So we don't exclude the feat (player might want to take it for other items)
        });

        return excludedFeatIds;
    };

    // Filter feats that character qualifies for and aren't already granted by class
    const availableFeats = useMemo(() => {
        const classGrantedFeats = getClassGrantedFeats();

        return allFeats.filter(feat =>
            meetsPrerequisites(feat) &&
            !classGrantedFeats.has(feat.id)
        );
    }, [allFeats, character, selectedRaceDetails, selectedClassDetails]);

    // Calculate how many feats character can select
    const getAvailableFeatSlots = (): number => {
        let slots = 0;

        // Level 1 characters get 1 feat
        if (character.level >= 1) slots += 1;

        // Additional feats at levels 3, 6, 9, 12, 15, 18
        const bonusLevels = [3, 6, 9, 12, 15, 18];
        bonusLevels.forEach(level => {
            if (character.level >= level) slots += 1;
        });

        // Human bonus feat
        if (selectedRaceDetails?.name?.toLowerCase().includes('human')) {
            slots += 1;
        }

        return slots;
    };

    const availableSlots = getAvailableFeatSlots();
    const selectedCount = character.feats.length;
    const canSelectMore = selectedCount < availableSlots;

    // Handle feat selection changes
    const handleSelectedIdsChange = (selectedIds: (string | number)[]) => {
        // Limit selections to available slots
        if (selectedIds.length > availableSlots) {
            // Keep only the first N selections up to the limit
            selectedIds = selectedIds.slice(0, availableSlots);
        }

        const selectedFeatNames = selectedIds.map(id => {
            const feat = allFeats.find(f => f.id === id);
            return feat?.name || '';
        }).filter(Boolean);

        onUpdate({ feats: selectedFeatNames });
    };

    // Get currently selected feat IDs
    const getSelectedFeatIds = (): (string | number)[] => {
        return allFeats
            .filter(feat => character.feats.includes(feat.name))
            .map(feat => feat.id);
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

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Feats
                </h2>

                {/* Selected Feats */}
                {character.feats.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Selected Feats ({character.feats.length})
                        </h3>
                        <div className="space-y-3">
                            {character.feats.map((featName, index) => {
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
                                                    const newFeats = character.feats.filter(f => f !== featName);
                                                    onUpdate({ feats: newFeats });
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



                {/* Bonus Feats */}
                {character.bonusFeats.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Bonus Feats (Class)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {character.bonusFeats.map((featName, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <span className="text-sm text-blue-700 dark:text-blue-300">{featName}</span>
                                    <span className="text-xs text-blue-500 dark:text-blue-400">Class Bonus</span>
                                </div>
                            ))}
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
                        {character.class && !selectedClassDetails && (
                            <span className="text-yellow-600 dark:text-yellow-400 ml-2">
                                (Loading class details...)
                            </span>
                        )}
                    </p>
                </div>

                <GenericList
                    storageKey="character-feats"
                    columns={columns}
                    serviceFunction={async () => ({
                        results: availableFeats,
                        total: availableFeats.length
                    })}
                    itemDesc="feats"
                    initialLimit={20}
                    isOptionSelector={true}
                    selectedIds={allFeats
                        .filter(feat => character.feats.includes(feat.name))
                        .map(feat => feat.id)}
                    onSelectedIdsChange={handleSelectedIdsChange}
                />
            </div>
        </div>
    );
} 
