import React from 'react';

import { CustomCheckbox } from '@/components/forms';

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
            <h3 className="text-lg font-medium mb-3">Feature Components</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select which components this feature feature provides:
            </p>
            <div className="flex flex-wrap gap-4">
                <CustomCheckbox
                    checked={hasModifiers}
                    onCheckedChange={onModifierToggle}
                    label={`Modifiers (${modifierCount})`}
                    labelClassName="text-sm font-medium"
                    componentExtraClassName=""
                />
                <CustomCheckbox
                    checked={hasChoices}
                    onCheckedChange={onChoiceToggle}
                    label={`Choices (${choiceCount})`}
                    labelClassName="text-sm font-medium"
                    componentExtraClassName=""
                />
            </div>
        </div>
    );
}
