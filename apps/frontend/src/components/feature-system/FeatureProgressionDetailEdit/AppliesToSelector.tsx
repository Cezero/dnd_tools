import React, { useState, useEffect } from 'react';

import { ValidatedCustomSelect } from '@/components/forms';
import {
    ENTITY_APPLIES_TO_SELECT_LIST,
    ENTITY_APPLIES_TO_TYPES,
    ENTITY_TYPE_COMPATIBILITY,
    ENTITY_TYPES,
    FormulaId,
    CumulativeValueType,
    EntityAppliesToType,
    EntityType
} from '@shared/static-data';
import type { SelectOption } from '@shared/static-data';

import type { AppliesToSelectorProps } from './types';
import { getAppliesToSelectOptions } from './utils';

export function AppliesToSelector({
    index,
    entityType,
    appliesTo,
    formulaId,
    valuesRepresent
}: AppliesToSelectorProps) {
    const [appliesToIdOptions, setAppliesToIdOptions] = useState<SelectOption[]>([]);
    // Helper function to get the appropriate appliesTo options based on entityType
    const getAppliesToOptions = (entityType: EntityType | null) => {
        if (entityType === null || entityType === undefined) return ENTITY_APPLIES_TO_SELECT_LIST;

        const compatibleTypes = ENTITY_TYPE_COMPATIBILITY[entityType] || [];
        return ENTITY_APPLIES_TO_SELECT_LIST.filter(option =>
            (compatibleTypes as EntityAppliesToType[]).includes(option.value as EntityAppliesToType)
        );
    };

    // Load appliesToId options when appliesTo or entityType changes
    useEffect(() => {
        const loadAppliesToIdOptions = async () => {
            if (appliesTo !== null && appliesTo !== undefined) {
                const options = await getAppliesToSelectOptions(appliesTo, entityType);
                setAppliesToIdOptions(options);
            } else {
                setAppliesToIdOptions([]);
            }
        };
        loadAppliesToIdOptions();
    }, [appliesTo, entityType]);

    return (
        <div className="space-y-2">
            <div>
                <ValidatedCustomSelect
                    key={`appliesTo-${index}-${entityType}`}
                    field={`entities.${index}.appliesTo`}
                    label="Applies To"
                    options={getAppliesToOptions(entityType)}
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

                return appliesToIdOptions.length > 0 ? (
                    <div>
                        <ValidatedCustomSelect
                            key={`appliesToId-${index}-${appliesTo}`}
                            field={`entities.${index}.appliesToId`}
                            label={(() => {
                                if (appliesTo === EntityAppliesToType.Damage && entityType === EntityType.Quantity) { // Damage + Quantity
                                    return 'Dice';
                                }
                                return appliesTo !== null && appliesTo !== undefined ? ENTITY_APPLIES_TO_TYPES[appliesTo]?.name || 'Target' : 'Target';
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
