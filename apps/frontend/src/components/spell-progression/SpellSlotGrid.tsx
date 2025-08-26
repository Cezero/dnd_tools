import React, { useCallback, useMemo } from 'react';

import { CreateSpellcastingProgressionRequest } from '@shared/schema';

export interface SpellSlotGridProps {
    /** Spell progression data for all levels */
    progression: CreateSpellcastingProgressionRequest[];
    /** Callback when a level's slots change */
    onLevelChange: (level: number, slots: { spellLevel: number; slotsPerDay: number }[]) => void;
    /** Whether the grid is read-only */
    readOnly?: boolean;
    /** Unique identifier for this grid instance */
    gridId?: string;
}

export const SpellSlotGrid: React.FC<SpellSlotGridProps> = ({
    progression,
    onLevelChange,
    readOnly = false,
    gridId = 'default'
}) => {
    // Create a 20x10 grid (class levels 1-20, spell levels 0-9)
    const gridData = useMemo(() => {
        const grid: (number | null)[][] = [];

        for (let classLevel = 1; classLevel <= 20; classLevel++) {
            const row: (number | null)[] = [];
            const levelData = progression[classLevel - 1];

            for (let spellLevel = 0; spellLevel <= 9; spellLevel++) {
                const slot = levelData?.slots?.find(s => s.spellLevel === spellLevel);
                row.push(slot ? slot.slotsPerDay : null);
            }

            grid.push(row);
        }

        return grid;
    }, [progression]);

    const handleCellChange = useCallback((classLevel: number, spellLevel: number, value: string) => {
        if (readOnly) return;

        const numValue = value === '' ? null : parseInt(value, 10);
        if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > 10)) {
            return; // Invalid value
        }

        const currentSlots = progression[classLevel - 1]?.slots || [];
        let newSlots = [...currentSlots];

        if (numValue === null) {
            // Remove slot if value is empty
            newSlots = newSlots.filter(s => s.spellLevel !== spellLevel);
        } else {
            // Update or add slot
            const existingIndex = newSlots.findIndex(s => s.spellLevel === spellLevel);
            if (existingIndex >= 0) {
                newSlots[existingIndex] = { spellLevel, slotsPerDay: numValue };
            } else {
                newSlots.push({ spellLevel, slotsPerDay: numValue });
            }
        }

        onLevelChange(classLevel, newSlots);
    }, [progression, onLevelChange, readOnly]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent, classLevel: number, spellLevel: number) => {
        if (readOnly) return;

        let newClassLevel = classLevel;
        let newSpellLevel = spellLevel;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                newClassLevel = Math.max(1, classLevel - 1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                newClassLevel = Math.min(20, classLevel + 1);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                newSpellLevel = Math.max(0, spellLevel - 1);
                break;
            case 'ArrowRight':
                event.preventDefault();
                newSpellLevel = Math.min(9, spellLevel + 1);
                break;
            default:
                return;
        }

        // Find the next input element within this specific grid and focus it
        const nextInput = document.querySelector(
            `[data-grid-id="${gridId}"] input[data-class-level="${newClassLevel}"][data-spell-level="${newSpellLevel}"]`
        ) as HTMLInputElement;

        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        }
    }, [readOnly, gridId]);

    return (
        <div className="overflow-x-auto" data-grid-id={gridId}>
            <div className="inline-block min-w-0">
                {/* Header row with spell levels */}
                <div className="grid grid-cols-11 gap-0.5 mb-1">
                    <div className="w-10 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                        Level
                    </div>
                    {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className="w-9 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            {i}
                        </div>
                    ))}
                </div>

                {/* Grid rows */}
                {gridData.map((row, classLevelIndex) => {
                    const classLevel = classLevelIndex + 1;

                    return (
                        <div key={classLevel} className="grid grid-cols-11 gap-0.5">
                            {/* Level label */}
                            <div className="w-10 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
                                {classLevel}
                            </div>

                            {/* Spell slot cells */}
                            {row.map((value, spellLevel) => (
                                <input
                                    key={spellLevel}
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={value === null ? '' : value}
                                    onChange={(e) => handleCellChange(classLevel, spellLevel, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, classLevel, spellLevel)}
                                    disabled={readOnly}
                                    data-class-level={classLevel}
                                    data-spell-level={spellLevel}
                                    className={`w-9 h-6 text-center text-xs border rounded transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ${readOnly
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                        }`}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
