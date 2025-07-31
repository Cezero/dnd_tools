import React, { useState, useEffect } from 'react';
import { useAuthAuto } from '@/components/auth';
import {
    UserIcon, ShieldCheckIcon, AcademicCapIcon, SparklesIcon, DocumentTextIcon, BriefcaseIcon
} from '@heroicons/react/24/outline';
import { RaceService } from '@/features/race/RaceService';
import {
    AbilitiesRaceTab, ClassTab, SkillsTab, FeatsTab, DescriptionTab, EquipmentTab
} from './tabs'; // Using barrel export
import type { CharacterData } from './types';
import type { RaceInQueryResponse, GetRaceResponse, GetClassResponse } from '@shared/schema';

interface TabConfig {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType<{
        character: CharacterData;
        onUpdate: (data: Partial<CharacterData>) => void;
        races?: RaceInQueryResponse[];
        selectedRaceDetails?: GetRaceResponse | null;
        selectedClassDetails?: GetClassResponse | null;
        onClassDetailsChange?: (classDetails: GetClassResponse | null) => void;
    }>;
}

export function CharacterEdit(): React.JSX.Element {
    const { user } = useAuthAuto();
    const [activeTab, setActiveTab] = useState<string>('abilities-race');

    // Race data state
    const [races, setRaces] = useState<RaceInQueryResponse[]>([]);
    const [selectedRaceDetails, setSelectedRaceDetails] = useState<GetRaceResponse | null>(null);
    const [isLoadingRaces, setIsLoadingRaces] = useState(true);

    // Class data state
    const [selectedClassDetails, setSelectedClassDetails] = useState<GetClassResponse | null>(null);

    const [character, setCharacter] = useState<CharacterData>({
        name: '', level: 1, experience: 0, alignment: null, race: null,
        abilities: {},
        class: null, classFeatures: [], hitPoints: 0, armorClass: 10, skills: {}, skillPoints: 0,
        feats: [], bonusFeats: [], description: '', background: '', appearance: '', equipment: [],
        money: { 1: 0, 2: 0, 3: 0, 4: 0 },
        languages: [], bonusLanguages: []
    });

    // Fetch races on component mount
    useEffect(() => {
        const fetchRaces = async () => {
            try {
                setIsLoadingRaces(true);
                const response = await RaceService.getRaces({});
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
            if (!character.race) {
                setSelectedRaceDetails(null);
                return;
            }

            try {
                const raceDetails = await RaceService.getRaceById(undefined, { id: character.race });
                setSelectedRaceDetails(raceDetails);

                // Update languages based on race details
                if (raceDetails) {
                    const automaticLanguages = raceDetails.languages
                        ?.filter(lang => lang.isAutomatic)
                        .map(lang => lang.languageId) || [];

                    const bonusLanguages = raceDetails.languages
                        ?.filter(lang => !lang.isAutomatic)
                        .map(lang => lang.languageId) || [];

                    setCharacter(prev => ({
                        ...prev,
                        languages: automaticLanguages,
                        bonusLanguages: bonusLanguages
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch race details:', error);
                setSelectedRaceDetails(null);
            }
        };

        fetchRaceDetails();
    }, [character.race]);

    const handleUpdate = (data: Partial<CharacterData>) => {
        setCharacter(prev => ({ ...prev, ...data }));
    };

    const handleClassDetailsChange = (classDetails: GetClassResponse | null) => {
        setSelectedClassDetails(classDetails);
    };

    const tabs: TabConfig[] = [
        { id: 'abilities-race', label: 'Abilities & Race', icon: UserIcon, component: AbilitiesRaceTab },
        { id: 'class', label: 'Class', icon: AcademicCapIcon, component: ClassTab },
        { id: 'skills', label: 'Skills', icon: ShieldCheckIcon, component: SkillsTab },
        { id: 'feats', label: 'Feats', icon: SparklesIcon, component: FeatsTab },
        { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab },
        { id: 'equipment', label: 'Equipment', icon: BriefcaseIcon, component: EquipmentTab }
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
                        />
                    )}
                </div>
            </div>
        </div>
    );
} 
