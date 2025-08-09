import ordinal from 'ordinal';

import { ProgressionRow } from '@/lib/ClassProgression';

function getMaxSpellLevel(spells: { [spellLevel: number]: number }): number {
    return Math.max(...Object.keys(spells).map(Number));
}

interface ClassProgressionTableProps {
    progression: ProgressionRow[];
    className?: string;
}

export function ClassProgressionTable({ progression, className = '' }: ClassProgressionTableProps) {
    if (!progression || progression.length === 0) {
        return null;
    }

    // Check if any row has spells to determine if we need spell columns
    const hasSpells = progression.some(row => row.spells);
    const hasSpellsKnown = progression.some(row => row.spellsKnown);
    const maxSpellLevel = hasSpells
        ? Math.max(...progression.map(row => row.spells ? getMaxSpellLevel(row.spells) : 0))
        : 0;
    const maxSpellsKnownLevel = hasSpellsKnown
        ? Math.max(...progression.map(row => row.spellsKnown ? getMaxSpellLevel(row.spellsKnown) : 0))
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
                                <th className="border-r border-gray-300 dark:border-gray-500 px-2 py-1 text-center text-sm font-medium align-bottom" colSpan={maxSpellLevel + 1}>
                                    Spells per Day
                                </th>
                            )}
                            {hasSpellsKnown && (
                                <th className="border-r border-gray-300 dark:border-gray-500 px-2 py-1 text-center text-sm font-medium align-bottom" colSpan={maxSpellsKnownLevel + 1}>
                                    Spells Known
                                </th>
                            )}
                        </tr>
                    )}
                    {(hasSpells || hasSpellsKnown) && (
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            {hasSpells && Array.from({ length: maxSpellLevel + 1 }, (_, i) => (
                                <th key={`spells-${i}`} className={`px-2 py-1 border text-center text-sm font-medium whitespace-nowrap align-bottom ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                    } ${i === maxSpellLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                    } border-t-gray-200 dark:border-t-gray-600 border-b-gray-200 dark:border-b-gray-600`}>
                                    {i === 0 ? '0' : ordinal(i)}
                                </th>
                            ))}
                            {hasSpellsKnown && Array.from({ length: maxSpellsKnownLevel + 1 }, (_, i) => (
                                <th key={`spells-known-${i}`} className={`px-2 py-1 border text-center text-sm font-medium whitespace-nowrap align-bottom ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                    } ${i === maxSpellsKnownLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                    } border-t-gray-200 dark:border-t-gray-600 border-b-gray-200 dark:border-b-gray-600`}>
                                    {i === 0 ? '0' : ordinal(i)}
                                </th>
                            ))}
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
                    {progression.map((row, index) => (
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
                                    {Array.from({ length: maxSpellLevel + 1 }, (_, i) => (
                                        <td key={`spells-${i}`} className={`px-2 py-1 border text-sm text-center whitespace-nowrap ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                            } ${i === maxSpellLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                            } ${index === progression.length - 1 ? 'border-b-gray-300 dark:border-b-gray-500' : 'border-b-gray-200 dark:border-b-gray-600'}`}>
                                            {row.spells && row.spells[i] !== undefined ? row.spells[i] : '-'}
                                        </td>
                                    ))}
                                </>
                            )}
                            {hasSpellsKnown && (
                                <>
                                    {Array.from({ length: maxSpellsKnownLevel + 1 }, (_, i) => (
                                        <td key={`spells-known-${i}`} className={`px-2 py-1 border text-sm text-center whitespace-nowrap ${i === 0 ? 'border-l-gray-300 dark:border-l-gray-500' : 'border-l-gray-200 dark:border-l-gray-600'
                                            } ${i === maxSpellsKnownLevel ? 'border-r-gray-300 dark:border-r-gray-500' : 'border-r-gray-200 dark:border-r-gray-600'
                                            } ${index === progression.length - 1 ? 'border-b-gray-300 dark:border-b-gray-500' : 'border-b-gray-200 dark:border-b-gray-600'}`}>
                                            {row.spellsKnown && row.spellsKnown[i] !== undefined ? row.spellsKnown[i] : '-'}
                                        </td>
                                    ))}
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 
