import ordinal from 'ordinal';

import type { ProgressionRow } from '@/lib/types';

function hasSpellsAtLevel(feature: ProgressionRow[], spellLevel: number, isSpellsKnown: boolean = false): boolean {
    return feature.some(row => {
        const spells = isSpellsKnown ? row.spellsKnown : row.spells;
        return spells && spellLevel in spells && spells[spellLevel] > 0;
    });
}

function countSpellLevels(feature: ProgressionRow[], isSpellsKnown: boolean = false): number {
    let count = 0;
    for (let i = 0; i <= 9; i++) {
        if (hasSpellsAtLevel(feature, i, isSpellsKnown)) {
            count++;
        }
    }
    return count;
}

function getMaxSpellLevel(spells: { [spellLevel: number]: number }): number {
    // Get all spell levels that have slots
    const spellLevels = Object.keys(spells).map(Number);
    return spellLevels.length > 0 ? Math.max(...spellLevels) : 0;
}

interface ClassProgressionTableProps {
    feature: ProgressionRow[];
    className?: string;
}

export function ClassProgressionTable({ feature, className = '' }: ClassProgressionTableProps) {
    if (!feature || feature.length === 0) {
        return null;
    }

    // Check if any row has spells to determine if we need spell columns
    const hasSpells = feature.some(row => row.spells);
    const hasSpellsKnown = feature.some(row => row.spellsKnown);

    // Get the maximum spell level that has actual spells
    const maxSpellLevel = hasSpells
        ? Math.max(...feature.map(row => row.spells ? getMaxSpellLevel(row.spells) : 0))
        : 0;
    const maxSpellsKnownLevel = hasSpellsKnown
        ? Math.max(...feature.map(row => row.spellsKnown ? getMaxSpellLevel(row.spellsKnown) : 0))
        : 0;

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-auto border border-gray-300 dark:border-gray-500">
                <thead>
                    {(hasSpells || hasSpellsKnown) && (
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border-r border-gray-300 dark:border-gray-500 border-t border-b px-2 py-1 text-left text-sm font-medium align-bottom" rowSpan={2}>
                                Level
                            </th>
                            <th className="border-r border-gray-300 dark:border-gray-500 border-t border-b px-2 py-1 text-left text-sm font-medium align-bottom" rowSpan={2}>
                                Base<br />Attack Bonus
                            </th>
                            <th className="border-r border-gray-300 dark:border-gray-500 border-t border-b px-2 py-1 text-center text-sm font-medium align-bottom" rowSpan={2}>
                                Fort<br />Save
                            </th>
                            <th className="border-r border-gray-300 dark:border-gray-500 border-t border-b px-2 py-1 text-center text-sm font-medium align-bottom" rowSpan={2}>
                                Ref<br />Save
                            </th>
                            <th className="border-r border-gray-300 dark:border-gray-500 border-t border-b px-2 py-1 text-center text-sm font-medium align-bottom" rowSpan={2}>
                                Will<br />Save
                            </th>
                            {hasSpells && (
                                <th className="border-r border-gray-300 dark:border-gray-500 px-2 py-1 text-center text-sm font-medium align-bottom" colSpan={countSpellLevels(feature)}>
                                    Spells per Day
                                </th>
                            )}
                            {hasSpellsKnown && (
                                <th className="border-r border-gray-300 dark:border-gray-500 px-2 py-1 text-center text-sm font-medium align-bottom" colSpan={countSpellLevels(feature, true)}>
                                    Spells Known
                                </th>
                            )}
                        </tr>
                    )}
                    {(hasSpells || hasSpellsKnown) && (
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            {hasSpells && Array.from({ length: 10 }, (_, i) => {
                                // Only show column if there are spells at this level
                                if (!hasSpellsAtLevel(feature, i)) {
                                    return null;
                                }

                                return (
                                    <th key={`spells-${i}`} className={`px-2 py-1 border text-center text-sm font-medium whitespace-nowrap align-bottom ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                        } ${i === maxSpellLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                        } border-t-gray-200 dark:border-t-gray-600 border-b-gray-200 dark:border-b-gray-600`}>
                                        {i === 0 ? '0' : ordinal(i)}
                                    </th>
                                );
                            }).filter(Boolean)}
                            {hasSpellsKnown && Array.from({ length: 10 }, (_, i) => {
                                // Only show column if there are spells known at this level
                                if (!hasSpellsAtLevel(feature, i, true)) {
                                    return null;
                                }

                                return (
                                    <th key={`spells-known-${i}`} className={`px-2 py-1 border text-center text-sm font-medium whitespace-nowrap align-bottom ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                        } ${i === maxSpellsKnownLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                        } border-t-gray-200 dark:border-t-gray-600 border-b-gray-200 dark:border-b-gray-600`}>
                                        {i === 0 ? '0' : ordinal(i)}
                                    </th>
                                );
                            }).filter(Boolean)}
                        </tr>
                    )}
                    {!hasSpells && !hasSpellsKnown && (
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-left text-sm font-medium align-bottom">
                                Level
                            </th>
                            <th className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-left text-sm font-medium align-bottom">
                                Base<br />Attack Bonus
                            </th>
                            <th className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-center text-sm font-medium align-bottom">
                                Fort<br />Save
                            </th>
                            <th className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-center text-sm font-medium align-bottom">
                                Ref<br />Save
                            </th>
                            <th className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-center text-sm font-medium align-bottom">
                                Will<br />Save
                            </th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {feature.map((row, index) => (
                        <tr key={row.level} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                            }`}>
                            <td className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-left whitespace-nowrap">
                                {ordinal(row.level)}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-left whitespace-nowrap">
                                {row.bab}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-left whitespace-nowrap">
                                +{row.fort}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-left whitespace-nowrap">
                                +{row.ref}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-500 px-2 py-1 text-sm text-left whitespace-nowrap">
                                +{row.will}
                            </td>
                            {hasSpells && (
                                <>
                                    {Array.from({ length: 10 }, (_, i) => {
                                        // Only show column if there are spells at this level
                                        if (!hasSpellsAtLevel(feature, i)) {
                                            return null;
                                        }

                                        return (
                                            <td key={`spells-${i}`} className={`px-2 py-1 border text-sm text-center whitespace-nowrap ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                                } ${i === maxSpellLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                                } ${index === feature.length - 1 ? 'border-b-gray-300 dark:border-b-gray-500' : 'border-b-gray-200 dark:border-b-gray-600'}`}>
                                                {row.spells && row.spells[i] !== undefined ? row.spells[i] : '-'}
                                            </td>
                                        );
                                    }).filter(Boolean)}
                                </>
                            )}
                            {hasSpellsKnown && (
                                <>
                                    {Array.from({ length: 10 }, (_, i) => {
                                        // Only show column if there are spells known at this level
                                        if (!hasSpellsAtLevel(feature, i, true)) {
                                            return null;
                                        }

                                        return (
                                            <td key={`spells-known-${i}`} className={`px-2 py-1 border text-sm text-center whitespace-nowrap ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                                } ${i === maxSpellsKnownLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                                } ${index === feature.length - 1 ? 'border-b-gray-300 dark:border-b-gray-500' : 'border-b-gray-200 dark:border-b-gray-600'}`}>
                                                {row.spellsKnown && row.spellsKnown[i] !== undefined ? row.spellsKnown[i] : '-'}
                                            </td>
                                        );
                                    }).filter(Boolean)}
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 
