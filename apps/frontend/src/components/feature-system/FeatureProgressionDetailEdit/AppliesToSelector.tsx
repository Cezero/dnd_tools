import React from 'react';

import { ValidatedCustomSelect } from '@/components/forms';
import {
    MODIFIER_APPLIES_TO_SELECT_LIST,
    MODIFIER_TYPE_COMPATIBILITY,
    MODIFIER_APPLIES_TO_TYPES,
    ABILITY_SELECT_LIST,
    FULL_SKILL_SELECT_LIST,
    SAVING_THROW_SELECT_LIST,
    RPG_DICE_SELECT_LIST,
    DAMAGE_TYPE_SELECT_LIST,
    USES_FREQUENCY_SELECT_LIST,
    LANGUAGE_SELECT_LIST,
    SIZE_SELECT_LIST,
    CREATURE_TYPE_SELECT_LIST,
    ModifierAppliesToType,
    ModifierType,
    FEATURE_TYPES,
    FormulaId,
    CumulativeValueType
} from '@shared/static-data';

import type { AppliesToSelectorProps } from './types';

export function AppliesToSelector({
    index,
    entityType,
    modifierType,
    appliesTo,
    appliesToId,
    onAppliesToChange,
    onAppliesToIdChange,
    formulaId,
    valuesRepresent
}: AppliesToSelectorProps) {
    // Helper function to get the appropriate appliesTo options based on modifierType
    const getAppliesToOptions = (modifierType: number | null) => {
        if (modifierType === null || modifierType === undefined) return MODIFIER_APPLIES_TO_SELECT_LIST;

        const compatibleTypes = MODIFIER_TYPE_COMPATIBILITY[modifierType] || [];
        return MODIFIER_APPLIES_TO_SELECT_LIST.filter(option =>
            (compatibleTypes as number[]).includes(option.value as number)
        );
    };

    const getAppliesToIdOptions = (appliesTo: number | null) => {
        if (appliesTo === null || appliesTo === undefined) return [];

        switch (appliesTo) {
            case ModifierAppliesToType.Ability:
                return [
                    { value: -1, label: 'Any Ability' },
                    ...ABILITY_SELECT_LIST
                ];
            case ModifierAppliesToType.Skill:
                return [
                    { value: -1, label: 'Any Skill' },
                    ...FULL_SKILL_SELECT_LIST
                ];
            case ModifierAppliesToType.SavingThrow:
                return [
                    { value: -1, label: 'Any Saving Throw' },
                    ...SAVING_THROW_SELECT_LIST
                ];
            case ModifierAppliesToType.HitDice:
                return RPG_DICE_SELECT_LIST;
            case ModifierAppliesToType.Damage:
                return modifierType === ModifierType.Quantity ? RPG_DICE_SELECT_LIST : DAMAGE_TYPE_SELECT_LIST;
            case ModifierAppliesToType.DamageReduction:
                return DAMAGE_TYPE_SELECT_LIST;
            case ModifierAppliesToType.AC:
                return [];
            case ModifierAppliesToType.Uses:
                return USES_FREQUENCY_SELECT_LIST;
            case ModifierAppliesToType.BonusLanguage:
            case ModifierAppliesToType.AutomaticLanguage:
                return [
                    { value: -1, label: 'Any Language' },
                    ...LANGUAGE_SELECT_LIST
                ];
            case ModifierAppliesToType.Feat:
                return [
                    { value: null, label: 'Select a feat...' }
                ];
            case ModifierAppliesToType.SizeCategory:
                return [
                    { value: -1, label: 'Any Size' },
                    ...SIZE_SELECT_LIST
                ];
            case ModifierAppliesToType.CreatureType:
                return [
                    { value: -1, label: 'Any Creature Type' },
                    ...CREATURE_TYPE_SELECT_LIST
                ];
            case ModifierAppliesToType.MovementSpeed:
            case ModifierAppliesToType.Attack:
            case ModifierAppliesToType.Initiative:
            case ModifierAppliesToType.Other:
                return [
                    { value: null, label: 'Any/All' },
                    { value: 1, label: 'Specific Target 1' },
                    { value: 2, label: 'Specific Target 2' }
                ];
            default:
                return [];
        }
    };

    return (
        <div className="space-y-2">
            <div>
                <ValidatedCustomSelect
                    key={`appliesTo-${index}-${modifierType}`}
                    field={`${FEATURE_TYPES[entityType].name}.${index}.appliesTo`}
                    label="Applies To"
                    options={getAppliesToOptions(modifierType)}
                    placeholder="Select"
                    componentExtraClassName="flex items-center gap-2"
                    nested
                />
            </div>

            {/* Applies To ID field (if needed) */}
            {(() => {
                // Hide AppliesToId field when using conditional scaling with AppliesToId valuesRepresent
                const isConditionalScalingWithAppliesToId = formulaId === FormulaId.CONDITIONAL_SCALING &&
                    valuesRepresent === CumulativeValueType.AppliesToId;

                if (isConditionalScalingWithAppliesToId) {
                    return null;
                }

                const appliesToIdOptions = getAppliesToIdOptions(appliesTo);
                return appliesToIdOptions.length > 0 ? (
                    <div>
                        <ValidatedCustomSelect
                            key={`appliesToId-${index}-${appliesTo}`}
                            field={`${FEATURE_TYPES[entityType].name}.${index}.appliesToId`}
                            label={(() => {
                                if (appliesTo === 5 && modifierType === 4) { // Damage + Quantity
                                    return 'Dice';
                                }
                                return appliesTo !== null && appliesTo !== undefined ? MODIFIER_APPLIES_TO_TYPES[appliesTo]?.name || 'Target' : 'Target';
                            })()}
                            options={appliesToIdOptions}
                            placeholder="Select"
                            componentExtraClassName="flex items-center gap-2"
                            nested
                        />
                    </div>
                ) : null;
            })()}
        </div>
    );
}
