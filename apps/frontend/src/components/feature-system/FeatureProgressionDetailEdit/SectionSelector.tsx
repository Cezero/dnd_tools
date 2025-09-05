import React from 'react';

import type { SectionSelectorProps } from './types';

export function SectionSelector({
    hasModifiers,
    hasChoices,
    modifierCount,
    choiceCount,
    onModifierToggle,
    onChoiceToggle
}: SectionSelectorProps) {
    return (
        <div className="border border-gray-200 dark:border-gray-600 rounded-md p-4 bg-gray-50 dark:bg-gray-700/20">
            <h3 className="text-lg font-medium mb-3">Progression Components</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select which components this feature progression provides:
            </p>
            <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={hasModifiers}
                        onChange={(e) => onModifierToggle(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium">Modifiers</span>
                    <span className="text-xs text-gray-500">({modifierCount})</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={hasChoices}
                        onChange={(e) => onChoiceToggle(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium">Choices</span>
                    <span className="text-xs text-gray-500">({choiceCount})</span>
                </label>
            </div>
        </div>
    );
}
