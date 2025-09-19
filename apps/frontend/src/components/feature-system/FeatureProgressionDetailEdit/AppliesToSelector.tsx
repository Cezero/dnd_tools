import React, { useState, useEffect } from 'react';

import { ValidatedCustomSelect, CustomSelect, useFormContext, SpellSearchInput } from '@/components/forms';
import type { FeatureEntity } from '@shared/schema';
import {
    ENTITY_APPLIES_TO_SELECT_LIST,
    ENTITY_APPLIES_TO_TYPES,
    ENTITY_TYPE_COMPATIBILITY,
    FormulaId,
    ConditionalScalingValueType,
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
    const { formData, setFormData } = useFormContext();
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
        <div className="flex flex-col gap-2">
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
                    valuesRepresent === ConditionalScalingValueType.AppliesToId;

                if (isConditionalScalingWithAppliesToId) {
                    return null;
                }

                return appliesToIdOptions.length > 0 ? (
                    <div>
                        {appliesTo === EntityAppliesToType.Spell ? (
                            <SpellSearchInput
                                key={`appliesToId-${index}-${appliesTo}`}
                                value={formData?.entities?.[index]?.appliesToId || null}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                            i === index ? { ...ent, appliesToId: value } : ent
                                        )
                                    }));
                                }}
                                label="Spell"
                                placeholder="Search for a spell..."
                                componentExtraClassName="flex items-center gap-2"
                            />
                        ) : (
                            <CustomSelect
                                key={`appliesToId-${index}-${appliesTo}`}
                                value={formData?.entities?.[index]?.appliesToId || null}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        entities: (prev.entities as FeatureEntity[] || []).map((ent, i) => {
                                            if (i === index) {
                                                const updatedEntity = { ...ent, appliesToId: value };

                                                // If this is a domain selection, populate the domain object
                                                if (appliesTo === EntityAppliesToType.Domain && value) {
                                                    const selectedDomain = appliesToIdOptions.find(option => option.value === value);
                                                    if (selectedDomain) {
                                                        updatedEntity.domain = {
                                                            id: value,
                                                            name: selectedDomain.label
                                                        };
                                                    }
                                                }

                                                return updatedEntity;
                                            }
                                            return ent;
                                        })
                                    }));
                                }}
                                label={(() => {
                                    if (appliesTo === EntityAppliesToType.Damage && entityType === EntityType.Quantity) { // Damage + Quantity
                                        return 'Dice';
                                    }
                                    return appliesTo !== null && appliesTo !== undefined ? ENTITY_APPLIES_TO_TYPES[appliesTo]?.name || 'Target' : 'Target';
                                })()}
                                options={appliesToIdOptions}
                                placeholder="Select"
                                componentExtraClassName="flex items-center gap-2"
                            />
                        )}
                    </div>
                ) : null;
            })()}
        </div>
    );
}
