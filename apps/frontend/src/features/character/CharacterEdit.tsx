import {
    UserIcon, ShieldCheckIcon, AcademicCapIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon, CogIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';

import { useAuthAuto } from '@/components/auth';
import { RaceApi } from '@/features/race/RaceApi';
import type { Race, RaceSummary, DnDClass, CharacterWithAllDetailsResponse, CharacterAdvancementWithDetailsResponse } from '@shared/schema';

import {
    AbilitiesRaceTab, ClassTab, SkillsTab, FeatsTab, DescriptionTab, EquipmentTab, ConfigurationTab
} from './tabs'; // Using barrel export

interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<{
        character: CharacterWithAllDetailsResponse;
        onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
        races?: RaceSummary[];
        selectedRaceDetails?: Race | null;
        selectedClassDetails?: DnDClass | null;
        onClassDetailsChange?: (classDetails: DnDClass | null) => void;
        targetAdvancement?: CharacterAdvancementWithDetailsResponse;
        onAdvancementUpdate?: (advancement: CharacterAdvancementWithDetailsResponse) => void;
    }>;
}

export function CharacterEdit(): React.JSX.Element {
    const { user } = useAuthAuto();
    const [activeTab, setActiveTab] = useState<string>('abilities-race');

    // Race data state
    const [races, setRaces] = useState<RaceSummary[]>([]);
    const [selectedRaceDetails, setSelectedRaceDetails] = useState<Race | null>(null);
    const [_isLoadingRaces, setIsLoadingRaces] = useState(true);

    // Class data state
    const [selectedClassDetails, setSelectedClassDetails] = useState<DnDClass | null>(null);

    const [character, setCharacter] = useState<CharacterWithAllDetailsResponse>({
        id: 0,
        userId: 0,
        name: '',
        raceId: 0,
        alignmentId: 0,
        age: null,
        height: null,
        weight: null,
        eyes: null,
        hair: null,
        gender: null,
        notes: null,
        xp: 0,
        race: {
            id: 0,
            name: ''
        },
        abilityScores: [],
        advancements: [
            {
                id: 0,
                characterId: 0,
                level: 1,
                version: 1,
                classId: 0,
                secondaryClassId: null,
                hitPoints: 0,
                abilityId: null,
                notes: null,
                createdAt: new Date(),
                skills: [],
                feats: [],
                spellsKnown: [],
                featureChoices: []
            }
        ],
        preparedSpells: [],
        // NEW: Character configuration fields
        editionId: null,
        allowVariantClasses: false,
        isGestalt: false,
        ignoreLevelAdjustment: false,
        disallowedSources: []
    });

    // Fetch races on component mount
    useEffect(() => {
        const fetchRaces = async () => {
            try {
                setIsLoadingRaces(true);
                const response = await RaceApi.getRaces({});
                setRaces(response.results);
            } catch (error) {
                console.error('Failed to fetch races:', error);
            } finally {
                setIsLoadingRaces(false);
            }
        };

        fetchRaces();
    }, []);

    // Fetch race details when race is selected
    useEffect(() => {
        const fetchRaceDetails = async () => {
            if (!character.raceId) {
                setSelectedRaceDetails(null);
                return;
            }

            try {
                const raceDetails = await RaceApi.getRaceById(undefined, { id: character.raceId });
                setSelectedRaceDetails(raceDetails);

                // Update race name in character
                if (raceDetails) {
                    setCharacter(prev => ({
                        ...prev,
                        race: {
                            id: character.raceId,
                            name: raceDetails.name
                        }
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch race details:', error);
                setSelectedRaceDetails(null);
            }
        };

        fetchRaceDetails();
    }, [character.raceId]);

    const handleUpdate = (data: Partial<CharacterWithAllDetailsResponse>) => {
        setCharacter(prev => ({ ...prev, ...data }));
    };

    const handleClassDetailsChange = (classDetails: DnDClass | null) => {
        setSelectedClassDetails(classDetails);
    };

    const tabs: TabConfig[] = [
        { id: 'abilities-race', label: 'Abilities & Race', icon: UserIcon, component: AbilitiesRaceTab },
        { id: 'class', label: 'Class', icon: AcademicCapIcon, component: ClassTab },
        { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
        { id: 'feats', label: 'Feats', icon: SparklesIcon, component: FeatsTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab },
        { id: 'equipment', label: 'Equipment', icon: BriefcaseIcon, component: EquipmentTab },
        { id: 'configuration', label: 'Configuration', icon: CogIcon, component: ConfigurationTab }
    ];

    const CurrentTabComponent = tabs.find(tab => tab.id === activeTab)?.component;

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

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800">
                    {CurrentTabComponent && (
                        <CurrentTabComponent
                            character={character}
                            onUpdate={handleUpdate}
                            races={races}
                            selectedRaceDetails={selectedRaceDetails}
                            selectedClassDetails={selectedClassDetails}
                            onClassDetailsChange={handleClassDetailsChange}
                            targetAdvancement={character.advancements[0]}
                            onAdvancementUpdate={(updatedAdvancement) => {
                                handleUpdate({
                                    advancements: [updatedAdvancement]
                                });
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
} 
