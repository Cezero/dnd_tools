import {
    UserIcon, ShieldCheckIcon, AcademicCapIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon, CogIcon, ListBulletIcon
} from '@heroicons/react/24/outline';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';

import { useAuthAuto } from '@/components/auth';
import { useCharacterEditState } from '@/features/character';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { ClassQueryHooks } from '@/services/query/ClassQueryHooks';
import { RaceQueryHooks } from '@/services/query/RaceQueryHooks';
import type { Race, DnDClass } from '@shared/schema';
import { EditionId } from '@shared/static-data';

import { AbilitiesRaceTab, ChoicesTab, ClassTab, ConfigurationTab, DescriptionTab, EquipmentTab, FeatsTab, SkillsTab } from './tabs';
import type { TabConfig, TabComponentProps } from './types';
import { useFeatureProgressionPool } from './useFeatureProgressionPool';

export function CharacterEdit(): React.JSX.Element {
    const { user, isLoading: isAuthLoading } = useAuthAuto();
    const { state, updateState } = useCharacterEditState();
    const { isResolving, resolutionError, resolvedData, addRace, addClass, addSecondaryClass, triggerResolution, handleChoiceSelection } = useFeatureProgressionPool();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>('abilities-race');

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

    const _handleClassDetailsChange = (classDetails: (DnDClass & { id: number }) | null) => {
        setSelectedClassDetails(classDetails);
    };

    const _handleSecondaryClassDetailsChange = (classDetails: (DnDClass & { id: number }) | null) => {
        setSelectedSecondaryClassDetails(classDetails);
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

    if (!user) {
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
                    <nav className="-mb-px flex space-x-8 px-6">
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
        </div>
    );
}
