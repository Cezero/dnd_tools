import {
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
    ModifierType
} from '@shared/static-data';

/**
 * Get the appropriate select options for AppliesToId based on the appliesTo type
 * Used when valuesRepresent is set to AppliesToId in conditional scaling formulas
 * This mirrors the logic from AppliesToSelector.tsx
 */
export function getAppliesToSelectOptions(appliesTo: number | null | undefined, modifierType?: number | null) {
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
        case ModifierAppliesToType.DamageType:
            return DAMAGE_TYPE_SELECT_LIST;
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
}
