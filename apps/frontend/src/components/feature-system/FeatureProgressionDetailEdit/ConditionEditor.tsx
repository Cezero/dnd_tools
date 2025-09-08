import React from 'react';

import { ValidatedCustomSelect, ValidatedInput } from '@/components/forms';
import {
    FEATURE_ENTITY_CONDITION_SELECT_LIST,
    ATTACK_TYPE_SELECT_LIST,
    SIZE_SELECT_LIST,
    SPELL_SCHOOL_SELECT_LIST,
    CREATURE_TYPE_SELECT_LIST,
    SOURCE_TYPE_SELECT_LIST,
    FeatureEntityConditionType
} from '@shared/static-data';

import type { ConditionEditorProps } from './types';

export function ConditionEditor({
    index,
    conditions,
    onAddCondition,
    onRemoveCondition
}: ConditionEditorProps) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Conditions</span>
                <button
                    type="button"
                    onClick={onAddCondition}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Add Condition
                </button>
            </div>

            {conditions.length === 0 ? (
                <p className="text-gray-500 text-sm">No conditions added</p>
            ) : (
                <div className="space-y-2">
                    {conditions.map((condition, conditionIndex) => (
                        <div key={conditionIndex} className="flex items-center gap-2 p-2 border border-gray-200 rounded dark:border-gray-600">
                            <ValidatedCustomSelect
                                field={`entities.${index}.conditions.${conditionIndex}.conditionType`}
                                label=""
                                options={FEATURE_ENTITY_CONDITION_SELECT_LIST}
                                placeholder="Condition type"
                                componentExtraClassName="flex-1"
                                nested
                            />
                            {condition.conditionType === FeatureEntityConditionType.character_size ? (
                                <ValidatedCustomSelect
                                    field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                    label=""
                                    options={SIZE_SELECT_LIST}
                                    placeholder="Select size"
                                    componentExtraClassName="flex-1"
                                    nested
                                />
                            ) : condition.conditionType === FeatureEntityConditionType.attack_type ? (
                                <ValidatedCustomSelect
                                    field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                    label=""
                                    options={ATTACK_TYPE_SELECT_LIST}
                                    placeholder="Select attack type"
                                    componentExtraClassName="flex-1"
                                    nested
                                />
                            ) : condition.conditionType === FeatureEntityConditionType.spell_school ? (
                                <ValidatedCustomSelect
                                    field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                    label=""
                                    options={SPELL_SCHOOL_SELECT_LIST}
                                    placeholder="Select spell school"
                                    componentExtraClassName="flex-1"
                                    nested
                                />
                            ) : condition.conditionType === FeatureEntityConditionType.creature_type ? (
                                <ValidatedCustomSelect
                                    field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                    label=""
                                    options={CREATURE_TYPE_SELECT_LIST}
                                    placeholder="Select creature type"
                                    componentExtraClassName="flex-1"
                                    nested
                                />
                            ) : condition.conditionType === FeatureEntityConditionType.source ? (
                                <ValidatedCustomSelect
                                    field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                    label=""
                                    options={SOURCE_TYPE_SELECT_LIST}
                                    placeholder="Select source"
                                    componentExtraClassName="flex-1"
                                    nested
                                />
                            ) : (
                                <ValidatedInput
                                    field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                    label=""
                                    type="text"
                                    placeholder="Condition value"
                                    componentExtraClassName="flex-1"
                                    nested
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => onRemoveCondition(conditionIndex)}
                                className="text-red-500 hover:text-red-700 text-sm px-2"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
