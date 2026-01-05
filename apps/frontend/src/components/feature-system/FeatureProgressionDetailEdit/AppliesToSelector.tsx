import React from 'react';

import { ValidatedCustomSelect, CustomSelect, useFormContext, SpellSearchInput } from '@/components/forms';
import type { FeatureEntity } from '@shared/schema';
import {
    ENTITY_APPLIES_TO_LIST,
    ENTITY_APPLIES_TO_TYPES,
    ENTITY_TYPE_COMPATIBILITY,
    FormulaId,
    ConditionalScalingValueType,
    EntityAppliesToType,
    EntityType
} from '@shared/static-data';
import type { CoreComponent } from '@shared/static-data';

import type { AppliesToSelectorProps } from './types';
import { useAppliesToSelectOptions } from './utils';

export function AppliesToSelector({
    index,
    entityType,
    appliesTo,
    formulaId,
    valuesRepresent
}: AppliesToSelectorProps) {
    const { formData, setFormData } = useFormContext();
    const appliesToIdOptions = useAppliesToSelectOptions(appliesTo, entityType);
    
    // Get current entity to check if we need to add current value to options
    const currentEntity = formData?.entities?.[index] as FeatureEntity | undefined;
    const currentAppliesToId = currentEntity?.appliesToId;
    
    // Ensure current value is in options (for when data is still loading or value isn't in fetched list)
    const finalOptions = React.useMemo(() => {
        if (!currentAppliesToId || appliesToIdOptions.length === 0) {
            return appliesToIdOptions;
        }
        
        // Check if current value is already in options
        const hasCurrentValue = appliesToIdOptions.some(opt => opt.id === currentAppliesToId);
        if (hasCurrentValue) {
            return appliesToIdOptions;
        }
        
        // If current value not in options, try to get it from entity data
        if (appliesTo === EntityAppliesToType.Feat && currentEntity?.feat) {
            return [
                ...appliesToIdOptions,
                { id: currentEntity.feat.id, name: currentEntity.feat.name }
            ];
        }
        
        return appliesToIdOptions;
    }, [appliesToIdOptions, currentAppliesToId, appliesTo, currentEntity]);
    
    // Check if we should show the appliesToId field
    // Show it if appliesTo is set and either we have options or we're loading (for async types)
    const shouldShowAppliesToId = appliesTo !== null && appliesTo !== undefined && (
        finalOptions.length > 0 ||
        (appliesTo === EntityAppliesToType.Feat || appliesTo === EntityAppliesToType.Domain || appliesTo === EntityAppliesToType.Feature)
    );

    // Helper function to get the appropriate appliesTo options based on entityType
    const getAppliesToOptions = (entityType: EntityType | null) => {
        if (entityType === null || entityType === undefined) return ENTITY_APPLIES_TO_LIST;

        const compatibleTypes = ENTITY_TYPE_COMPATIBILITY[entityType] || [];
        return ENTITY_APPLIES_TO_LIST.filter(option =>
            (compatibleTypes as EntityAppliesToType[]).includes(option.id as EntityAppliesToType)
        );
    };

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

                return shouldShowAppliesToId ? (
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
                                                    const selectedDomain = finalOptions.find(option => option.id === value);
                                                    if (selectedDomain) {
                                                        updatedEntity.domain = {
                                                            id: value,
                                                            name: selectedDomain.name
                                                        };
                                                    }
                                                }
                                                
                                                // If this is a feat selection, populate the feat object
                                                if (appliesTo === EntityAppliesToType.Feat && value) {
                                                    const selectedFeat = finalOptions.find(option => option.id === value);
                                                    if (selectedFeat) {
                                                        updatedEntity.feat = {
                                                            id: value,
                                                            name: selectedFeat.name
                                                        } as typeof updatedEntity.feat;
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
                                options={finalOptions}
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
