import React from 'react';

import { ValidatedInput, ValidatedCustomSelect } from '@/components/forms';
import { ABILITY_SELECT_LIST, FormulaId } from '@shared/static-data';

import { ArrayPairEditor } from '../ArrayPairEditor';
import type { FormulaParamsEditorProps } from './types';

export function FormulaParamsEditor({
    formulaId,
    index,
    entityType,
    thresholds,
    values,
    onThresholdsChange,
    onValuesChange
}: FormulaParamsEditorProps) {
    // Render different parameter inputs based on formula type
    switch (formulaId) {
        case FormulaId.LINEAR_SCALING:
        case FormulaId.EVERY_N_LEVELS:
        case FormulaId.DICE_SCALING:
            return (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <ValidatedInput
                            field={`${entityType}.${index}.formulaParams.interval`}
                            label="Interval"
                            type="number"
                            min={1}
                            placeholder="e.g., 3 for every 3 levels"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                    <div>
                        <ValidatedInput
                            field={`${entityType}.${index}.formulaParams.formulaStartLevel`}
                            label="Formula Start Level (Optional)"
                            type="number"
                            min={1}
                            max={20}
                            placeholder="e.g., 8 for Bard Inspire Courage"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                </div>
            );

        case FormulaId.ABILITY_BASED:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <div>
                        <ValidatedCustomSelect
                            field={`${entityType}.${index}.formulaParams.abilityId`}
                            label="Ability"
                            options={ABILITY_SELECT_LIST}
                            placeholder="Select ability"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        Base value will use the modifier's "Value" field above
                    </div>
                </div>
            );

        case FormulaId.ABILITY_MODIFIER:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <div>
                        <ValidatedCustomSelect
                            field={`${entityType}.${index}.formulaParams.abilityId`}
                            label="Ability"
                            options={ABILITY_SELECT_LIST}
                            placeholder="Select ability"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                </div>
            );

        case FormulaId.LEVEL_TIMES_ABILITY:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <div>
                        <ValidatedCustomSelect
                            field={`${entityType}.${index}.formulaParams.abilityId`}
                            label="Ability"
                            options={ABILITY_SELECT_LIST}
                            placeholder="Select ability"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                </div>
            );

        case FormulaId.LEVEL_TIMES_VALUE:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        No parameters needed. Base value will use the modifier's "Value" field above.
                    </div>
                </div>
            );

        case FormulaId.VALUE_PLUS_LEVEL:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        No parameters needed. Fixed value will use the modifier's "Value" field above.
                    </div>
                </div>
            );

        case FormulaId.LEVEL_PLUS_ABILITY:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <div>
                        <ValidatedCustomSelect
                            field={`${entityType}.${index}.formulaParams.abilityId`}
                            label="Ability"
                            options={ABILITY_SELECT_LIST}
                            placeholder="Select ability"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        Formula will calculate: level + ability modifier
                    </div>
                </div>
            );

        case FormulaId.CONDITIONAL_SCALING:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <ArrayPairEditor
                        thresholds={thresholds || []}
                        values={values || []}
                        onThresholdsChange={onThresholdsChange}
                        onValuesChange={onValuesChange}
                        thresholdPlaceholder="e.g., 4"
                        valuePlaceholder="e.g., -2"
                    />
                </div>
            );

        default:
            return (
                <div className="grid grid-cols-1 gap-2">
                    <div>
                        <p className="text-xs text-red-600 dark:text-red-400">Unknown formula type</p>
                    </div>
                </div>
            );
    }
}
