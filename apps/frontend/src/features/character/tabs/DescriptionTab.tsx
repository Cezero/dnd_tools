import React, { useState, useEffect } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import type { RaceSummary, Race, CharacterWithAllDetailsResponse } from '@shared/schema';
import {
    ALIGNMENT_LIST,
    SIZE_MAP
} from '@shared/static-data';

import { getClassById } from '../../class/ClassUtils';

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
    const [classData, setClassData] = useState<{ id: number; name: string } | null>(null);

    // Load class data when character class changes
    useEffect(() => {
        const loadClass = async () => {
            const classId = character.advancements[0]?.classId;
            if (classId) {
                const data = await getClassById(classId);
                if (data) {
                    setClassData({ id: data.id, name: data.name });
                } else {
                    setClassData(null);
                }
            } else {
                setClassData(null);
            }
        };

        loadClass();
    }, [character.advancements]);

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
                            options={ALIGNMENT_LIST}
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
                            <p><strong>Class:</strong> {classData?.name || 'Not selected'}</p>
                            <p><strong>Level:</strong> {character.advancements.length}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
