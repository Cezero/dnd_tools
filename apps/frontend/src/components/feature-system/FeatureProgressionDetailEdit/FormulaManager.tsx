import React, { useEffect, useState } from 'react';

import { ValidatedInput, ValidatedCustomSelect, ValidatedCustomCheckbox } from '@/components/forms';
import type { FeatureEntity, FeatureProgression, Feature } from '@shared/schema';
import { ABILITY_LIST, FormulaId, EntityType, ConditionalScalingValueType, CONDITIONAL_SCALING_VALUE_TYPE_LIST, CoreComponent } from '@shared/static-data';

import { ArrayPairEditor } from '../ArrayPairEditor';
import { FormulaPreview } from './FormulaPreview';
import { getAppliesToSelectOptionsSync } from './utils';

interface FormulaManagerProps {
    entity: FeatureEntity;
    index: number;
    entityType: EntityType;
    formData: FeatureProgression;
    setFormData: (data: FeatureProgression | ((prev: FeatureProgression) => FeatureProgression)) => void;
    preSelectedFeature?: Feature;
    progression?: FeatureProgression | null;
}

export function FormulaManager({
    entity,
    index,
    entityType: _entityType,
    formData,
    setFormData,
    preSelectedFeature,
    progression
}: FormulaManagerProps) {
    const [appliesToSelectOptions, setAppliesToSelectOptions] = useState<CoreComponent[]>([]);
    // Use the correct field path for entities
    const entityKey = 'entities';

    // Load appliesToSelectOptions when needed for conditional scaling
    useEffect(() => {
        const loadAppliesToSelectOptions = async () => {
            if (entity.formulaParams?.formulaId === FormulaId.CONDITIONAL_SCALING) {
                const appliesTo = entity.appliesTo;
                const entityType = entity.type;
                if (appliesTo !== null && appliesTo !== undefined) {
                    const options = getAppliesToSelectOptionsSync(appliesTo, entityType);
                    setAppliesToSelectOptions(options);
                } else {
                    setAppliesToSelectOptions([]);
                }
            }
        };
        loadAppliesToSelectOptions();
    }, [entity.formulaParams?.formulaId, entity.appliesTo, entity.type]);

    // Initialize arrays when formula changes to CONDITIONAL_SCALING
    useEffect(() => {
        const currentFormulaId = entity.formulaParams?.formulaId;
        if (currentFormulaId === FormulaId.CONDITIONAL_SCALING) {
            if (!entity.formulaParams?.thresholds || !entity.formulaParams?.values) {
                setFormData(prev => {
                    const entities = [...(prev.entities || [])];
                    entities[index] = {
                        ...entities[index],
                        formulaParams: {
                            ...entities[index].formulaParams,
                            thresholds: entities[index].formulaParams?.thresholds || [],
                            values: entities[index].formulaParams?.values || [],
                        }
                    } as FeatureEntity;
                    return { ...prev, entities };
                });
            }
        }
    }, [entity.formulaParams?.formulaId, index, setFormData]); // eslint-disable-line react-hooks/exhaustive-deps

    // Early return if no formula is selected
    if (!entity.formulaParams?.formulaId) {
        return null;
    }

    const formulaId = entity.formulaParams.formulaId;

    return (
        <div className="border border-gray-200 rounded-md p-2 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/20">
            <h4 className="text-sm font-medium mb-3">Formula Parameters</h4>

            {/* Render different parameter inputs based on formula type */}
            {(() => {
                switch (formulaId) {
                    case FormulaId.LINEAR_SCALING:
                    case FormulaId.EVERY_N_LEVELS:
                    case FormulaId.DICE_SCALING:
                        return (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <ValidatedInput
                                            field={`${entityKey}.${index}.formulaParams.interval`}
                                            label="Interval"
                                            type="number"
                                            min={1}
                                            placeholder="e.g., 2 for every 2 levels"
                                            componentExtraClassName="flex items-center gap-2"
                                            nested
                                        />
                                    </div>
                                    <div>
                                        <ValidatedInput
                                            field={`${entityKey}.${index}.formulaParams.formulaStartLevel`}
                                            label="Formula Start Level (Optional)"
                                            type="number"
                                            min={1}
                                            max={20}
                                            placeholder="e.g., 2 for Fighter bonus feats"
                                            componentExtraClassName="flex items-center gap-2"
                                            nested
                                        />
                                    </div>
                                </div>
                                <div>
                                    <ValidatedCustomCheckbox
                                        field={`${entityKey}.${index}.formulaParams.includeProgressionLevel`}
                                        label="Include Progression Level"
                                        componentExtraClassName="flex items-center gap-2"
                                        nested
                                    />
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        When enabled, includes the progression level in the formula calculation.
                                        Disable for entities that should only appear at formula-determined intervals (e.g., allocation bonuses).
                                    </div>
                                </div>
                            </div>
                        );

                    case FormulaId.ABILITY_BASED:
                    case FormulaId.ABILITY_MODIFIER:
                    case FormulaId.LEVEL_TIMES_ABILITY:
                    case FormulaId.LEVEL_PLUS_ABILITY:
                        return (
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <ValidatedCustomSelect
                                        field={`${entityKey}.${index}.formulaParams.abilityId`}
                                        label="Ability"
                                        options={ABILITY_LIST}
                                        nested
                                    />
                                </div>
                            </div>
                        );

                    case FormulaId.LEVEL_TIMES_VALUE:
                    case FormulaId.VALUE_PLUS_LEVEL:
                        return (
                            <div className="grid grid-cols-1 gap-3">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    No additional parameters needed for this formula type.
                                </div>
                            </div>
                        );

                    case FormulaId.CONDITIONAL_SCALING: {
                        const valuesRepresent = entity.formulaParams?.valuesRepresent;
                        const isAppliesToId = valuesRepresent === ConditionalScalingValueType.AppliesToId;

                        return (
                            <div className="grid grid-cols-1 gap-3">
                                <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                                    <div>
                                        <ArrayPairEditor
                                            thresholds={entity.formulaParams?.thresholds || []}
                                            values={entity.formulaParams?.values || []}
                                            onThresholdsChange={(thresholds) => {
                                                setFormData(prev => {
                                                    const entities = [...(prev.entities || [])];
                                                    entities[index] = {
                                                        ...entities[index],
                                                        formulaParams: {
                                                            ...entities[index].formulaParams,
                                                            thresholds
                                                        }
                                                    } as FeatureEntity;
                                                    return { ...prev, entities };
                                                });
                                            }}
                                            onValuesChange={(values) => {
                                                setFormData(prev => {
                                                    const entities = [...(prev.entities || [])];
                                                    entities[index] = {
                                                        ...entities[index],
                                                        formulaParams: {
                                                            ...entities[index].formulaParams,
                                                            values
                                                        }
                                                    } as FeatureEntity;
                                                    return { ...prev, entities };
                                                });
                                            }}
                                            thresholdPlaceholder="e.g., 4"
                                            valuePlaceholder={isAppliesToId ? "Select option" : "e.g., -2"}
                                            valuesRepresent={isAppliesToId ? 'appliesToId' : 'value'}
                                            appliesToSelectOptions={appliesToSelectOptions}
                                            entityKey={entityKey}
                                            index={index}
                                        />
                                    </div>
                                    <div className="space-y-3 flex flex-col items-start gap-2">
                                        <div>
                                            <ValidatedCustomSelect
                                                field={`${entityKey}.${index}.formulaParams.valuesRepresent`}
                                                label="Values Represent"
                                                options={CONDITIONAL_SCALING_VALUE_TYPE_LIST}
                                                placeholder={valuesRepresent === ConditionalScalingValueType.AppliesToId ? "Applies To ID" : "Value"}
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                        <div>
                                            <ValidatedCustomCheckbox
                                                field={`${entityKey}.${index}.formulaParams.cumulative`}
                                                label="Cumulative"
                                                componentExtraClassName="flex items-center gap-2"
                                                nested
                                            />
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            <strong>Values Represent:</strong> Choose what the values represent (Value for numeric/string values, Applies To ID for enum lookups)<br />
                                            <strong>Cumulative:</strong> When enabled, values accumulate instead of replacing previous ones
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    default:
                        return (
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        No parameters needed for this formula type.
                                    </p>
                                </div>
                            </div>
                        );
                }
            })()}

            {/* Formula Preview */}
            <FormulaPreview
                item={entity}
                progressionLevel={Number(formData.level) || 1}
                featureName={preSelectedFeature?.name || progression?.feature?.name}
            />
        </div>
    );
}
