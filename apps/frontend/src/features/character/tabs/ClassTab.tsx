import React, { useEffect, useRef, useState } from 'react';

import { CustomSelect } from '@/components/forms/FormComponents';
import { GestaltProgressionDisplay } from '@/features/character';
import type { TabComponentProps } from '@/features/character/types';
import { CharacterEditStateUpdateType } from '@/features/character/types';
import { ClassDisplay } from '@/features/class/ClassDisplay';
import { useCacheFunctions } from '@/services/cache';
import { EditionId, CoreComponent } from '@shared/static-data';

export function ClassTab({
    state,
    updateState,
    resolvedData: _resolvedData,
    isLoading: _isLoading,
    triggerFeatureResolution,
    sharedData
}: TabComponentProps): React.JSX.Element {
    const { getClassSelectByEdition } = useCacheFunctions();

    // Get the current class IDs directly from state
    const currentClassId = state.classId;
    const currentSecondaryClassId = state.secondaryClassId;

    // Get classes from cache based on variant setting
    const [allClasses, setAllClasses] = useState<CoreComponent[]>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);

    // Use class data from sharedData (fetched in CharacterEdit with cache)
    const primaryClassData = sharedData.primaryClass;
    const secondaryClassData = sharedData.secondaryClass;
    const isLoadingClass = sharedData.isLoadingClasses;

    // Fetch classes when edition or variant settings change
    useEffect(() => {
        const fetchClasses = async () => {
            const editionId = state.editionId || EditionId.DND_3x;
            setIsLoadingClasses(true);
            try {
                const classesData = getClassSelectByEdition(editionId, false, state.allowVariantClasses);
                setAllClasses(classesData || []);
            } catch (error) {
                console.error('Failed to fetch classes:', error);
                setAllClasses([]);
            } finally {
                setIsLoadingClasses(false);
            }
        };
        fetchClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.editionId, state.allowVariantClasses]);

    // Track which classes we've already resolved to prevent infinite loops
    const resolvedPrimaryClassIdRef = useRef<number | null>(null);
    const resolvedSecondaryClassIdRef = useRef<number | null>(null);

    // Trigger feature resolution when primary class data is loaded
    useEffect(() => {
        if (state.classId && primaryClassData && !isLoadingClass && resolvedPrimaryClassIdRef.current !== state.classId) {
            resolvedPrimaryClassIdRef.current = state.classId;
            triggerFeatureResolution();
        }
    }, [state.classId, primaryClassData, isLoadingClass, triggerFeatureResolution]);

    // Trigger feature resolution when secondary class data is loaded
    useEffect(() => {
        if (state.secondaryClassId && secondaryClassData && !isLoadingClass && resolvedSecondaryClassIdRef.current !== state.secondaryClassId) {
            resolvedSecondaryClassIdRef.current = state.secondaryClassId;
            triggerFeatureResolution();
        }
    }, [state.secondaryClassId, secondaryClassData, isLoadingClass, triggerFeatureResolution]);

    const handleClassChange = async (classId: number | null, isSecondary = false) => {
        if (classId === null) {
            // Clear class
            if (isSecondary) {
                updateState({ type: CharacterEditStateUpdateType.SET_SECONDARY_CLASS, payload: { secondaryClassId: null } });
            } else {
                updateState({ type: CharacterEditStateUpdateType.SET_CLASS, payload: { classId: null } });
            }
            return;
        }

        // Update class ID - the query hook will handle fetching the details
        if (isSecondary) {
            updateState({ type: CharacterEditStateUpdateType.SET_SECONDARY_CLASS, payload: { secondaryClassId: classId } });
        } else {
            updateState({ type: CharacterEditStateUpdateType.SET_CLASS, payload: { classId } });
        }

        // Don't trigger feature resolution here - wait for class data to load
        // The useEffect below will handle triggering when class data is available
    };

    return (
        <div className="p-4">
            {/* Class Selection */}
            <div className="bg-white dark:bg-gray-800 p-4">
                {/* Gestalt Info */}
                {state.isGestalt && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Gestalt Mode:</strong> You can select two classes for this character. The classes will be combined.
                        </p>
                    </div>
                )}

                <div className={state.isGestalt ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex items-center gap-4"}>
                    {/* Primary Class */}
                    <div>
                        <CustomSelect
                            value={currentClassId}
                            onValueChange={(classId) => handleClassChange(classId, false)}
                            label={state.isGestalt ? "Primary Class:" : "Class:"}
                            labelExtraClassName="text-lg font-semibold"
                            options={Array.isArray(allClasses) ? allClasses : []}
                            placeholder={isLoadingClasses ? "Loading classes..." : "Select a class..."}
                            componentExtraClassName="flex items-center gap-2"
                            disabled={isLoadingClass || isLoadingClasses}
                        />
                    </div>

                    {/* Secondary Class (Gestalt) */}
                    {state.isGestalt && (
                        <div>
                            <CustomSelect
                                value={currentSecondaryClassId}
                                onValueChange={(classId) => handleClassChange(classId, true)}
                                label="Secondary Class:"
                                labelExtraClassName="text-lg font-semibold"
                                options={Array.isArray(allClasses) ? allClasses : []}
                                placeholder={isLoadingClasses ? "Loading classes..." : "Select a class..."}
                                componentExtraClassName="flex items-center gap-2"
                                disabled={isLoadingClass || isLoadingClasses}
                            />
                        </div>
                    )}

                    {/* Loading indicators */}
                    {(isLoadingClass || isLoadingClasses) && (
                        <div className="col-span-full">
                            <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                                {isLoadingClasses ? "Loading classes..." : "Loading class details..."}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Class Details Display */}
            {primaryClassData && !state.isGestalt && (
                <div className="mt-6">
                    <ClassDisplay
                        cls={primaryClassData}
                        showHeader={false}
                        showActions={false}
                    />
                </div>
            )}

            {/* Gestalt Combined Progression */}
            {state.isGestalt && primaryClassData && secondaryClassData && (
                <div className="mt-6">
                    <GestaltProgressionDisplay
                        primaryClass={primaryClassData}
                        secondaryClass={secondaryClassData}
                        showHeader={true}
                    />
                </div>
            )}

            {/* Show individual class details for gestalt if only one class is selected */}
            {state.isGestalt && primaryClassData && !secondaryClassData && (
                <div className="mt-6">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-4">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <strong>Note:</strong> Select both primary and secondary classes to see the combined gestalt progression.
                        </p>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-4">Primary Class Details</h3>
                        <ClassDisplay
                            cls={primaryClassData}
                            showHeader={false}
                            showActions={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
