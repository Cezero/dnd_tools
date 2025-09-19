import React, { useState, useEffect } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { ClassApi } from '@/features/class/ClassApi';
import { ClassDisplay } from '@/features/class/ClassDisplay';
import type { DnDClass, CharacterWithAllDetailsResponse, GetAllClassesResponse } from '@shared/schema';
import {
    CLASS_MAP,
    EDITION_IDS,
    GetBaseClassesByEdition,
    isVariantId
} from '@shared/static-data';

interface ClassTabProps {
    character: CharacterWithAllDetailsResponse;
    onUpdate: (data: Partial<CharacterWithAllDetailsResponse>) => void;
    selectedClassDetails?: DnDClass | null;
    onClassDetailsChange: (classDetails: DnDClass | null) => void;
}

export function ClassTab({
    character,
    onUpdate,
    selectedClassDetails,
    onClassDetailsChange
}: ClassTabProps): React.JSX.Element {
    const [isLoadingClass, setIsLoadingClass] = useState(false);
    const [allowVariants, setAllowVariants] = useState(false);
    const [allClasses, setAllClasses] = useState<GetAllClassesResponse['results']>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);

    // Get the current class from the first advancement
    const currentClassId = character.advancements[0]?.classId || null;

    // Load all classes when variants are enabled
    useEffect(() => {
        const loadAllClasses = async () => {
            if (!allowVariants) return;

            setIsLoadingClasses(true);
            try {
                const response = await ClassApi.getClasses({
                    editionId: 5, // Default to 3.5e
                    baseClassesOnly: false // Include variants
                });
                setAllClasses(response.results);
            } catch (error) {
                console.error('Failed to load classes:', error);
                setAllClasses([]);
            } finally {
                setIsLoadingClasses(false);
            }
        };

        loadAllClasses();
    }, [allowVariants]);

    const handleClassChange = async (classId: number | null) => {
        if (classId === null) {
            // Clear class from advancement
            onUpdate({
                advancements: [
                    {
                        ...character.advancements[0],
                        classId: 0,
                        featureChoices: []
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
            const classDetails = await ClassApi.getClassById(undefined, { id: classId });
            onClassDetailsChange(classDetails);

            // Update the first advancement entry
            onUpdate({
                advancements: [
                    {
                        ...character.advancements[0],
                        classId: classId,
                        // Keep existing features, they'll be populated when class features are loaded
                        featureChoices: character.advancements[0].featureChoices
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
                        featureChoices: character.advancements[0].featureChoices
                    }
                ]
            });
        } finally {
            setIsLoadingClass(false);
        }
    };

    // Get class options based on whether variants are enabled
    const getClassOptions = () => {
        if (allowVariants && allClasses.length > 0) {
            return allClasses.map(cls => ({
                value: cls.id,
                label: cls.name,
                isVariant: isVariantId(cls.id)
            }));
        } else {
            // Use user's preferred edition, default to edition 5 (3.5e) if not set
            const preferredEdition = EDITION_IDS.DND_3_5E; // Default to 3.5e
            return GetBaseClassesByEdition(preferredEdition).map(cls => ({
                value: cls.value,
                label: cls.label,
                isVariant: false
            }));
        }
    };

    const classOptions = getClassOptions();

    return (
        <div className="p-4">
            {/* Class Selection */}
            <div className="bg-white dark:bg-gray-800 p-4">
                {/* Variant Toggle */}
                <div className="mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={allowVariants}
                            onChange={(e) => setAllowVariants(e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Allow variant classes
                        </span>
                    </label>
                    {allowVariants && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Variant classes are modifications to base classes (e.g., Cloistered Cleric)
                        </p>
                    )}
                </div>

                <CustomSelect
                    value={currentClassId}
                    onValueChange={handleClassChange}
                    label="Class:"
                    labelExtraClassName="text-xl font-semibold"
                    options={classOptions.map(option => ({
                        value: option.value,
                        label: option.isVariant ? `${option.label} (Variant)` : option.label
                    }))}
                    placeholder={isLoadingClasses ? "Loading classes..." : "Select a class..."}
                    componentExtraClassName="flex items-center gap-2"
                    disabled={isLoadingClass || isLoadingClasses}
                />
                {isLoadingClass && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                        Loading class details...
                    </p>
                )}
                {isLoadingClasses && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                        Loading classes...
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
