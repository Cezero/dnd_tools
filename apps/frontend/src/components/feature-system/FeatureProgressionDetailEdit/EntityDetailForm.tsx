import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useFormContext, ValidatedCustomSelect, ValidatedInput, CustomCheckbox } from '@/components/forms';
import { FeatApi } from '@/features/feat/FeatApi';
import { ItemApi } from '@/features/item/ItemApi';
import type { FeatureEntity, FeatureEntityCondition, FeatureProgression } from '@shared/schema';
import {
    ENTITY_TYPE_SELECT_LIST,
    FEATURE_BONUS_SELECT_LIST,
    EntityType,
    EntityAppliesToType,
    FeatureEntityConditionType,
    ENTITY_TYPE_COMPATIBILITY,
    FORMULA_SELECT_LIST,
} from '@shared/static-data';

import { AppliesToSelector } from './AppliesToSelector';
import { ConditionEditor } from './ConditionEditor';
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
                } else if (entity.appliesTo === EntityAppliesToType.WeaponFamiliarity) {
                    // Check if we already have full weapon data
                    if (entity.item && entity.item.id === entity.appliesToId) {
                        return; // Already have the full data
                    }

                    // Fetch full weapon data
                    const weaponData = await ItemApi.getItemById(undefined, { id: entity.appliesToId });
                    if (weaponData) {
                        setFormData(prev => ({
                            ...prev,
                            entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                i === index ? { ...ent, item: weaponData } : ent
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
    }, [entity.appliesTo, entity.appliesToId, entity.feat, entity.item, index, setFormData]);


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
                <ConditionEditor
                    index={index}
                    conditions={entity.conditions || []}
                    onAddCondition={addCondition}
                    onRemoveCondition={removeCondition}
                />
            )}
        </div>
    );
}
