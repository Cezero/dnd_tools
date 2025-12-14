import {
    UserIcon, ShieldCheckIcon, AcademicCapIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon, CogIcon, ListBulletIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@base-ui-components/react/dialog';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { useLogPanel } from '@/components/log-panel';
import { useToast } from '@/components/toast/useToast';
import { useCharacterEditState } from '@/features/character';
import { CharacterApi } from '@/features/character/CharacterApi';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { RaceQueryHooks } from '@/services/query/RaceQueryHooks';
import type { Race, DnDClass, CharacterWithAllDetailsResponse, SkillRank } from '@shared/schema';
import { EditionId } from '@shared/static-data';

import { generateCharacterPdf } from './characterPdfService';
import { AbilitiesRaceTab, ChoicesTab, ClassTab, ConfigurationTab, DescriptionTab, EquipmentTab, FeatsTab, SkillsTab } from './tabs';
import type { TabConfig, TabComponentProps } from './types';
import { useFeatureProgressionPool } from './useFeatureProgressionPool';

export function CharacterEdit(): React.JSX.Element {
    const { user, isLoading: isAuthLoading } = useAuthAuto();
    const { state, updateState } = useCharacterEditState();
    const { isResolving, resolutionError, resolvedData, addRace, addClass, addSecondaryClass, triggerResolution, handleChoiceSelection } = useFeatureProgressionPool();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const toastManager = useToast();
    const logPanel = useLogPanel();
    const [activeTab, setActiveTab] = useState<string>('abilities-race');
    const [isLoadingCharacter, setIsLoadingCharacter] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [nameModalOpen, setNameModalOpen] = useState(false);
    const [nameModalValue, setNameModalValue] = useState('');

    // Use imperative API for data fetching
    const [racesData, setRacesData] = useState<unknown[]>([]);
    const [isLoadingRaces, setIsLoadingRaces] = useState(false);

    // Race data state
    const [_selectedRaceDetails, setSelectedRaceDetails] = useState<(Race & { id: number }) | null>(null);

    // Class data state
    const [_selectedClassDetails, setSelectedClassDetails] = useState<(DnDClass & { id: number }) | null>(null);
    const [_selectedSecondaryClassDetails, setSelectedSecondaryClassDetails] = useState<(DnDClass & { id: number }) | null>(null);

    // Initialize from user preferences
    useEffect(() => {
        if (!isAuthLoading && user) {
            const userPreferredEdition = (user as { preferredEditionId?: number | null })?.preferredEditionId;
            if (userPreferredEdition) {
                updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId: userPreferredEdition } });
            } else {
                updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId: EditionId.DND_3x } });
            }
        }
    }, [user, isAuthLoading, updateState]);

    // Use imperative API for race, class, and secondary class details
    const [raceDetailsData, setRaceDetailsData] = useState<unknown | null>(null);
    const [classDetailsData, setClassDetailsData] = useState<unknown | null>(null);
    const [secondaryClassDetailsData, setSecondaryClassDetailsData] = useState<unknown | null>(null);
    const [isLoadingRace, setIsLoadingRace] = useState(false);
    const [isLoadingClass, setIsLoadingClass] = useState(false);
    const [isLoadingSecondaryClass, setIsLoadingSecondaryClass] = useState(false);

    // TODO: Add domain queries back when we implement domain choice handling
    // For now, we'll skip domain queries to avoid the 404 errors

    // Fetch races data on component mount
    useEffect(() => {
        const fetchRaces = async () => {
            try {
                setIsLoadingRaces(true);
                const races = await RaceQueryHooks.getRaces({});
                setRacesData(races.results || []);
            } catch (error) {
                console.error('Failed to fetch races:', error);
            } finally {
                setIsLoadingRaces(false);
            }
        };
        fetchRaces();
    }, []);

    // Fetch race details when raceId changes
    useEffect(() => {
        const fetchRaceDetails = async () => {
            if (!state.raceId) {
                setRaceDetailsData(null);
                setSelectedRaceDetails(null);
                return;
            }

            try {
                setIsLoadingRace(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const raceData = await queryClient.fetchQuery({
                    queryKey: RaceQueryHooks.getRaceByIdQueryKey(state.raceId),
                    queryFn: () => RaceQueryHooks.getRaceByIdQueryFn({ pathParams: { id: state.raceId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setRaceDetailsData(raceData);
                setSelectedRaceDetails({ ...raceData, id: state.raceId });
            } catch (error) {
                console.error('Failed to fetch race details:', error);
                setRaceDetailsData(null);
                setSelectedRaceDetails(null);
            } finally {
                setIsLoadingRace(false);
            }
        };
        fetchRaceDetails();
    }, [state.raceId, queryClient]);

    // Fetch class details when classId changes
    useEffect(() => {
        const fetchClassDetails = async () => {
            if (!state.classId) {
                setClassDetailsData(null);
                setSelectedClassDetails(null);
                return;
            }

            try {
                setIsLoadingClass(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const classData = await queryClient.fetchQuery({
                    queryKey: ClassQueryHooks.getClassByIdQueryKey(state.classId),
                    queryFn: () => ClassQueryHooks.getClassByIdQueryFn({ pathParams: { id: state.classId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setClassDetailsData(classData);
                setSelectedClassDetails({ ...classData, id: state.classId });
            } catch (error) {
                console.error('Failed to fetch class details:', error);
                setClassDetailsData(null);
                setSelectedClassDetails(null);
            } finally {
                setIsLoadingClass(false);
            }
        };
        fetchClassDetails();
    }, [state.classId, queryClient]);

    // Fetch secondary class details when secondaryClassId changes
    useEffect(() => {
        const fetchSecondaryClassDetails = async () => {
            if (!state.secondaryClassId) {
                setSecondaryClassDetailsData(null);
                setSelectedSecondaryClassDetails(null);
                return;
            }

            try {
                setIsLoadingSecondaryClass(true);
                // Use queryClient.fetchQuery to leverage TanStack Query cache
                const classData = await queryClient.fetchQuery({
                    queryKey: ClassQueryHooks.getClassByIdQueryKey(state.secondaryClassId),
                    queryFn: () => ClassQueryHooks.getClassByIdQueryFn({ pathParams: { id: state.secondaryClassId } }),
                    staleTime: 5 * 60 * 1000, // 5 minutes
                    gcTime: 10 * 60 * 1000, // 10 minutes
                });
                setSecondaryClassDetailsData(classData);
                setSelectedSecondaryClassDetails({ ...classData, id: state.secondaryClassId });
            } catch (error) {
                console.error('Failed to fetch secondary class details:', error);
                setSecondaryClassDetailsData(null);
                setSelectedSecondaryClassDetails(null);
            } finally {
                setIsLoadingSecondaryClass(false);
            }
        };
        fetchSecondaryClassDetails();
    }, [state.secondaryClassId, queryClient]);

    // Manage race progressions in the pool
    useEffect(() => {
        if (raceDetailsData && state.raceId) {
            console.log(`Adding race ${state.raceId} to pool`);
            addRace(state.raceId, raceDetailsData.features || []);
        }
    }, [raceDetailsData, state.raceId, addRace]);

    // Manage class progressions in the pool
    useEffect(() => {
        if (classDetailsData && state.classId) {
            console.log(`Adding class ${state.classId} to pool`);
            addClass(state.classId, classDetailsData.features || []);
        }
    }, [classDetailsData, state.classId, addClass]);

    // Manage secondary class progressions in the pool
    useEffect(() => {
        if (secondaryClassDetailsData && state.secondaryClassId) {
            console.log(`Adding secondary class ${state.secondaryClassId} to pool`);
            addSecondaryClass(state.secondaryClassId, secondaryClassDetailsData.features || []);
        }
    }, [secondaryClassDetailsData, state.secondaryClassId, addSecondaryClass]);

    // TODO: Add domain management back when we implement domain choice handling

    // Load character when ID is present in URL
    useEffect(() => {
        const loadCharacter = async () => {
            if (!id || !user) return;

            const characterId = parseInt(id, 10);
            if (isNaN(characterId)) return;

            try {
                setIsLoadingCharacter(true);
                const character = await CharacterApi.getCharacterWithAllDetails(undefined, { id: characterId }) as CharacterWithAllDetailsResponse;

                // Find advancement for current level (default level 1)
                const currentLevel = 1; // Default to level 1 for now
                const advancement = character.advancements.find(adv => adv.level === currentLevel);

                // Update character basic info
                updateState({ type: CharacterEditStateUpdateType.SET_CHARACTER_ID, payload: { characterId: character.id } });
                updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: character.name } });
                updateState({ type: CharacterEditStateUpdateType.SET_RACE, payload: { raceId: character.raceId } });
                updateState({ type: CharacterEditStateUpdateType.SET_ALIGNMENT, payload: { alignmentId: character.alignmentId } });
                updateState({ type: CharacterEditStateUpdateType.SET_AGE, payload: { age: character.age } });
                updateState({ type: CharacterEditStateUpdateType.SET_HEIGHT, payload: { height: character.height } });
                updateState({ type: CharacterEditStateUpdateType.SET_WEIGHT, payload: { weight: character.weight?.toString() || null } });
                updateState({ type: CharacterEditStateUpdateType.SET_EYES, payload: { eyes: character.eyes } });
                updateState({ type: CharacterEditStateUpdateType.SET_HAIR, payload: { hair: character.hair } });
                updateState({ type: CharacterEditStateUpdateType.SET_GENDER, payload: { gender: character.gender } });
                updateState({ type: CharacterEditStateUpdateType.SET_NOTES, payload: { notes: character.notes } });

                // Update configuration
                if (character.editionId) {
                    updateState({ type: CharacterEditStateUpdateType.SET_EDITION, payload: { editionId: character.editionId } });
                }
                updateState({ type: CharacterEditStateUpdateType.SET_ALLOW_VARIANT_CLASSES, payload: { allowVariantClasses: character.allowVariantClasses } });
                updateState({ type: CharacterEditStateUpdateType.SET_IS_GESTALT, payload: { isGestalt: character.isGestalt } });
                updateState({ type: CharacterEditStateUpdateType.SET_IGNORE_LEVEL_ADJUSTMENT, payload: { ignoreLevelAdjustment: character.ignoreLevelAdjustment } });

                // Load ability scores
                updateState({ type: CharacterEditStateUpdateType.SET_ABILITY_SCORES, payload: { abilityScores: character.abilityScores } });

                // Load advancement data if it exists
                if (advancement) {
                    updateState({ type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID, payload: { currentAdvancementId: advancement.id } });
                    updateState({ type: CharacterEditStateUpdateType.SET_CLASS, payload: { classId: advancement.classId } });
                    if (advancement.secondaryClassId) {
                        updateState({ type: CharacterEditStateUpdateType.SET_SECONDARY_CLASS, payload: { secondaryClassId: advancement.secondaryClassId } });
                    }

                    // Load skill ranks
                    const skillRanks: SkillRank[] = advancement.skills.map(skill => ({
                        skillId: skill.skillId,
                        skillSubId: skill.skillSubId,
                        customSubtype: skill.customSubtype || null,
                        pointsSpent: skill.pointsSpent
                    }));
                    updateState({ type: CharacterEditStateUpdateType.SET_SKILL_RANKS, payload: { skillRanks } });

                    // Load feat selections
                    const selectedFeats = advancement.feats.map(feat => feat.featId);
                    updateState({ type: CharacterEditStateUpdateType.SET_SELECTED_FEATS, payload: { selectedFeats } });

                    // Load feature choices
                    updateState({ type: CharacterEditStateUpdateType.SET_FEATURE_CHOICES, payload: { featureChoices: advancement.featureChoices } });
                } else {
                    // No advancement for current level
                    updateState({ type: CharacterEditStateUpdateType.SET_CURRENT_ADVANCEMENT_ID, payload: { currentAdvancementId: null } });
                }
            } catch (error) {
                console.error('Failed to load character:', error);
            } finally {
                setIsLoadingCharacter(false);
            }
        };

        loadCharacter();
    }, [id, user, state.level, updateState]);

    const _handleClassDetailsChange = (classDetails: (DnDClass & { id: number }) | null) => {
        setSelectedClassDetails(classDetails);
    };

    const _handleSecondaryClassDetailsChange = (classDetails: (DnDClass & { id: number }) | null) => {
        setSelectedSecondaryClassDetails(classDetails);
    };

    // Save handler
    const handleSave = async (nameToUse?: string): Promise<void> => {
        const characterName = nameToUse || state.name.trim();
        
        if (!characterName) {
            setNameModalOpen(true);
            setNameModalValue('');
            return;
        }

        try {
            setIsSaving(true);

            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            // Validate required fields and show user-friendly errors
            const missingFields: string[] = [];
            if (!state.raceId) {
                missingFields.push('Race');
            }
            if (!state.editionId) {
                missingFields.push('Edition');
            }

            if (missingFields.length > 0) {
                const errorMessage = `Please complete the following required fields before saving: ${missingFields.join(', ')}`;
                toastManager?.add({
                    title: 'Missing Required Fields',
                    description: errorMessage,
                    type: 'error',
                });
                logPanel.addLogEntry({
                    message: errorMessage,
                    type: 'error',
                    source: 'character-editor',
                });
                setIsSaving(false);
                return; // Return early to prevent duplicate error toast and API call
            }

            // Build the complete character object with nested data
            const saveData = {
                userId: user.id,
                name: characterName,
                raceId: state.raceId,
                alignmentId: state.alignmentId ?? null,
                deityId: null,
                age: state.age,
                height: state.height,
                weight: state.weight ? (() => {
                    const parsed = parseInt(state.weight, 10);
                    return isNaN(parsed) ? null : parsed;
                })() : null,
                eyes: state.eyes,
                hair: state.hair,
                gender: state.gender,
                notes: state.notes,
                editionId: state.editionId,
                allowVariantClasses: state.allowVariantClasses,
                isGestalt: state.isGestalt,
                ignoreLevelAdjustment: state.ignoreLevelAdjustment,
                // Include ability scores if any exist
                abilityScores: state.abilityScores.length > 0 ? state.abilityScores.map(score => ({
                    abilityId: score.abilityId,
                    value: score.value,
                })) : undefined,
                // Include advancement if class is selected
                advancement: state.classId ? {
                    level: state.level,
                    classId: state.classId,
                    secondaryClassId: state.secondaryClassId ?? null,
                    hitPoints: 8, // Default hit points, can be calculated later
                    abilityId: null,
                    notes: null,
                    skills: state.skillRanks.map(skill => ({
                        skillId: skill.skillId,
                        skillSubId: skill.skillSubId ?? null,
                        pointsSpent: skill.pointsSpent,
                        customSubtype: skill.customSubtype ?? null,
                    })),
                    feats: state.selectedFeats.map(featId => ({
                        featId,
                    })),
                } : undefined,
            };

            // Use unified save endpoint - backend handles all orchestration
            let result;
            if (state.characterId) {
                result = await CharacterApi.saveCharacter(saveData, { id: state.characterId });
            } else {
                result = await CharacterApi.createCharacterWithSave(saveData);
                const characterId = parseInt(result.id, 10);
                updateState({ type: CharacterEditStateUpdateType.SET_CHARACTER_ID, payload: { characterId } });
                updateState({ type: CharacterEditStateUpdateType.SET_NAME, payload: { name: characterName } });
            }

            // Show success notifications
            const successMessage = `Character "${characterName}" saved successfully`;
            toastManager?.add({
                title: 'Character Saved',
                description: successMessage,
                type: 'success',
            });
            logPanel.addLogEntry({
                message: successMessage,
                type: 'success',
                source: 'character-editor',
            });

            // Invalidate queries
            await queryClient.invalidateQueries({ queryKey: ['characters'] });
            if (state.characterId) {
                await queryClient.invalidateQueries({ queryKey: ['characters', 'item', state.characterId] });
            }
        } catch (error) {
            console.error('Failed to save character:', error);
            let errorMessage = 'Failed to save character';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            toastManager?.add({
                title: 'Save Failed',
                description: errorMessage,
                type: 'error',
            });
            logPanel.addLogEntry({
                message: `Failed to save character: ${errorMessage}`,
                type: 'error',
                source: 'character-editor',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleNameModalSave = (): void => {
        const trimmedName = nameModalValue.trim();
        if (trimmedName) {
            setNameModalOpen(false);
            handleSave(trimmedName);
        }
    };

    // Export handler
    const handleExport = async (): Promise<void> => {
        if (!state.characterId) {
            toastManager?.add({
                title: 'Export Failed',
                description: 'Please save the character before exporting',
                type: 'error',
            });
            return;
        }

        try {
            setIsExporting(true);

            // Fetch character with all details
            const character = await CharacterApi.getCharacterWithAllDetails(undefined, { id: state.characterId }) as CharacterWithAllDetailsResponse;

            if (!character) {
                throw new Error('Character not found');
            }

            // Build class details map
            const classDetailsMap = new Map<number, DnDClass>();
            
            // Get unique class IDs from advancements
            const classIds = new Set<number>();
            for (const advancement of character.advancements) {
                classIds.add(advancement.classId);
                if (advancement.secondaryClassId) {
                    classIds.add(advancement.secondaryClassId);
                }
            }

            // Fetch class details
            for (const classId of classIds) {
                try {
                    const classData = await ClassQueryHooks.getClassById(classId);
                    classDetailsMap.set(classId, classData);
                } catch (error) {
                    console.error(`Failed to fetch class ${classId}:`, error);
                }
            }

            // Generate PDF
            await generateCharacterPdf(character, classDetailsMap);

            toastManager?.add({
                title: 'Export Successful',
                description: 'Character sheet PDF has been downloaded',
                type: 'success',
            });
        } catch (error) {
            console.error('Failed to export character:', error);
            let errorMessage = 'Failed to export character';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            toastManager?.add({
                title: 'Export Failed',
                description: errorMessage,
                type: 'error',
            });
        } finally {
            setIsExporting(false);
        }
    };

    // Tab configuration
    const tabs: TabConfig[] = [
        { id: 'abilities-race', label: 'Abilities & Race', icon: UserIcon, component: AbilitiesRaceTab },
        { id: 'class', label: 'Class', icon: AcademicCapIcon, component: ClassTab },
        { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
        { id: 'feats', label: 'Feats', icon: SparklesIcon, component: FeatsTab },
        { id: 'choices', label: 'Choices', icon: ListBulletIcon, component: ChoicesTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab },
        { id: 'equipment', label: 'Equipment', icon: BriefcaseIcon, component: EquipmentTab },
        { id: 'configuration', label: 'Configuration', icon: CogIcon, component: ConfigurationTab }
    ];

    const currentTab = tabs.find(tab => tab.id === activeTab);
    const CurrentTabComponent = currentTab?.component;

    if (!user || isLoadingCharacter) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Loading...
                    </h1>
                </div>
            </div>
        );
    }

    // Create tab props for the new centralized system
    const tabProps: TabComponentProps = {
        state,
        updateState,
        resolvedData,
        isLoading: isResolving,
        triggerFeatureResolution: triggerResolution,
        handleChoiceSelection
    };

    return (
        <div className="max-w-7xl mx-auto py-6">
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8 px-6 items-center justify-between">
                        <div className="flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => handleExport()}
                                disabled={isExporting || isLoadingCharacter || !state.characterId}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={!state.characterId ? 'Save character before exporting' : 'Export character sheet as PDF'}
                            >
                                {isExporting ? 'Exporting...' : 'Export'}
                            </button>
                            <button
                                onClick={() => handleSave()}
                                disabled={isSaving || isLoadingCharacter}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Feature Resolution Status */}
                {isResolving && (
                    <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            Resolving features...
                        </div>
                    </div>
                )}
                {resolutionError && (
                    <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                        <div className="text-sm text-red-700 dark:text-red-300">
                            Resolution error: {resolutionError}
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800">
                    {CurrentTabComponent && (
                        React.createElement(CurrentTabComponent as React.ComponentType<TabComponentProps>, tabProps)
                    )}
                </div>
            </div>

            {/* Name Prompt Modal */}
            <Dialog.Root open={nameModalOpen} onOpenChange={setNameModalOpen}>
                <Dialog.Backdrop className="fixed inset-0 bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70" />
                <Dialog.Portal>
                    <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-4">
                                Enter Character Name
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                A character name is required to save.
                            </Dialog.Description>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleNameModalSave();
                                }}
                            >
                                <input
                                    type="text"
                                    value={nameModalValue}
                                    onChange={(e) => setNameModalValue(e.target.value)}
                                    placeholder="Character name"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                                <div className="mt-4 flex justify-end space-x-2">
                                    <Dialog.Close className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors">
                                        Cancel
                                    </Dialog.Close>
                                    <button
                                        type="submit"
                                        disabled={!nameModalValue.trim()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Dialog.Popup>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
