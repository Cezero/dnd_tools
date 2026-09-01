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

/** Spell level options (0-9) for SpellbookSpell and SpellcastingProgression appliesToId. */
const SPELL_LEVEL_OPTIONS: { id: number; name: string }[] = [
    { id: 0, name: '0th (Cantrip)' },
    { id: 1, name: '1st' },
    { id: 2, name: '2nd' },
    { id: 3, name: '3rd' },
    { id: 4, name: '4th' },
    { id: 5, name: '5th' },
    { id: 6, name: '6th' },
    { id: 7, name: '7th' },
    { id: 8, name: '8th' },
    { id: 9, name: '9th' },
];

export function AppliesToSelector({
    index,
    entityType,
    appliesTo,
    formulaId,
    valuesRepresent,
    editionId
}: AppliesToSelectorProps) {
    const { formData, setFormData } = useFormContext();
    const appliesToIdOptions = useAppliesToSelectOptions(appliesTo, entityType, editionId);

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

        // If current value not in options, we can't reliably add it without cache access
        // The options should be populated from the cache via useAppliesToSelectOptions
        return appliesToIdOptions;
    }, [appliesToIdOptions, currentAppliesToId, appliesTo, currentEntity]);

    // Check if we should show the appliesToId field
    // Show it if appliesTo is set and either we have options or we're loading (for async types)
    // Also show for SpellbookSpell with EntityType.Other (uses CustomSelect for level)
    // Also show for new class mechanics types (all of them use appliesToId to store the value)
    const shouldShowAppliesToId = appliesTo !== null && appliesTo !== undefined && (
        finalOptions.length > 0 ||
        (appliesTo === EntityAppliesToType.Feat || appliesTo === EntityAppliesToType.Domain || appliesTo === EntityAppliesToType.Feature) ||
        (appliesTo === EntityAppliesToType.SpellbookSpell && entityType === EntityType.Other) ||
        (appliesTo === EntityAppliesToType.Spell && entityType !== undefined) ||
        (appliesTo === EntityAppliesToType.HitDice) ||
        (appliesTo === EntityAppliesToType.Size) ||
        (appliesTo === EntityAppliesToType.FavoredClass) ||
        (appliesTo === EntityAppliesToType.SavingThrow) ||
        (appliesTo === EntityAppliesToType.BaseAttackBonus) ||
        (appliesTo === EntityAppliesToType.CastingAbility) ||
        (appliesTo === EntityAppliesToType.CastingType) ||
        (appliesTo === EntityAppliesToType.SpellcastingProgression) ||
        (appliesTo === EntityAppliesToType.SpellsKnownProgression)
        // Note: SkillPoints, MovementSpeed, and LevelAdjustment use value field, not appliesToId
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
                        ) : appliesTo === EntityAppliesToType.SpellbookSpell && entityType === EntityType.Other ? (
                            <CustomSelect
                                key={`appliesToId-${index}-${appliesTo}`}
                                value={formData?.entities?.[index]?.appliesToId ?? null}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                            i === index ? { ...ent, appliesToId: value } : ent
                                        )
                                    }));
                                }}
                                label="Spell Level"
                                options={SPELL_LEVEL_OPTIONS}
                                placeholder="Select spell level..."
                                componentExtraClassName="flex items-center gap-2"
                            />
                        ) : appliesTo === EntityAppliesToType.SpellcastingProgression || appliesTo === EntityAppliesToType.SpellsKnownProgression ? (
                            <CustomSelect
                                key={`appliesToId-${index}-${appliesTo}`}
                                value={formData?.entities?.[index]?.appliesToId ?? null}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        entities: (prev.entities as FeatureEntity[] || []).map((ent, i) =>
                                            i === index ? { ...ent, appliesToId: value } : ent
                                        )
                                    }));
                                }}
                                label="Spell Level"
                                options={SPELL_LEVEL_OPTIONS}
                                placeholder="Select spell level..."
                                componentExtraClassName="flex items-center gap-2"
                            />
                        ) : (
                            <CustomSelect
                                key={`appliesToId-${index}-${appliesTo}`}
                                value={(() => {
                                    const entity = formData?.entities?.[index] as FeatureEntity | undefined;
                                    const appliesToIdValue = entity?.appliesToId;
                                    // Ensure the value is a number (not null/undefined) for proper matching
                                    return appliesToIdValue !== null && appliesToIdValue !== undefined ? appliesToIdValue : null;
                                })()}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        entities: (prev.entities as FeatureEntity[] || []).map((ent, i) => {
                                            if (i === index) {
                                                const updatedEntity = { ...ent, appliesToId: value };

                                                // Domain object is no longer stored on entity - frontend uses cache for lookups

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
                                    // For BaseAttackBonus, appliesToId stores the feature type
                                    if (appliesTo === EntityAppliesToType.BaseAttackBonus) {
                                        return 'Feature Type';
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
