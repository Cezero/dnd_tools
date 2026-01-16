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
    // Extract mechanics from feature progressions
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

    // Create gestalt progression by choosing the better progression type for each stat
    const gestaltProgression = generateClassProgression({
        // Use better BAB progression (good=0 > average=1 > poor=2)
        babProgression: Math.min(
            primaryMechanics.babProgression ?? 2,
            secondaryMechanics.babProgression ?? 2
        ) as ProgressionType,
        // Use better save progressions (good=0 > poor=2)
        fortProgression: Math.min(
            primaryMechanics.fortProgression ?? 2,
            secondaryMechanics.fortProgression ?? 2
        ) as ProgressionType,
        refProgression: Math.min(
            primaryMechanics.refProgression ?? 2,
            secondaryMechanics.refProgression ?? 2
        ) as ProgressionType,
        willProgression: Math.min(
            primaryMechanics.willProgression ?? 2,
            secondaryMechanics.willProgression ?? 2
        ) as ProgressionType,
        // For spellcasting, gestalt characters get both progressions
        // This will need to be handled differently - we can't just pass one progression
        // For now, we'll show the primary class progression and note that both are available
        spellcastingProgression: primaryClass.spellcastingProgression,
        spellsKnownProgression: primaryClass.spellsKnownProgression,
    });

    return (
        <div className="mt-4">
            {showHeader && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        Gestalt Progression: {primaryClass.name} + {secondaryClass.name}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        This progression combines both classes, using the better BAB and saving throw progressions.
                    </p>
                </div>
            )}

            <div className="mt-4">
                <h4 className="text-md font-semibold mb-2">Combined Class Progression</h4>
                <ClassProgressionTable
                    progression={gestaltProgression}
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
                            The progression table above shows {primaryClass.name} spells.
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
