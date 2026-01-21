import React, { useMemo } from 'react';

import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { extractClassMechanics } from '@/lib/feature-extraction/classMechanicsExtractor';
import { ProgressionType, RPG_DICE } from '@shared/static-data';

import type { GestaltProgressionDisplayProps } from './types';

export function GestaltProgressionDisplay({
    primaryClass,
    secondaryClass,
    showHeader = true
}: GestaltProgressionDisplayProps): React.JSX.Element {
    // Extract mechanics from feature features
    // Note: classId may not be available on DnDClass type, so we extract without it
    const primaryMechanics = useMemo(() => {
        if (primaryClass.features) {
            const classId = (primaryClass as { id?: number }).id;
            return extractClassMechanics(primaryClass.features, classId);
        }
        return {
            hitDie: null,
            skillPoints: null,
            babProgression: null,
            fortProgression: null,
            refProgression: null,
            willProgression: null,
        };
    }, [primaryClass]);

    const secondaryMechanics = useMemo(() => {
        if (secondaryClass.features) {
            const classId = (secondaryClass as { id?: number }).id;
            return extractClassMechanics(secondaryClass.features, classId);
        }
        return {
            hitDie: null,
            skillPoints: null,
            babProgression: null,
            fortProgression: null,
            refProgression: null,
            willProgression: null,
        };
    }, [secondaryClass]);

    // Create gestalt feature by combining both classes' feature features
    // The feature generator will calculate the better BAB/saves at each level
    const primaryClassId = (primaryClass as { id?: number }).id;
    const secondaryClassId = (secondaryClass as { id?: number }).id;
    const combinedProgressions = [
        ...(primaryClass.features || []),
        ...(secondaryClass.features || [])
    ];

    const gestaltProgression = generateClassProgression({
        features: combinedProgressions,
        // For gestalt, we calculate BAB/saves from both classes and take the better
        // This is handled in the feature generator by finding the best value at each level
        spellcastingProgression: primaryClass.spellcastingProgression,
        spellsKnownProgression: primaryClass.spellsKnownProgression,
    });

    return (
        <div className="mt-4">
            {showHeader && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        Gestalt Feature: {primaryClass.name} + {secondaryClass.name}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        This feature combines both classes, using the better BAB and saving throw features.
                    </p>
                </div>
            )}

            <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Combined Class Feature</h4>
                <ClassProgressionTable
                    feature={gestaltProgression}
                    className="mt-2"
                />

                {/* Spellcasting Note for Gestalt */}
                {(primaryClass.spellcastingProgression.length > 0 || secondaryClass.spellcastingProgression.length > 0) && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                        <h5 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-2">
                            Gestalt Spellcasting
                        </h5>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                            <strong>Note:</strong> Gestalt characters with spellcasting classes get spells from both classes.
                            The feature table above shows {primaryClass.name} spells.
                            {secondaryClass.spellcastingProgression.length > 0 && ` You also gain ${secondaryClass.name} spells.`}
                        </p>
                    </div>
                )}
            </div>

            {/* Show individual class info for reference */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <h5 className="font-semibold text-sm mb-2">Primary Class: {primaryClass.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Hit Die: {primaryMechanics.hitDie ? RPG_DICE[primaryMechanics.hitDie]?.name : 'N/A'}<br />
                        BAB: {primaryMechanics.babProgression === ProgressionType.good ? 'Good' : primaryMechanics.babProgression === ProgressionType.average ? 'Medium' : 'Poor'}<br />
                        Saves: {primaryMechanics.fortProgression === ProgressionType.good ? 'Good' : 'Poor'} Fort, {primaryMechanics.refProgression === ProgressionType.good ? 'Good' : 'Poor'} Ref, {primaryMechanics.willProgression === ProgressionType.good ? 'Good' : 'Poor'} Will<br />
                        {primaryClass.spellcastingProgression && primaryClass.spellcastingProgression.length > 0 && <span className="text-purple-600 dark:text-purple-400">Spellcaster: Yes</span>}
                    </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <h5 className="font-semibold text-sm mb-2">Secondary Class: {secondaryClass.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Hit Die: {secondaryMechanics.hitDie ? RPG_DICE[secondaryMechanics.hitDie]?.name : 'N/A'}<br />
                        BAB: {secondaryMechanics.babProgression === ProgressionType.good ? 'Good' : secondaryMechanics.babProgression === ProgressionType.average ? 'Medium' : 'Poor'}<br />
                        Saves: {secondaryMechanics.fortProgression === ProgressionType.good ? 'Good' : 'Poor'} Fort, {secondaryMechanics.refProgression === ProgressionType.good ? 'Good' : 'Poor'} Ref, {secondaryMechanics.willProgression === ProgressionType.good ? 'Good' : 'Poor'} Will<br />
                        {secondaryClass.spellcastingProgression && secondaryClass.spellcastingProgression.length > 0 && <span className="text-purple-600 dark:text-purple-400">Spellcaster: Yes</span>}
                    </p>
                </div>
            </div>
        </div>
    );
}
