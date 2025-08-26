import { ScrollArea } from '@base-ui-components/react/scroll-area';
import React, { useMemo } from 'react';

import { CreateSpellcastingProgressionRequest } from '@shared/schema';

export interface SpellProgressionPreviewProps {
    /** Spell progression data for all levels */
    progression: CreateSpellcastingProgressionRequest[];
    /** Currently active class level */
    activeLevel: number;
    /** Callback when a level is clicked */
    onLevelClick: (level: number) => void;
    /** Whether the preview is read-only */
    readOnly?: boolean;
}

export const SpellProgressionPreview: React.FC<SpellProgressionPreviewProps> = ({
    progression,
    activeLevel,
    onLevelClick,
    readOnly = false
}) => {
    // Format progression data for display
    const formattedData = useMemo(() => {
        return progression.map((levelData, index) => {
            const classLevel = index + 1;
            const slots = levelData?.slots || [];

            // Create a map of spell level to slots per day
            const slotMap = new Map<number, number>();
            slots.forEach(slot => {
                slotMap.set(slot.spellLevel, slot.slotsPerDay);
            });

            // Format the slots string (e.g., "4/3/2/1" for 4 1st, 3 2nd, 2 3rd, 1 4th level spells)
            const slotStrings: string[] = [];
            for (let spellLevel = 0; spellLevel <= 9; spellLevel++) {
                const count = slotMap.get(spellLevel) || 0;
                if (count > 0) {
                    slotStrings.push(count.toString());
                } else {
                    break; // Stop at first zero slot
                }
            }

            const formattedSlots = slotStrings.length > 0 ? slotStrings.join('/') : '—';
            const hasSpells = slotStrings.length > 0;

            return {
                classLevel,
                formattedSlots,
                hasSpells,
                totalSlots: slots.reduce((sum, slot) => sum + slot.slotsPerDay, 0)
            };
        });
    }, [progression]);

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                <div>Level</div>
                <div>Spells per Day</div>
                <div>Total</div>
            </div>

            {/* Progression rows */}
            <div className="h-96 overflow-hidden">
                <ScrollArea.Root className="h-full">
                    <ScrollArea.Viewport className="h-full">
                        <ScrollArea.Content>
                            <div className="space-y-1">
                                {formattedData.map(({ classLevel, formattedSlots, hasSpells, totalSlots }) => {
                                    const isActive = classLevel === activeLevel;
                                    const isClickable = !readOnly;

                                    return (
                                        <div
                                            key={classLevel}
                                            className={`grid grid-cols-3 gap-2 text-sm py-1 px-2 rounded transition-colors ${isActive
                                                ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                                                : hasSpells
                                                    ? 'bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                } ${isClickable ? 'cursor-pointer' : ''
                                                }`}
                                            onClick={isClickable ? () => onLevelClick(classLevel) : undefined}
                                        >
                                            <div className={`font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {classLevel}
                                            </div>
                                            <div className={`${hasSpells
                                                ? 'text-green-700 dark:text-green-300 font-medium'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {formattedSlots}
                                            </div>
                                            <div className={`text-right ${hasSpells
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-400 dark:text-gray-500'
                                                }`}>
                                                {hasSpells ? totalSlots : '—'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea.Content>
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                        <ScrollArea.Thumb className="Thumb" />
                    </ScrollArea.Scrollbar>
                </ScrollArea.Root>
            </div>
        </div>
    );
};
