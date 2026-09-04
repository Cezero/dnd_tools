import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useFormContext, ValidatedCustomSelect, ValidatedInput, CustomCheckbox, SpellSearchInput } from '@/components/forms';
import type { FeatureEntity, FeatureEntityCondition, FeatureWithRelations } from '@shared/schema';
import {
    ENTITY_LIST,
    FEATURE_BONUS_LIST,
    EntityType,
    EntityAppliesToType,
    FeatureEntityConditionType,
    ENTITY_TYPE_COMPATIBILITY,
    FORMULA_LIST,
    FormulaId,
} from '@shared/static-data';

import { AppliesToSelector } from './AppliesToSelector';
import { ConditionEditor } from './ConditionEditor';
import { FormulaManager } from './FormulaManager';
import type { BaseFormProps } from './types';
import { getAppliesToSubIdSelectOptions, useProficiencySubIdOptions, shouldShowValue, shouldShowFormula } from './utils';

export function EntityDetailForm({ index, preSelectedFeature: _preSelectedFeature, feature: _feature, editionId }: BaseFormProps) {
    const { formData, setFormData } = useFormContext();
    const entities = useMemo(() =>
        formData.entities as FeatureEntity[] || [],
        [formData]
    );
    const entity = entities[index];

    const [showConditions, setShowConditions] = useState((entity.conditions && entity.conditions.length > 0) || false);
    const prevAppliesToRef = useRef<number | null>(null);
    const prevEntityTypeRef = useRef<number | null>(null);

    // Determine visibility of value and formula fields
    // Formula visibility is based on EntityType/EntityAppliesToType combination only
    // (not on whether a formula is currently selected, to allow creating new entities with formulas)
    const showFormula = useMemo(() => {
        return shouldShowFormula(
            entity.type,
            entity.appliesTo,
            null, // formulaId not needed for visibility logic
            null  // valuesRepresent not needed for visibility logic
        );
    }, [entity.type, entity.appliesTo]);

    // Value visibility is based on combination, but also checks AppliesToId exception
    // when a formula is selected (so we need formulaId/valuesRepresent for exception case)
    const showValue = useMemo(() => {
        return shouldShowValue(
            entity.type,
            entity.appliesTo,
            entity.formulaParams?.formulaId ?? null,
            entity.formulaParams?.valuesRepresent ?? null
        );
    }, [entity.type, entity.appliesTo, entity.formulaParams?.formulaId, entity.formulaParams?.valuesRepresent]);

    // Get proficiency subId options if this is a proficiency entity
    // Both Base and Other types can be used with Proficiency
    const isProficiencyEntity = (entity.type === EntityType.Other || entity.type === EntityType.Base) && entity.appliesTo === EntityAppliesToType.Proficiency;
    const proficiencySubIdOptions = useProficiencySubIdOptions(isProficiencyEntity ? entity : undefined, entity.appliesToId);

    // Check if this is a SpellbookSpell entity (EntityType.Other + EntityAppliesToType.SpellbookSpell)
    const isSpellbookSpellEntity = entity.type === EntityType.Other && entity.appliesTo === EntityAppliesToType.SpellbookSpell;

    // Prepare custom options and filter for SpellbookSpell entities (always call hooks, conditionally use)
    const spellbookSpellCustomOptions = useMemo(() => [
        { id: -1, name: 'All', editionId: 0 }
    ], []);

    const spellbookSpellLevelFilter = useMemo(() => {
        if (!isSpellbookSpellEntity) {
            return undefined;
        }
        const spellLevel = entity.appliesToId;
        if (spellLevel === null || spellLevel === undefined) {
            return undefined;
        }
        // Filter spells by baseLevel matching the selected spell level
        return (spell: { baseLevel?: number; id: number; name: string; editionId: number }) => {
            return spell.baseLevel === spellLevel;
        };
    }, [isSpellbookSpellEntity, entity.appliesToId]);


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

    // Clear bonusType when entityType changes away from Bonus
    useEffect(() => {
        if (!entity) return;

        const currentType = entity.type;
        const prevType = prevEntityTypeRef.current;

        if (prevType !== null &&
            prevType !== undefined &&
            currentType !== prevType &&
            prevType === EntityType.Bonus &&
            currentType !== EntityType.Bonus) {
            // Switching away from Bonus type - clear bonusType
            setFormData(prev => ({
                ...prev,
                entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                    i === index ? { ...ent, bonusType: null } : ent
                )
            }));
        }
        prevEntityTypeRef.current = currentType;
    }, [entity?.type, entity, index, setFormData]);

    // Clear value when switching to combinations that don't use value
    useEffect(() => {
        if (!entity) return;

        const shouldShow = shouldShowValue(
            entity.type,
            entity.appliesTo,
            entity.formulaParams?.formulaId ?? null,
            entity.formulaParams?.valuesRepresent ?? null
        );

        // If value field should be hidden and value is set, clear it
        if (!shouldShow && entity.value !== null && entity.value !== 0) {
            setFormData(prev => ({
                ...prev,
                entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                    i === index ? { ...ent, value: null } : ent
                )
            }));
        }
    }, [entity?.type, entity?.appliesTo, entity?.formulaParams?.formulaId, entity?.formulaParams?.valuesRepresent, entity?.value, entity, index, setFormData]);

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
            <div className="flex items-center gap-2">
                <div>
                    <ValidatedCustomSelect
                        field={`entities.${index}.type`}
                        label="Type"
                        required
                        options={ENTITY_LIST}
                        placeholder="Select type"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                {showValue && (
                    <div>
                        <ValidatedInput
                            field={`entities.${index}.value`}
                            label={entity.formulaParams?.formulaId === FormulaId.EVERY_N_LEVELS ? "Scaling Value" : "Value"}
                            type="number"
                            componentExtraClassName="flex items-center gap-2"
                            inputExtraClassName="w-16 p-1"
                            nested
                        />
                    </div>
                )}
                {showFormula && (
                    <div>
                        <ValidatedCustomSelect
                            field={`entities.${index}.formulaParams.formulaId`}
                            label="Formula"
                            options={FORMULA_LIST}
                            placeholder="Select"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                )}
                <div>
                    <AppliesToSelector
                        index={index}
                        appliesTo={entity.appliesTo}
                        entityType={entity.type}
                        formulaId={entity.formulaParams?.formulaId ?? null}
                        valuesRepresent={entity.formulaParams?.valuesRepresent ?? null}
                        editionId={editionId}
                    />
                </div>
            </div>


            {/* Bonus Type - only show for Bonus entity type */}
            {(entity.type === EntityType.Bonus || entity.type === EntityType.Companion) && (
                <ValidatedCustomSelect
                    field={`entities.${index}.bonusType`}
                    label="Bonus Type"
                    options={FEATURE_BONUS_LIST}
                    placeholder="Select bonus type"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            )}

            {/* Common fields for all entity types */}
            <div className="grid grid-cols-2 gap-2">
                {/* Applies To Sub ID - only show for specific combinations */}
                {(() => {
                    // For SpellbookSpell entities, show SpellSearchInput with "All" option and level filter
                    if (isSpellbookSpellEntity) {
                        return (
                            <SpellSearchInput
                                value={entity.appliesToSubId}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                            i === index ? { ...ent, appliesToSubId: value } : ent
                                        )
                                    }));
                                }}
                                label="Spells"
                                placeholder="Search for a spell or select 'All'..."
                                componentExtraClassName="flex items-center gap-2"
                                customOptions={spellbookSpellCustomOptions}
                                filter={spellbookSpellLevelFilter}
                            />
                        );
                    }

                    const subIdOptions = getAppliesToSubIdSelectOptions(entity.appliesTo, entity.appliesToId);
                    const shouldShowAppliesToSubId = isProficiencyEntity || subIdOptions.length > 0;

                    if (shouldShowAppliesToSubId) {
                        // For proficiency entities (Base or Other type), always use dropdown with items
                        if (isProficiencyEntity) {
                            return (
                                <ValidatedCustomSelect
                                    field={`entities.${index}.appliesToSubId`}
                                    label="Item"
                                    options={proficiencySubIdOptions.options}
                                    placeholder={proficiencySubIdOptions.isLoading ? 'Loading items...' : 'Select item...'}
                                    componentExtraClassName="flex items-center gap-2"
                                    nested
                                />
                            );
                        }

                        // For other types (like Craft/Knowledge skills, Attack bonuses), use existing logic
                        if (subIdOptions.length > 0) {
                            const label = entity.appliesTo === EntityAppliesToType.Attack
                                ? "Attack Bonus Applies To"
                                : entity.appliesTo === EntityAppliesToType.SavingThrow
                                    ? "Feature Type"
                                    : "Applies To Sub ID";
                            return (
                                <ValidatedCustomSelect
                                    field={`entities.${index}.appliesToSubId`}
                                    label={label}
                                    options={subIdOptions}
                                    placeholder="Select subtype..."
                                    componentExtraClassName="flex items-center gap-2"
                                    nested
                                />
                            );
                        } else {
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
                    }
                    return null;
                })()}

            </div>

            {/* Formula Manager */}
            <FormulaManager
                index={index}
                entityType={entity.type}
                entity={entity}
                formData={formData as FeatureWithRelations}
                setFormData={setFormData as (data: FeatureWithRelations | ((prev: FeatureWithRelations) => FeatureWithRelations)) => void}
            />

            {/* Display Control */}
            <div className="flex flex-col gap-2">
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
                <div className="flex items-center gap-2">
                    <CustomCheckbox
                        id={`showFullProgression-${index}`}
                        checked={entity.showFullProgression === true}
                        onCheckedChange={(checked) => {
                            setFormData(prev => ({
                                ...prev,
                                entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                    i === index ? { ...ent, showFullProgression: checked } : ent
                                )
                            }));
                        }}
                        label="Show Full Progression"
                        labelClassName="text-sm font-medium"
                        componentExtraClassName=""
                    />
                    <span className="text-xs text-gray-500">
                        Show every level (formula start–20) in previews instead of only transition levels
                    </span>
                </div>
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
