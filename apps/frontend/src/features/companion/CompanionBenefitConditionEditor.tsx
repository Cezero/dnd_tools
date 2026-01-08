import React from 'react';

import { ValidatedCustomSelect, ValidatedInput, useFormContext } from '@/components/forms';
import type { CompanionBenefitCondition } from '@shared/schema';
import {
    ATTACK_TYPE_LIST,
    SIZE_LIST,
    SPELL_SCHOOL_LIST,
    CREATURE_TYPE_LIST,
    CONDITION_SOURCE_TYPE_LIST,
    ENVIRONMENT_TYPE_LIST,
    MATERIAL_TYPE_LIST,
    TARGET_TYPE_LIST,
    FeatureEntityConditionType,
    COMPANION_BENEFIT_CONDITION_LIST,
    CompanionBenefitConditionType,
    LIGHTING_CONDITION_LIST,
} from '@shared/static-data';

interface CompanionBenefitConditionEditorProps {
    index: number; // Benefit index (not used for single benefit forms, but kept for consistency)
    conditions: CompanionBenefitCondition[];
    onAddCondition: () => void;
    onRemoveCondition: (conditionIndex: number) => void;
    fieldPrefix?: string; // Optional prefix for field paths (defaults to 'benefits.{index}')
}

export function CompanionBenefitConditionEditor({
    index,
    conditions,
    onAddCondition,
    onRemoveCondition,
    fieldPrefix
}: CompanionBenefitConditionEditorProps) {
    const { formData } = useFormContext();

    // Determine the field prefix - use provided prefix or default to benefits.{index}
    const basePrefix = fieldPrefix || `benefits.${index}`;

    // Helper to get current condition type from form data
    const getConditionType = (conditionIndex: number): number | null => {
        const conditionPath = `${basePrefix}.${conditionIndex}.conditionType`;
        const pathParts = conditionPath.split('.');
        let value: unknown = formData;
        for (const part of pathParts) {
            if (value && typeof value === 'object') {
                // Handle array indices
                if (Array.isArray(value) && /^\d+$/.test(part)) {
                    value = value[parseInt(part, 10)];
                } else if (part in (value as Record<string, unknown>)) {
                    value = (value as Record<string, unknown>)[part];
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }
        return typeof value === 'number' ? value : null;
    };
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
                    {conditions.map((condition, conditionIndex) => {
                        const currentConditionType = getConditionType(conditionIndex);
                        return (
                            <div key={conditionIndex} className="flex items-center gap-2 p-2 border border-gray-200 rounded dark:border-gray-600">
                                <ValidatedCustomSelect
                                    field={`${basePrefix}.${conditionIndex}.conditionType`}
                                    label=""
                                    options={COMPANION_BENEFIT_CONDITION_LIST}
                                    placeholder="Condition type"
                                    componentExtraClassName="flex-1"
                                    nested
                                />
                                {currentConditionType !== null && currentConditionType !== undefined && (
                                    <>
                                        {currentConditionType === FeatureEntityConditionType.character_size ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={SIZE_LIST}
                                                placeholder="Select size"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === FeatureEntityConditionType.attack_type ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={ATTACK_TYPE_LIST}
                                                placeholder="Select attack type"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === FeatureEntityConditionType.spell_school ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={SPELL_SCHOOL_LIST}
                                                placeholder="Select spell school"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === FeatureEntityConditionType.creature_type ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={CREATURE_TYPE_LIST}
                                                placeholder="Select creature type"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === FeatureEntityConditionType.source ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={CONDITION_SOURCE_TYPE_LIST}
                                                placeholder="Select source"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === FeatureEntityConditionType.material ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={MATERIAL_TYPE_LIST}
                                                placeholder="Select material"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === FeatureEntityConditionType.environment ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={ENVIRONMENT_TYPE_LIST}
                                                placeholder="Select environment"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === FeatureEntityConditionType.target ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={TARGET_TYPE_LIST}
                                                placeholder="Select target"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : currentConditionType === CompanionBenefitConditionType.lighting ? (
                                            <ValidatedCustomSelect
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                options={LIGHTING_CONDITION_LIST}
                                                placeholder="Select lighting condition"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        ) : (
                                            <ValidatedInput
                                                field={`${basePrefix}.${conditionIndex}.conditionValue`}
                                                label=""
                                                type="number"
                                                placeholder="Condition value"
                                                componentExtraClassName="flex-1"
                                                nested
                                            />
                                        )}
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemoveCondition(conditionIndex)}
                                    className="text-red-500 hover:text-red-700 text-sm px-2"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

