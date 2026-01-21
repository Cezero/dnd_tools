import React, { useCallback, useMemo } from 'react';

import { SpellcastingProgressionWithSlots, CreateSpellcastingProgressionRequest } from '@shared/schema';

import { SpellSlotGrid } from './SpellSlotGrid';

export interface SpellProgressionEditorProps {
    /** Current spell feature data */
    feature: SpellcastingProgressionWithSlots[];
    /** Callback when feature data changes */
    onProgressionChange: (feature: CreateSpellcastingProgressionRequest[]) => void;
    /** Whether the editor is in read-only mode */
    readOnly?: boolean;
    /** Custom class name for styling */
    className?: string;
    /** Unique identifier for this editor instance */
    editorId?: string;
    /** Original feature data for reset functionality */
    originalProgression: SpellcastingProgressionWithSlots[];
}

export const SpellProgressionEditor: React.FC<SpellProgressionEditorProps> = ({
    feature,
    onProgressionChange,
    readOnly = false,
    className = '',
    editorId = 'default',
    originalProgression
}) => {
    // Convert from database format to editor format
    const editorData = useMemo(() => {
        const data: CreateSpellcastingProgressionRequest[] = [];

        for (let level = 1; level <= 20; level++) {
            const existingProgression = feature.find(p => p.classLevel === level);

            if (existingProgression) {
                data.push({
                    classLevel: level,
                    slots: existingProgression.slots?.map(slot => ({
                        spellLevel: slot.spellLevel,
                        slotsPerDay: slot.slotsPerDay
                    })) || []
                });
            } else {
                data.push({
                    classLevel: level,
                    slots: []
                });
            }
        }

        return data;
    }, [feature]);

    const handleLevelChange = useCallback((level: number, slots: { spellLevel: number; slotsPerDay: number }[]) => {
        const newData = [...editorData];
        newData[level - 1] = { classLevel: level, slots };
        onProgressionChange(newData);
    }, [editorData, onProgressionChange]);

    const handleReset = useCallback(() => {
        // Reset to original feature data
        const originalData = originalProgression.map(prog => ({
            classLevel: prog.classLevel,
            slots: prog.slots?.map(slot => ({
                spellLevel: slot.spellLevel,
                slotsPerDay: slot.slotsPerDay
            })) || []
        }));

        // Fill in any missing levels with empty slots
        const resetData: CreateSpellcastingProgressionRequest[] = [];
        for (let level = 1; level <= 20; level++) {
            const existingLevel = originalData.find(p => p.classLevel === level);
            if (existingLevel) {
                resetData.push(existingLevel);
            } else {
                resetData.push({
                    classLevel: level,
                    slots: []
                });
            }
        }

        onProgressionChange(resetData);
    }, [originalProgression, onProgressionChange]);

    return (
        <div className={`space-y-4 ${className}`}>
            <SpellSlotGrid
                feature={editorData}
                onLevelChange={handleLevelChange}
                readOnly={readOnly}
                gridId={editorId}
            />

            {!readOnly && (
                <div className="flex justify-start">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Reset
                    </button>
                </div>
            )}
        </div>
    );
};
