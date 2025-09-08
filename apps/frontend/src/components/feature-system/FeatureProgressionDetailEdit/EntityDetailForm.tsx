import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useFormContext, ValidatedCustomSelect, ValidatedInput, CustomCheckbox } from '@/components/forms';
import { FeatApi } from '@/features/feat/FeatApi';
import type { FeatureEntity, FeatureEntityCondition, FeatureProgression } from '@shared/schema';
import {
    ENTITY_TYPE_SELECT_LIST,
    FEATURE_BONUS_SELECT_LIST,
    EntityType,
    EntityAppliesToType,
    FeatureEntityConditionType,
    ENTITY_TYPE_COMPATIBILITY,
    FEATURE_ENTITY_CONDITION_SELECT_LIST,
    ATTACK_TYPE_SELECT_LIST,
    FORMULA_SELECT_LIST,
    SIZE_SELECT_LIST,
    SPELL_SCHOOL_SELECT_LIST,
    CREATURE_TYPE_SELECT_LIST,
    SOURCE_TYPE_SELECT_LIST,
    TARGET_TYPE_SELECT_LIST,
} from '@shared/static-data';

import { AppliesToSelector } from './AppliesToSelector';
import { FormulaManager } from './FormulaManager';
import type { BaseFormProps } from './types';

export function EntityDetailForm({ index, preSelectedFeature: _preSelectedFeature, progression: _progression }: BaseFormProps) {
    const { formData, setFormData } = useFormContext();
    const entities = useMemo(() =>
        formData.entities as FeatureEntity[] || [],
        [formData]
    );
    const entity = entities[index];

    const [showConditions, setShowConditions] = useState((entity.conditions && entity.conditions.length > 0) || false);
    const prevAppliesToRef = useRef<number | null>(null);


    // Update showConditions when entity changes
    useEffect(() => {
        setShowConditions((entity.conditions && entity.conditions.length > 0) || false);
    }, [entity.conditions]);

    // Clear appliesTo when entityType changes to an incompatible type
    useEffect(() => {
        const currentEntity = entities[index];
        if (currentEntity && currentEntity.type !== undefined && currentEntity.appliesTo !== null) {
            const compatibleTypes = ENTITY_TYPE_COMPATIBILITY[currentEntity.type as EntityType] || [];
            const isValid = (compatibleTypes as number[]).includes(currentEntity.appliesTo as number);
            if (!isValid) {
                setFormData(prev => ({
                    ...prev,
                    entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                        i === index ? { ...ent, appliesTo: null, appliesToId: null } : ent
                    )
                }));
            }
        }
    }, [entity?.type, index, entities, setFormData]);

    // Clear appliesToId when appliesTo changes
    useEffect(() => {
        if (!entity) return;

        const currentAppliesTo = entity.appliesTo;
        const prevAppliesTo = prevAppliesToRef.current;

        if (prevAppliesTo !== null &&
            prevAppliesTo !== undefined &&
            currentAppliesTo !== prevAppliesTo &&
            currentAppliesTo !== undefined &&
            currentAppliesTo !== null) {
            setFormData(prev => ({
                ...prev,
                entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                    i === index ? { ...ent, appliesToId: null } : ent
                )
            }));
        }
        prevAppliesToRef.current = currentAppliesTo;
    }, [entity?.appliesTo, entity, index, setFormData]);

    // Smart fetching: Load full entity data when appliesTo/appliesToId changes
    useEffect(() => {
        const fetchFullEntityData = async () => {
            if (!entity.appliesToId) return;

            try {
                if (entity.appliesTo === EntityAppliesToType.Feat) {
                    // Check if we already have full feat data
                    if (entity.feat && entity.feat.id === entity.appliesToId) {
                        return; // Already have the full data
                    }

                    // Fetch full feat data
                    const featData = await FeatApi.getFeatById(entity.appliesToId);
                    if (featData) {
                        setFormData(prev => ({
                            ...prev,
                            entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                i === index ? { ...ent, feat: featData } : ent
                            )
                        }));
                    }
                }
                // Add other entity type fetching logic as needed
            } catch (error) {
                console.error('Failed to fetch full entity data:', error);
            }
        };

        fetchFullEntityData();
    }, [entity.appliesTo, entity.appliesToId, entity.feat, index, setFormData]);


    // Safety check - if entity doesn't exist, don't render
    if (!entity) {
        return null;
    }

    // Helper functions for conditions
    const addCondition = () => {
        const newCondition: FeatureEntityCondition = {
            id: 0, // Will be set by backend
            featureEntityId: 0, // Will be set by backend
            conditionType: FeatureEntityConditionType.character_size,
            conditionValue: 1,
        };
        setFormData(prev => ({
            ...prev,
            entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                i === index ? {
                    ...ent,
                    conditions: [...(ent.conditions || []), newCondition]
                } : ent
            )
        }));
    };

    const removeCondition = (conditionIndex: number) => {
        setFormData(prev => ({
            ...prev,
            entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                i === index ? {
                    ...ent,
                    conditions: (ent.conditions || []).filter((_, ci) => ci !== conditionIndex)
                } : ent
            )
        }));
    };

    return (
        <div className="space-y-2">

            {/* Main entity fields in a compact grid */}
            <div className="grid grid-cols-[1fr_.75fr_1.5fr_1.5fr] gap-2">
                <div>
                    <ValidatedCustomSelect
                        field={`entities.${index}.type`}
                        label="Type"
                        required
                        options={ENTITY_TYPE_SELECT_LIST}
                        placeholder="Select type"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <ValidatedInput
                        field={`entities.${index}.value`}
                        label="Value"
                        type="number"
                        componentExtraClassName="flex items-center gap-2"
                        inputExtraClassName="w-16"
                        nested
                    />
                </div>
                <div>
                    <ValidatedCustomSelect
                        field={`entities.${index}.formulaParams.formulaId`}
                        label="Formula"
                        options={FORMULA_SELECT_LIST}
                        placeholder="Select"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    <AppliesToSelector
                        index={index}
                        appliesTo={entity.appliesTo}
                        entityType={entity.type}
                    />
                </div>
            </div>


            {/* Bonus Type for modifiers - hide for Choice and Allocation types */}
            {entity.type !== EntityType.Choice && entity.type !== EntityType.Allocation && (
                <ValidatedCustomSelect
                    field={`entities.${index}.bonusType`}
                    label="Bonus Type"
                    options={FEATURE_BONUS_SELECT_LIST}
                    placeholder="Select bonus type"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            )}

            {/* Common fields for all entity types */}
            <div className="grid grid-cols-2 gap-2">
                {/* Applies To Sub ID - only show for specific combinations */}
                {(() => {
                    const shouldShowAppliesToSubId = entity.type === EntityType.Proficiency && entity.appliesTo === EntityAppliesToType.Feat;

                    if (shouldShowAppliesToSubId) {
                        return (
                            <ValidatedInput
                                field={`entities.${index}.appliesToSubId`}
                                label="Applies To Sub ID"
                                type="number"
                                componentExtraClassName="flex items-center gap-2"
                                nested
                            />
                        );
                    }
                    return null;
                })()}

            </div>

            {/* Formula Manager */}
            <FormulaManager
                index={index}
                entityType={entity.type}
                entity={entity}
                formData={formData as FeatureProgression}
                setFormData={setFormData as (data: FeatureProgression | ((prev: FeatureProgression) => FeatureProgression)) => void}
            />

            {/* Display Control */}
            <div className="flex items-center gap-2">
                <CustomCheckbox
                    id={`displayInDetail-${index}`}
                    checked={entity.displayInDetail !== false}
                    onCheckedChange={(checked) => {
                        setFormData(prev => ({
                            ...prev,
                            entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                i === index ? { ...ent, displayInDetail: checked } : ent
                            )
                        }));
                    }}
                    label="Show in Detail View"
                    labelClassName="text-sm font-medium"
                    componentExtraClassName=""
                />
                <span className="text-xs text-gray-500">
                    Uncheck to hide this entity from class/race detail pages
                </span>
            </div>

            {/* Conditions */}
            <div className="flex items-center gap-2">
                <CustomCheckbox
                    id={`conditions-${index}`}
                    checked={showConditions}
                    onCheckedChange={(checked) => {
                        setShowConditions(checked);
                        if (!checked) {
                            setFormData(prev => ({
                                ...prev,
                                entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                    i === index ? { ...ent, conditions: [] } : ent
                                )
                            }));
                        }
                    }}
                    label="Conditions"
                    labelClassName="text-sm font-medium"
                    componentExtraClassName=""
                />
            </div>

            {showConditions && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Conditions</span>
                        <button
                            type="button"
                            onClick={addCondition}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Add Condition
                        </button>
                    </div>

                    {(entity.conditions || []).length === 0 ? (
                        <p className="text-gray-500 text-sm">No conditions added</p>
                    ) : (
                        <div className="space-y-2">
                            {(entity.conditions || []).map((condition: FeatureEntityCondition, conditionIndex: number) => (
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
                                    ) : condition.conditionType === FeatureEntityConditionType.target ? (
                                        <ValidatedCustomSelect
                                            field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={TARGET_TYPE_SELECT_LIST}
                                            placeholder="Select target"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : (
                                        <ValidatedInput
                                            field={`entities.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            placeholder="Condition value"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeCondition(conditionIndex)}
                                        className="text-red-500 hover:text-red-700 text-sm px-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
