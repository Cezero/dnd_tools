import React, { useState } from 'react';
import { CustomSelect } from '@/components/forms/FormComponents';
import { ClassService } from '@/features/class/ClassService';
import { ClassDisplay } from '@/features/class/ClassDisplay';
import {
    CLASS_MAP,
    GetBaseClassesByEdition
} from '@shared/static-data';
import type { GetClassResponse, CharacterWithAllDetailsResponse } from '@shared/schema';

interface ClassTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
    selectedClassDetails?: GetClassResponse | null;
    onClassDetailsChange: (classDetails: GetClassResponse | null) => void;
}

export function ClassTab({
    character,
    onUpdate,
    selectedClassDetails,
    onClassDetailsChange
}: ClassTabProps): React.JSX.Element {
    const [isLoadingClass, setIsLoadingClass] = useState(false);

    // Get the current class from the first advancement
    const currentClassId = character.advancements[0]?.classId || null;

    const handleClassChange = async (classId: number | null) => {
        if (classId === null) {
            // Clear class from advancement
            onUpdate({
                advancements: [
                    {
                        ...character.advancements[0],
                        classId: 0,
                        features: []
                    }
                ]
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

            // Update the first advancement entry
            onUpdate({
                advancements: [
                    {
                        ...character.advancements[0],
                        classId: classId,
                        // Keep existing features, they'll be populated when class features are loaded
                        features: character.advancements[0].features
                    }
                ]
            });
        } catch (error) {
            console.error('Failed to fetch class details:', error);

            // Still update the class even if details fetch fails
            onUpdate({
                advancements: [
                    {
                        ...character.advancements[0],
                        classId: classId,
                        features: character.advancements[0].features
                    }
                ]
            });
        } finally {
            setIsLoadingClass(false);
        }
    };

    // Use user's preferred edition, default to edition 5 (3.5e) if not set
    const preferredEdition = 5; // Default to 3.5e
    const classOptions = GetBaseClassesByEdition(preferredEdition).map(cls => ({
        value: cls.value,
        label: cls.label
    }));

    return (
        <div className="p-4">
            {/* Class Selection */}
            <div className="bg-white dark:bg-gray-800 p-4">
                <CustomSelect
                    value={currentClassId}
                    onValueChange={handleClassChange}
                    label="Class:"
                    labelExtraClassName="text-xl font-semibold"
                    options={classOptions}
                    placeholder="Select a class..."
                    componentExtraClassName="flex items-center gap-2"
                    disabled={isLoadingClass}
                />
                {isLoadingClass && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                        Loading class details...
                    </p>
                )}
            </div>

            {/* Class Details Display */}
            {selectedClassDetails && (
                <ClassDisplay
                    cls={selectedClassDetails}
                    showHeader={false}
                    showActions={false}
                />
            )}
        </div>
    );
} 
