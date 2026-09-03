import React, { useMemo } from 'react';

import { generateClassProgression } from '@/lib/ClassProgression';
import { ClassProgressionTable } from '@/lib/ClassProgressionTable';
import { extractClassMechanics } from '@/lib/feature-extraction/classMechanicsExtractor';
import type { ProgressionRow } from '@/lib/types';
import type { DnDClass, FeatureWithRelations } from '@shared/schema';
import { ProgressionType, RPG_DICE } from '@shared/static-data';

import type { GestaltProgressionDisplayProps } from './types';

/**
 * Combined class progression view for gestalt characters.
 * Either class may have null `spellcastingProgression` or `spellsKnownProgression`
 * (non-casters such as Fighter); all reads of those fields must be null-safe.
 * Spell slots are tracked per class, so each caster gets its own spell table.
 */
export function GestaltProgressionDisplay({
    primaryClass,
    secondaryClass,
    primaryFeatures = [],
    secondaryFeatures = [],
    showHeader = true
}: GestaltProgressionDisplayProps): React.JSX.Element {
    // Extract mechanics from feature features (use primaryFeatures/secondaryFeatures resolved from featureIds)
    const primaryMechanics = useMemo(() => {
        if (primaryFeatures.length > 0) {
            const classId = (primaryClass as { id?: number }).id;
            return extractClassMechanics(primaryFeatures, classId);
        }
        return {
            hitDie: null,
            skillPoints: null,
            babProgression: null,
            fortProgression: null,
            refProgression: null,
            willProgression: null,
        };
    }, [primaryClass, primaryFeatures]);

    const secondaryMechanics = useMemo(() => {
        if (secondaryFeatures.length > 0) {
            const classId = (secondaryClass as { id?: number }).id;
            return extractClassMechanics(secondaryFeatures, classId);
        }
        return {
            hitDie: null,
            skillPoints: null,
            babProgression: null,
            fortProgression: null,
            refProgression: null,
            willProgression: null,
        };
    }, [secondaryClass, secondaryFeatures]);

    const primaryClassId = (primaryClass as { id?: number }).id;
    const secondaryClassId = (secondaryClass as { id?: number }).id;

    const gestaltProgression = useMemo(
        () => withoutSpellColumns(generateClassProgression({
            features: [...primaryFeatures, ...secondaryFeatures],
        })),
        [primaryFeatures, secondaryFeatures]
    );

    const primarySpellProgression = useMemo(
        () => generateClassSpellProgression(primaryClass, primaryFeatures, primaryClassId),
        [primaryClass, primaryFeatures, primaryClassId]
    );

    const secondarySpellProgression = useMemo(
        () => generateClassSpellProgression(secondaryClass, secondaryFeatures, secondaryClassId),
        [secondaryClass, secondaryFeatures, secondaryClassId]
    );

    const primaryHasSpells = hasSpellColumns(primarySpellProgression);
    const secondaryHasSpells = hasSpellColumns(secondarySpellProgression);

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

                {(primaryHasSpells || secondaryHasSpells) && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                        <h5 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-2">
                            Gestalt Spellcasting
                        </h5>
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                            <strong>Note:</strong> Gestalt characters gain spells from each spellcasting class separately.
                            Spell tables below are listed per class.
                        </p>
                    </div>
                )}

                {primaryHasSpells && (
                    <div className="mt-4">
                        <h5 className="text-sm font-semibold mb-2">{primaryClass.name} Spells</h5>
                        <ClassProgressionTable
                            feature={primarySpellProgression}
                            className="mt-2"
                            showCombatColumns={false}
                        />
                    </div>
                )}

                {secondaryHasSpells && (
                    <div className="mt-4">
                        <h5 className="text-sm font-semibold mb-2">{secondaryClass.name} Spells</h5>
                        <ClassProgressionTable
                            feature={secondarySpellProgression}
                            className="mt-2"
                            showCombatColumns={false}
                        />
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
                        {primaryHasSpells && <span className="text-purple-600 dark:text-purple-400">Spellcaster: Yes</span>}
                    </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <h5 className="font-semibold text-sm mb-2">Secondary Class: {secondaryClass.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Hit Die: {secondaryMechanics.hitDie ? RPG_DICE[secondaryMechanics.hitDie]?.name : 'N/A'}<br />
                        BAB: {secondaryMechanics.babProgression === ProgressionType.good ? 'Good' : secondaryMechanics.babProgression === ProgressionType.average ? 'Medium' : 'Poor'}<br />
                        Saves: {secondaryMechanics.fortProgression === ProgressionType.good ? 'Good' : 'Poor'} Fort, {secondaryMechanics.refProgression === ProgressionType.good ? 'Good' : 'Poor'} Ref, {secondaryMechanics.willProgression === ProgressionType.good ? 'Good' : 'Poor'} Will<br />
                        {secondaryHasSpells && <span className="text-purple-600 dark:text-purple-400">Spellcaster: Yes</span>}
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * True when any progression row has spells-per-day or spells-known columns.
 */
function hasSpellColumns(rows: ProgressionRow[]): boolean {
    return rows.some(row => row.spells !== undefined || row.spellsKnown !== undefined);
}

/**
 * Combined gestalt table shows BAB/saves only; spell slots are rendered per class.
 */
function withoutSpellColumns(rows: ProgressionRow[]): ProgressionRow[] {
    return rows.map((row) => ({
        level: row.level,
        bab: row.bab,
        fort: row.fort,
        ref: row.ref,
        will: row.will,
    }));
}

/**
 * Build a class-scoped progression so formula and legacy table slots stay on that class.
 */
function generateClassSpellProgression(
    cls: DnDClass,
    features: FeatureWithRelations[],
    classId?: number
): ProgressionRow[] {
    return generateClassProgression({
        features,
        classId,
        spellcastingProgression: cls.spellcastingProgression ?? undefined,
        spellsKnownProgression: cls.spellsKnownProgression ?? undefined,
    });
}
