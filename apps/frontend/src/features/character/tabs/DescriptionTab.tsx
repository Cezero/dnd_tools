import React from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import type { RaceSummary, Race, CharacterWithAllDetailsResponse } from '@shared/schema';
import {
    ALIGNMENT_LIST,
    CLASS_MAP,
    SIZE_MAP
} from '@shared/static-data';

interface DescriptionTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
    races?: RaceSummary[];
    selectedRaceDetails?: Race | null;
}

export function DescriptionTab({
    character,
    onUpdate,
    races: _races = [],
    selectedRaceDetails
}: DescriptionTabProps): React.JSX.Element {
    const alignmentOptions = ALIGNMENT_LIST.map((alignment) => ({
        value: alignment.id,
        label: `${alignment.name} (${alignment.abbreviation})`
    }));

    const getSizeForRace = (): string => {
        if (!selectedRaceDetails) return 'Not determined';
        return SIZE_MAP[selectedRaceDetails.sizeId]?.name || 'Medium';
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Description
            </h2>

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Character Name
                    </h3>
                    <input
                        type="text"
                        value={character.name}
                        onChange={(e) => onUpdate({ name: e.target.value })}
                        placeholder="Enter character name..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Alignment */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Alignment
                        </h3>
                        <CustomSelect
                            value={character.alignmentId}
                            onValueChange={(value) => onUpdate({ alignmentId: value })}
                            options={alignmentOptions}
                            placeholder="Select alignment..."
                            componentExtraClassName="mb-4"
                        />
                    </div>

                    {/* Character Info */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Character Information
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>Race:</strong> {selectedRaceDetails?.name || 'Not selected'}</p>
                            <p><strong>Size:</strong> {getSizeForRace()}</p>
                            <p><strong>Class:</strong> {character.advancements[0]?.classId ? CLASS_MAP[character.advancements[0]?.classId]?.name : 'Not selected'}</p>
                            <p><strong>Level:</strong> {character.advancements.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Physical Description
                    </h3>
                    <textarea
                        value={character.appearance}
                        onChange={(e) => onUpdate({ appearance: e.target.value })}
                        placeholder="Describe your character's physical appearance..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Background
                    </h3>
                    <textarea
                        value={character.background}
                        onChange={(e) => onUpdate({ background: e.target.value })}
                        placeholder="Describe your character's background and history..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
} 
