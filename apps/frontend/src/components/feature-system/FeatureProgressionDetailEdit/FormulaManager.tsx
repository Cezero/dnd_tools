import React, { useEffect } from 'react';

import { ValidatedInput, ValidatedCustomSelect, ValidatedCustomCheckbox } from '@/components/forms';
import type { FeatureModifier, FeatureChoice, FeatureProgression, Feature } from '@shared/schema';
import { ABILITY_SELECT_LIST, FormulaId, FeatureType, FEATURE_TYPES, CumulativeValueType, CUMULATIVE_VALUE_TYPE_SELECT_LIST } from '@shared/static-data';

import { ArrayPairEditor } from '../ArrayPairEditor';
import { FormulaPreview } from './FormulaPreview';
import { getAppliesToSelectOptions } from './utils';

interface FormulaManagerProps<T extends FeatureModifier | FeatureChoice> {
    entity: T;
    index: number;
    entityType: FeatureType;
    formData: Partial<FeatureProgression>;
    setFormData: (data: Partial<FeatureProgression> | ((prev: Partial<FeatureProgression>) => Partial<FeatureProgression>)) => void;
    preSelectedFeature?: Feature;
    progression?: FeatureProgression | null;
}

export function FormulaManager<T extends FeatureModifier | FeatureChoice>({
    entity,
    index,
    entityType,
    formData,
    setFormData,
    preSelectedFeature,
    progression
}: FormulaManagerProps<T>) {
    // Get the string key from FEATURE_TYPES
    const entityKey = FEATURE_TYPES[entityType].name;

    // Initialize arrays when formula changes to CONDITIONAL_SCALING
    useEffect(() => {
        const currentFormulaId = entity.formulaParams?.formulaId;
        if (currentFormulaId === FormulaId.CONDITIONAL_SCALING) {
            if (!entity.formulaParams?.thresholds || !entity.formulaParams?.values) {
                setFormData(prev => {
                    const entities = [...(prev[entityKey] || [])];
                    entities[index] = {
                        ...entities[index],
                        formulaParams: {
                            ...entities[index].formulaParams,
                            thresholds: entities[index].formulaParams?.thresholds || [],
                            values: entities[index].formulaParams?.values || [],
                        }
                    } as T;
                    return { ...prev, [entityKey]: entities };
                });
            }
        }
    }, [entity.formulaParams?.formulaId, index, entity.formulaParams?.thresholds, entity.formulaParams?.values, setFormData, entityKey]);

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
                                        options={ABILITY_SELECT_LIST}
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
                        // Get the appropriate select options based on appliesTo type
                        const appliesTo = (entity as FeatureModifier).appliesTo;
                        const modifierType = (entity as FeatureModifier).type;
                        const appliesToSelectOptions = getAppliesToSelectOptions(appliesTo, modifierType);
                        const valuesRepresent = entity.formulaParams?.valuesRepresent;
                        const isAppliesToId = valuesRepresent === CumulativeValueType.AppliesToId;

                        return (
                            <div className="grid grid-cols-1 gap-3">
                                <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                                    <div>
                                        <ArrayPairEditor
                                            thresholds={entity.formulaParams?.thresholds || []}
                                            values={entity.formulaParams?.values || []}
                                            onThresholdsChange={(thresholds) => {
                                                setFormData(prev => {
                                                    const entities = [...(prev[entityKey] || [])];
                                                    entities[index] = {
                                                        ...entities[index],
                                                        formulaParams: {
                                                            ...entities[index].formulaParams,
                                                            thresholds
                                                        }
                                                    } as T;
                                                    return { ...prev, [entityKey]: entities };
                                                });
                                            }}
                                            onValuesChange={(values) => {
                                                setFormData(prev => {
                                                    const entities = [...(prev[entityKey] || [])];
                                                    entities[index] = {
                                                        ...entities[index],
                                                        formulaParams: {
                                                            ...entities[index].formulaParams,
                                                            values
                                                        }
                                                    } as T;
                                                    return { ...prev, [entityKey]: entities };
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
                                                options={CUMULATIVE_VALUE_TYPE_SELECT_LIST}
                                                placeholder={valuesRepresent === CumulativeValueType.AppliesToId ? "Applies To ID" : "Value"}
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
