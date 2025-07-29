import React, { useState, useEffect } from 'react';
import { CustomSelect } from '@/components/forms/FormComponents';
import { useAuthAuto } from '@/components/auth';
import { ClassService } from '@/features/class/ClassService';
import {
    CLASS_MAP,
    CLASS_VISIBLE_LIST,
    getFeatCount,
    getAbilityScoreIncreases,
    GetBaseClassesByEdition
} from '@shared/static-data';
import type { Class } from '@shared/static-data';
import type { RaceInQueryResponse, GetRaceResponse, GetClassResponse } from '@shared/schema';
import type { CharacterData } from '../types';

interface ClassTabProps {
    character: CharacterData;
    onUpdate: (data: Partial<CharacterData>) => void;
    races?: RaceInQueryResponse[];
    selectedRaceDetails?: GetRaceResponse | null;
    selectedClassDetails?: GetClassResponse | null;
    onClassDetailsChange: (classDetails: GetClassResponse | null) => void;
}

export function ClassTab({
    character,
    onUpdate,
    races = [],
    selectedRaceDetails,
    selectedClassDetails,
    onClassDetailsChange
}: ClassTabProps): React.JSX.Element {
    const { user } = useAuthAuto();
    const [isLoadingClass, setIsLoadingClass] = useState(false);
    const handleClassChange = async (classId: number | null) => {
        if (classId === null) {
            onUpdate({
                class: null,
                classFeatures: [],
                bonusFeats: []
            });
            onClassDetailsChange(null);
            return;
        }

        const selectedClass = CLASS_MAP[classId];
        if (!selectedClass) return;

        // Fetch class details from backend
        setIsLoadingClass(true);
        try {
            const classDetails = await ClassService.getClassById(undefined, { id: classId });
            onClassDetailsChange(classDetails);

            // Update class and related properties
            const classFeatures = getClassFeatures(selectedClass);
            const bonusFeats = getBonusFeats(selectedClass);

            onUpdate({
                class: classId,
                classFeatures,
                bonusFeats
            });
        } catch (error) {
            console.error('Failed to fetch class details:', error);
            // Still update with basic class info even if details fail
            const classFeatures = getClassFeatures(selectedClass);
            const bonusFeats = getBonusFeats(selectedClass);

            onUpdate({
                class: classId,
                classFeatures,
                bonusFeats
            });
        } finally {
            setIsLoadingClass(false);
        }
    };

    const getClassFeatures = (selectedClass: Class): string[] => {
        const features: Record<string, string[]> = {
            'Barbarian': ['Rage', 'Fast Movement'],
            'Bard': ['Bardic Performance', 'Versatile Performance'],
            'Cleric': ['Divine Spellcasting', 'Domain'],
            'Druid': ['Nature Bond', 'Wild Empathy'],
            'Fighter': ['Bonus Feat', 'Combat Style'],
            'Monk': ['Flurry of Blows', 'Unarmed Strike'],
            'Paladin': ['Divine Grace', 'Lay on Hands'],
            'Ranger': ['Favored Enemy', 'Track'],
            'Rogue': ['Sneak Attack', 'Trapfinding'],
            'Sorcerer': ['Bloodline', 'Eschew Materials'],
            'Wizard': ['Arcane Spellcasting', 'Arcane Bond']
        };
        return features[selectedClass.name] || [];
    };

    const getBonusFeats = (selectedClass: Class): string[] => {
        const bonusFeats: Record<string, string[]> = {
            'Barbarian': ['Power Attack'],
            'Bard': ['Weapon Finesse'],
            'Cleric': ['Combat Casting'],
            'Druid': ['Combat Casting'],
            'Fighter': ['Combat Reflexes', 'Power Attack'],
            'Monk': ['Improved Unarmed Strike'],
            'Paladin': ['Weapon Focus'],
            'Ranger': ['Track'],
            'Rogue': ['Weapon Finesse'],
            'Sorcerer': ['Eschew Materials'],
            'Wizard': ['Scribe Scroll']
        };
        return bonusFeats[selectedClass.name] || [];
    };

    // Use user's preferred edition, default to edition 5 (3.5e) if not set
    const preferredEdition = user?.preferredEditionId || 5;
    const classOptions = GetBaseClassesByEdition(preferredEdition).map(cls => ({
        value: cls.value,
        label: cls.label
    }));

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Class
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Class Selection */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Class Selection
                    </h3>
                    <CustomSelect
                        value={character.class}
                        onValueChange={handleClassChange}
                        options={classOptions}
                        placeholder="Select a class..."
                        componentExtraClassName="mb-4"
                        disabled={isLoadingClass}
                    />
                    {isLoadingClass && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                            Loading class details...
                        </p>
                    )}
                </div>

                {/* Class Features */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Class Features
                    </h3>
                    {character.classFeatures.length > 0 ? (
                        <ul className="space-y-2">
                            {character.classFeatures.map((feature, index) => (
                                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                    • {feature}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">
                            Select a class to see available features.
                        </p>
                    )}
                </div>
            </div>

            {/* Character Progression Information */}
            {character.class && (
                <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Character Progression (Level {character.level})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Feats</h4>
                            <p className="text-lg font-bold text-blue-600">{getFeatCount(character.level)}</p>
                            <p className="text-xs text-gray-500">Available feats</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Ability Increases</h4>
                            <p className="text-lg font-bold text-green-600">{getAbilityScoreIncreases(character.level)}</p>
                            <p className="text-xs text-gray-500">Ability score points</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Experience</h4>
                            <p className="text-lg font-bold text-purple-600">{character.experience.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Total XP</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Next Level</h4>
                            <p className="text-lg font-bold text-orange-600">
                                {character.level < 20 ? `${character.level + 1}` : 'Max'}
                            </p>
                            <p className="text-xs text-gray-500">Character level</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 
