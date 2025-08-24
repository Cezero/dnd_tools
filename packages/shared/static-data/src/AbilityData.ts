import { AbilityMap, NameToIdMap, SavingThrowMap } from './types';
import { AbbreviationSelectOptionList } from './Util';

// Ability ID enum for type safety
export const AbilityId = {
    Strength: 1,
    Dexterity: 2,
    Constitution: 3,
    Intelligence: 4,
    Wisdom: 5,
    Charisma: 6,
} as const;

export type AbilityId = typeof AbilityId[keyof typeof AbilityId];

export const ABILITY_MAP: AbilityMap = {
    [AbilityId.Strength]: { id: AbilityId.Strength, name: 'Strength', abbreviation: 'STR' },
    [AbilityId.Dexterity]: { id: AbilityId.Dexterity, name: 'Dexterity', abbreviation: 'DEX' },
    [AbilityId.Constitution]: { id: AbilityId.Constitution, name: 'Constitution', abbreviation: 'CON' },
    [AbilityId.Intelligence]: { id: AbilityId.Intelligence, name: 'Intelligence', abbreviation: 'INT' },
    [AbilityId.Wisdom]: { id: AbilityId.Wisdom, name: 'Wisdom', abbreviation: 'WIS' },
    [AbilityId.Charisma]: { id: AbilityId.Charisma, name: 'Charisma', abbreviation: 'CHA' },
}

export const ABILITY_LIST = Object.values(ABILITY_MAP);
export const ABILITY_SELECT_LIST = AbbreviationSelectOptionList(ABILITY_LIST);

export const ABILITY_NAME_MAP: NameToIdMap = Object.fromEntries(
    Object.entries(ABILITY_MAP).map(([key, value]) => [value.name, parseInt(key)])
);

export const GetAbilityModifier = (abilityScore: number): number => {
    return Math.floor((abilityScore - 10) / 2);
}

export const GetAbilityModifierString = (abilityScore: number): string => {
    const modifier = GetAbilityModifier(abilityScore);
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
}

export const GetPointBuyCost = (abilityScore: number): number => {
    if (abilityScore < 8 || abilityScore > 18) {
        throw new Error("Ability score must be between 8 and 18.");
    }

    if (abilityScore <= 8) return 0;
    if (abilityScore <= 14) return abilityScore - 8;
    if (abilityScore <= 16) return 6 + 2 * (abilityScore - 14);
    return 10 + 3 * (abilityScore - 16);
}


export const GetBonusSpellsForAbility = (abilityScore: number): number[] => {
    if (abilityScore < 12) {
        return [];
    }

    const bonusSpells = Array(9).fill(0); // For spell levels 1–9

    const maxBonusLevel = Math.floor((abilityScore - 10) / 2);
    const totalBonusSpells = Math.floor((abilityScore - 10) / 4) + 1;

    let spellIndex = 0;
    let spellsRemaining = totalBonusSpells;

    // Distribute bonus spells from lowest eligible level upward
    while (spellsRemaining > 0 && spellIndex < 9) {
        if (spellIndex < maxBonusLevel) {
            bonusSpells[spellIndex]++;
            spellsRemaining--;
        }
        spellIndex = (spellIndex + 1) % 9; // Cycle through levels
    }

    return bonusSpells;
}

export const SavingThrowId = {
    Fortitude: 1,
    Will: 2,
    Reflex: 3,
} as const;

export type SavingThrowId = typeof SavingThrowId[keyof typeof SavingThrowId];

export const SAVING_THROW_MAP: SavingThrowMap = {
    [SavingThrowId.Fortitude]: { id: SavingThrowId.Fortitude, name: "Fortitude", abbreviation: "Fort" },
    [SavingThrowId.Will]: { id: SavingThrowId.Will, name: "Will", abbreviation: "Will" },
    [SavingThrowId.Reflex]: { id: SavingThrowId.Reflex, name: "Reflex", abbreviation: "Ref" },
}

export const SAVING_THROW_LIST = Object.values(SAVING_THROW_MAP)
export const SAVING_THROW_SELECT_LIST = AbbreviationSelectOptionList(SAVING_THROW_LIST);
