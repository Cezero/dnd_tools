import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useFormContext, ValidatedCustomSelect, ValidatedInput, CustomCheckbox, SpellSearchInput } from '@/components/forms';
import type { FeatureEntity, FeatureEntityCondition, FeatureProgression } from '@shared/schema';
import {
    ENTITY_LIST,
    FEATURE_BONUS_LIST,
    EntityType,
    EntityAppliesToType,
    FeatureEntityConditionType,
    ENTITY_TYPE_COMPATIBILITY,
    FORMULA_LIST,
} from '@shared/static-data';

import { AppliesToSelector } from './AppliesToSelector';
import { ConditionEditor } from './ConditionEditor';
import { FormulaManager } from './FormulaManager';
import type { BaseFormProps } from './types';
import { getAppliesToSubIdSelectOptions, useProficiencySubIdOptions } from './utils';

export function EntityDetailForm({ index, preSelectedFeature: _preSelectedFeature, progression: _progression }: BaseFormProps) {
    const { formData, setFormData } = useFormContext();
    const entities = useMemo(() =>
        formData.entities as FeatureEntity[] || [],
        [formData]
    );
    const entity = entities[index];

    const [showConditions, setShowConditions] = useState((entity.conditions && entity.conditions.length > 0) || false);
    const prevAppliesToRef = useRef<number | null>(null);

    // Get proficiency subId options if this is a proficiency entity
    const isProficiencyWithFeat = entity.type === EntityType.Other && entity.appliesTo === EntityAppliesToType.Proficiency;
    const proficiencySubIdOptions = useProficiencySubIdOptions(isProficiencyWithFeat ? entity : undefined, entity.appliesToId);

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
                    // Feat data is no longer included in entity - use cache lookups when needed
                    // This is handled by formatters and other components via cache helpers
                } else if (entity.appliesTo === EntityAppliesToType.WeaponFamiliarity) {
                    // Check if we already have full weapon data
                    if (entity.item && entity.item.id === entity.appliesToId) {
                        return; // Already have the full data
                    }

                    // For now, we'll skip the API call and let the component handle data fetching
                    // This should be refactored to use query hooks at the component level
                    console.log('Item data fetching should be handled by query hooks at component level');
                } else if (entity.appliesTo === EntityAppliesToType.Domain) {
                    // Check if we already have full domain data
                    if (entity.domain && entity.domain.id === entity.appliesToId) {
                        return; // Already have the full data
                    }

                    // For now, we'll skip the API call and let the component handle data fetching
                    // This should be refactored to use query hooks at the component level
                    console.log('Domain data fetching should be handled by query hooks at component level');
                }
                // Add other entity type fetching logic as needed
            } catch (error) {
                console.error('Failed to fetch full entity data:', error);
            }
        };

        fetchFullEntityData();
    }, [entity.appliesTo, entity.appliesToId, entity.feat, entity.item, entity.domain, index, setFormData]);


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
                <div>
                    <ValidatedInput
                        field={`entities.${index}.value`}
                        label="Value"
                        type="number"
                        componentExtraClassName="flex items-center gap-2"
                        inputExtraClassName="w-16 p-1"
                        nested
                    />
                </div>
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
                    const shouldShowAppliesToSubId = isProficiencyWithFeat || subIdOptions.length > 0;

                    if (shouldShowAppliesToSubId) {
                        // For proficiency entities, always use dropdown with items
                        if (isProficiencyWithFeat) {
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
