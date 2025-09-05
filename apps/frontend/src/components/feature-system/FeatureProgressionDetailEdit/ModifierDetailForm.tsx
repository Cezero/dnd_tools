import React, { useState, useEffect, useRef, useMemo } from 'react';

import { useFormContext, ValidatedCustomSelect, ValidatedInput } from '@/components/forms';
import type { FeatureModifier, FeatureModifierCondition } from '@shared/schema';
import {
    MODIFIER_SELECT_LIST,
    FEATURE_BONUS_SELECT_LIST,
    ModifierType,
    ModifierAppliesToType,
    FeatureModifierConditionType,
    MODIFIER_TYPE_COMPATIBILITY,
    FEATURE_MODIFIER_CONDITION_SELECT_LIST,
    ATTACK_TYPE_SELECT_LIST,
    FORMULA_SELECT_LIST,
    SIZE_SELECT_LIST,
    SPELL_SCHOOL_SELECT_LIST,
    CREATURE_TYPE_SELECT_LIST,
    FeatureType
} from '@shared/static-data';

import { AppliesToSelector } from './AppliesToSelector';
import { FormulaManager } from './FormulaManager';
import type { ModifierDetailFormProps } from './types';

export function ModifierDetailForm({ index, feats, featsLoading, preSelectedFeature, progression }: ModifierDetailFormProps) {
    const { formData, setFormData } = useFormContext();
    const modifiers = useMemo(() =>
        formData.modifiers || [],
        [formData]
    );
    const modifier = modifiers[index];

    const [showConditions, setShowConditions] = useState(false);
    const prevAppliesToRef = useRef<number | null>(null);

    // Clear appliesTo when modifierType changes to an incompatible type
    useEffect(() => {
        const currentModifier = modifiers[index];
        if (currentModifier && currentModifier.type !== undefined && currentModifier.appliesTo !== null) {
            const compatibleTypes = MODIFIER_TYPE_COMPATIBILITY[currentModifier.type as ModifierType] || [];
            const isValid = (compatibleTypes as number[]).includes(currentModifier.appliesTo as number);
            if (!isValid) {
                setFormData(prev => ({
                    ...prev,
                    modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                        i === index ? { ...mod, appliesTo: null, appliesToId: null } : mod
                    )
                }));
            }
        }
    }, [modifier?.type, index, modifiers, setFormData]);

    // Clear appliesToId when appliesTo changes
    useEffect(() => {
        if (!modifier) return;

        const currentAppliesTo = modifier.appliesTo;
        const prevAppliesTo = prevAppliesToRef.current;

        if (prevAppliesTo !== null &&
            prevAppliesTo !== undefined &&
            currentAppliesTo !== prevAppliesTo &&
            currentAppliesTo !== undefined &&
            currentAppliesTo !== null) {
            setFormData(prev => ({
                ...prev,
                modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                    i === index ? { ...mod, appliesToId: null } : mod
                )
            }));
        }
        prevAppliesToRef.current = currentAppliesTo;
    }, [modifier?.appliesTo, index, setFormData]);

    // Safety check - if modifier doesn't exist, don't render
    if (!modifier) {
        return null;
    }

    // Helper functions for conditions
    const addCondition = () => {
        const newCondition = {
            conditionType: FeatureModifierConditionType.trigger,
            conditionValue: null,
        };
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                i === index ? {
                    ...mod,
                    conditions: [...(mod.conditions || []), newCondition]
                } : mod
            )
        }));
    };

    const removeCondition = (conditionIndex: number) => {
        setFormData(prev => ({
            ...prev,
            modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                i === index ? {
                    ...mod,
                    conditions: (mod.conditions || []).filter((_, ci) => ci !== conditionIndex)
                } : mod
            )
        }));
    };

    return (
        <div className="space-y-2">
            {/* Main modifier fields in a compact grid */}
            <div className="grid grid-cols-[1fr_.75fr_1.5fr_1.5fr] gap-2">
                <div>
                    <ValidatedCustomSelect
                        field={`modifiers.${index}.type`}
                        label="Type"
                        required
                        options={MODIFIER_SELECT_LIST}
                        placeholder="Select type"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>
                <div>
                    {modifier.type === ModifierType.Replacement && (modifier.appliesTo === ModifierAppliesToType.Damage || modifier.appliesTo === ModifierAppliesToType.UnarmedDamage) ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Damage Dice
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Use formula parameters for progression
                            </p>
                            <input
                                type="text"
                                value="Formula-based"
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    ) : (
                        <ValidatedInput
                            field={`modifiers.${index}.value`}
                            label="Value"
                            type="number"
                            componentExtraClassName="flex items-center gap-2"
                            inputExtraClassName="w-16"
                            nested
                        />
                    )}
                </div>
                <div>
                    <ValidatedCustomSelect
                        field={`modifiers.${index}.formulaParams.formulaId`}
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
                        entityType={FeatureType.Modifier}
                        modifierType={modifier.type}
                        appliesTo={modifier.appliesTo}
                        appliesToId={modifier.appliesToId}
                        onAppliesToChange={() => { }}
                        onAppliesToIdChange={() => { }}
                    />
                </div>
            </div>

            {/* Formula Parameters Section */}
            <FormulaManager
                entity={modifier}
                index={index}
                entityType={FeatureType.Modifier}
                formData={formData}
                setFormData={setFormData}
                preSelectedFeature={preSelectedFeature}
                progression={progression}
            />

            {/* Optional fields in a second row */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <ValidatedCustomSelect
                        field={`modifiers.${index}.bonusType`}
                        label="Bonus Type"
                        options={FEATURE_BONUS_SELECT_LIST}
                        placeholder="Select"
                        componentExtraClassName="flex items-center gap-2"
                        nested
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id={`conditions-${index}`}
                            checked={showConditions}
                            onChange={(e) => {
                                setShowConditions(e.target.checked);
                                if (!e.target.checked) {
                                    setFormData(prev => ({
                                        ...prev,
                                        modifiers: (prev.modifiers as FeatureModifier[] || []).map((mod, i) =>
                                            i === index ? { ...mod, conditions: [] } : mod
                                        )
                                    }));
                                }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`conditions-${index}`} className="text-sm font-medium">
                            Conditions
                        </label>
                    </div>
                </div>
            </div>

            {/* Conditions */}
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

                    {(modifier.conditions || []).length === 0 ? (
                        <p className="text-gray-500 text-sm">No conditions added</p>
                    ) : (
                        <div className="space-y-2">
                            {(modifier.conditions || []).map((condition: FeatureModifierCondition, conditionIndex: number) => (
                                <div key={conditionIndex} className="flex items-center gap-2 p-2 border border-gray-200 rounded dark:border-gray-600">
                                    <ValidatedCustomSelect
                                        field={`modifiers.${index}.conditions.${conditionIndex}.conditionType`}
                                        label=""
                                        options={FEATURE_MODIFIER_CONDITION_SELECT_LIST}
                                        placeholder="Condition type"
                                        componentExtraClassName="flex-1"
                                        nested
                                    />
                                    {condition.conditionType === FeatureModifierConditionType.character_size ? (
                                        <ValidatedCustomSelect
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={SIZE_SELECT_LIST}
                                            placeholder="Select size"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : condition.conditionType === FeatureModifierConditionType.attack_type ? (
                                        <ValidatedCustomSelect
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={ATTACK_TYPE_SELECT_LIST}
                                            placeholder="Select attack type"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : condition.conditionType === FeatureModifierConditionType.spell_school ? (
                                        <ValidatedCustomSelect
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={SPELL_SCHOOL_SELECT_LIST}
                                            placeholder="Select spell school"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : condition.conditionType === FeatureModifierConditionType.creature_type ? (
                                        <ValidatedCustomSelect
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
                                            label=""
                                            options={CREATURE_TYPE_SELECT_LIST}
                                            placeholder="Select creature type"
                                            componentExtraClassName="flex-1"
                                            nested
                                        />
                                    ) : (
                                        <ValidatedInput
                                            field={`modifiers.${index}.conditions.${conditionIndex}.conditionValue`}
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
