import ordinal from 'ordinal';

import { ProgressionRow, formatSpellProgression, getMaxSpellLevel } from '@/lib/ClassProgression';

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
    const maxSpellLevel = hasSpells
        ? Math.max(...progression.map(row => row.spells ? getMaxSpellLevel(row.spells) : 0))
        : 0;

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-auto border border-gray-300 dark:border-gray-600">
                <thead>
                    {hasSpells && (
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-sm font-medium align-bottom" rowSpan={2}>
                                Level
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-sm font-medium align-bottom" rowSpan={2}>
                                Base<br />Attack Bonus
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium align-bottom" rowSpan={2}>
                                Fort<br />Save
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium align-bottom" rowSpan={2}>
                                Ref<br />Save
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium align-bottom" rowSpan={2}>
                                Will<br />Save
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium align-bottom" colSpan={maxSpellLevel + 1}>
                                Spells per Day
                            </th>
                        </tr>
                    )}
                    {hasSpells && (
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            {Array.from({ length: maxSpellLevel + 1 }, (_, i) => (
                                <th key={i} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium whitespace-nowrap align-bottom">
                                    {i === 0 ? '0' : ordinal(i)}
                                </th>
                            ))}
                        </tr>
                    )}
                    {!hasSpells && (
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-sm font-medium align-bottom">
                                Level
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-sm font-medium align-bottom">
                                Base<br />Attack Bonus
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium align-bottom">
                                Fort<br />Save
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium align-bottom">
                                Ref<br />Save
                            </th>
                            <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-sm font-medium align-bottom">
                                Will<br />Save
                            </th>
                        </tr>
                    )}
                </thead>
                <tbody>
                    {progression.map((row) => (
                        <tr key={row.level} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-left whitespace-nowrap">
                                {ordinal(row.level)}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-left whitespace-nowrap">
                                {row.bab}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-left whitespace-nowrap">
                                +{row.fort}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-left whitespace-nowrap">
                                +{row.ref}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-left whitespace-nowrap">
                                +{row.will}
                            </td>
                            {hasSpells && (
                                <>
                                    {Array.from({ length: maxSpellLevel + 1 }, (_, i) => (
                                        <td key={i} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-center whitespace-nowrap">
                                            {row.spells && row.spells[i] !== undefined ? row.spells[i] : '—'}
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