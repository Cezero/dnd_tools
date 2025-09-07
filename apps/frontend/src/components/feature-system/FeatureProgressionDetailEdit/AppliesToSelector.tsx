import React from 'react';

import { ValidatedCustomSelect } from '@/components/forms';
import {
    MODIFIER_APPLIES_TO_SELECT_LIST,
    MODIFIER_APPLIES_TO_TYPES,
    MODIFIER_TYPE_COMPATIBILITY,
    ModifierAppliesToType,
    ModifierType,
    FEATURE_TYPES,
    FormulaId,
    CumulativeValueType
} from '@shared/static-data';

import type { AppliesToSelectorProps } from './types';
import { getAppliesToSelectOptions } from './utils';

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
        return getAppliesToSelectOptions(appliesTo, modifierType);
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
