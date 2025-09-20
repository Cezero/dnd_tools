import React, { useState, useEffect } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { GestaltProgressionDisplay } from '@/features/character/GestaltProgressionDisplay';
import { ClassApi } from '@/features/class/ClassApi';
import { ClassDisplay } from '@/features/class/ClassDisplay';
import type { DnDClass, CharacterWithAllDetailsResponse, GetAllClassesResponse } from '@shared/schema';

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
    const [allClasses, setAllClasses] = useState<GetAllClassesResponse['results']>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [secondaryClassDetails, setSecondaryClassDetails] = useState<DnDClass | null>(null);

    // Get the current classes from the first advancement
    const currentClassId = character.advancements[0]?.classId || null;
    const currentSecondaryClassId = character.advancements[0]?.secondaryClassId || null;

    // Load classes based on variant setting
    useEffect(() => {
        const loadClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const response = await ClassApi.getClasses({
                    editionId: character.editionId || 5, // Use character's edition or default to 3.5e
                    baseClassesOnly: !character.allowVariantClasses // Include variants only if allowed
                });
                setAllClasses(response.results);
            } catch (error) {
                console.error('Failed to load classes:', error);
                setAllClasses([]);
            } finally {
                setIsLoadingClasses(false);
            }
        };

        loadClasses();
    }, [character.allowVariantClasses, character.editionId]);

    // Load secondary class details if gestalt character has secondary class
    useEffect(() => {
        const loadSecondaryClass = async () => {
            if (!character.isGestalt || !currentSecondaryClassId) {
                setSecondaryClassDetails(null);
                return;
            }

            try {
                const classDetails = await ClassApi.getClassById(undefined, { id: currentSecondaryClassId });
                setSecondaryClassDetails(classDetails);
            } catch (error) {
                console.error('Failed to load secondary class details:', error);
                setSecondaryClassDetails(null);
            }
        };

        loadSecondaryClass();
    }, [character.isGestalt, currentSecondaryClassId]);

    const handleClassChange = async (classId: number | null, isSecondary = false) => {
        if (classId === null) {
            // Clear class from advancement
            const updateData = {
                ...character.advancements[0],
                featureChoices: [],
                ...(isSecondary ? { secondaryClassId: 0 } : { classId: 0 })
            };

            onUpdate({
                advancements: [updateData]
            });

            if (isSecondary) {
                setSecondaryClassDetails(null);
            } else {
                onClassDetailsChange(null);
            }
            return;
        }

        // Validate that the class ID is valid by checking if we can fetch it
        // We'll let the API call handle the validation

        // Fetch class details from backend
        setIsLoadingClass(true);
        try {
            const classDetails = await ClassApi.getClassById(undefined, { id: classId });

            if (isSecondary) {
                setSecondaryClassDetails(classDetails);
            } else {
                onClassDetailsChange(classDetails);
            }

            // Update the first advancement entry
            const updateData = {
                ...character.advancements[0],
                featureChoices: character.advancements[0].featureChoices,
                ...(isSecondary ? { secondaryClassId: classId } : { classId: classId })
            };

            onUpdate({
                advancements: [updateData]
            });
        } catch (error) {
            console.error('Failed to fetch class details:', error);

            // Still update the class even if details fetch fails
            const updateData = {
                ...character.advancements[0],
                featureChoices: character.advancements[0].featureChoices,
                ...(isSecondary ? { secondaryClassId: classId } : { classId: classId })
            };

            onUpdate({
                advancements: [updateData]
            });
        } finally {
            setIsLoadingClass(false);
        }
    };

    return (
        <div className="p-4">
            {/* Class Selection */}
            <div className="bg-white dark:bg-gray-800 p-4">
                {/* Gestalt Info */}
                {character.isGestalt && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Gestalt Mode:</strong> You can select two classes for this character. The classes will be combined.
                        </p>
                    </div>
                )}

                <div className={character.isGestalt ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex items-center gap-4"}>
                    {/* Primary Class */}
                    <div>
                        <CustomSelect
                            value={currentClassId}
                            onValueChange={(classId) => handleClassChange(classId, false)}
                            label={character.isGestalt ? "Primary Class:" : "Class:"}
                            labelExtraClassName="text-lg font-semibold"
                            options={allClasses}
                            placeholder={isLoadingClasses ? "Loading classes..." : "Select a class..."}
                            componentExtraClassName="flex items-center gap-2"
                            disabled={isLoadingClass || isLoadingClasses}
                        />
                    </div>

                    {/* Secondary Class (Gestalt) */}
                    {character.isGestalt && (
                        <div>
                            <CustomSelect
                                value={currentSecondaryClassId}
                                onValueChange={(classId) => handleClassChange(classId, true)}
                                label="Secondary Class:"
                                labelExtraClassName="text-lg font-semibold"
                                options={allClasses}
                                placeholder={isLoadingClasses ? "Loading classes..." : "Select a class..."}
                                componentExtraClassName="flex items-center gap-2"
                                disabled={isLoadingClass || isLoadingClasses}
                            />
                        </div>
                    )}

                    {/* Loading indicators */}
                    {isLoadingClass && (
                        <div className="col-span-full">
                            <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                                Loading class details...
                            </p>
                        </div>
                    )}
                    {isLoadingClasses && (
                        <div className="col-span-full">
                            <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                                Loading classes...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Class Details Display */}
            {selectedClassDetails && !character.isGestalt && (
                <div className="mt-6">
                    <ClassDisplay
                        cls={selectedClassDetails}
                        showHeader={false}
                        showActions={false}
                    />
                </div>
            )}

            {/* Gestalt Combined Progression */}
            {character.isGestalt && selectedClassDetails && secondaryClassDetails && (
                <div className="mt-6">
                    <GestaltProgressionDisplay
                        primaryClass={selectedClassDetails}
                        secondaryClass={secondaryClassDetails}
                        showHeader={true}
                    />
                </div>
            )}

            {/* Show individual class details for gestalt if only one class is selected */}
            {character.isGestalt && selectedClassDetails && !secondaryClassDetails && (
                <div className="mt-6">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-4">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <strong>Note:</strong> Select both primary and secondary classes to see the combined gestalt progression.
                        </p>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-4">Primary Class Details</h3>
                        <ClassDisplay
                            cls={selectedClassDetails}
                            showHeader={false}
                            showActions={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
} 
