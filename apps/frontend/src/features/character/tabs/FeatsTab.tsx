import React from 'react';
import { CustomCheckbox } from '@/components/forms/FormComponents';
import type { RaceInQueryResponse, GetRaceResponse } from '@shared/schema';
import type { CharacterData } from '../types';

interface FeatsTabProps {
    character: CharacterData;
    onUpdate: (data: Partial<CharacterData>) => void;
    races?: RaceInQueryResponse[];
    selectedRaceDetails?: GetRaceResponse | null;
}

export function FeatsTab({
    character,
    onUpdate,
    races = [],
    selectedRaceDetails
}: FeatsTabProps): React.JSX.Element {
    const handleFeatToggle = (feat: string) => {
        const newFeats = character.feats.includes(feat)
            ? character.feats.filter(f => f !== feat)
            : [...character.feats, feat];
        onUpdate({ feats: newFeats });
    };

    const availableFeats = [
        'Power Attack',
        'Weapon Focus',
        'Combat Reflexes',
        'Improved Initiative',
        'Toughness'
    ];

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Feats
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Selected Feats */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Selected Feats
                    </h3>
                    {character.feats.length > 0 ? (
                        <ul className="space-y-2">
                            {character.feats.map((feat, index) => (
                                <li key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{feat}</span>
                                    <button
                                        onClick={() => handleFeatToggle(feat)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">
                            No feats selected yet.
                        </p>
                    )}
                </div>

                {/* Bonus Feats from Class */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Bonus Feats
                    </h3>
                    {character.bonusFeats.length > 0 ? (
                        <ul className="space-y-2">
                            {character.bonusFeats.map((feat, index) => (
                                <li key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                    <span className="text-sm text-blue-700 dark:text-blue-300">{feat}</span>
                                    <span className="text-xs text-blue-500 dark:text-blue-400">Class Bonus</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">
                            No bonus feats from class.
                        </p>
                    )}
                </div>
            </div>

            {/* Available Feats */}
            <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Available Feats
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableFeats.map((feat) => (
                        <CustomCheckbox
                            key={feat}
                            checked={character.feats.includes(feat)}
                            onCheckedChange={() => handleFeatToggle(feat)}
                            label={feat}
                            componentExtraClassName="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
} 
