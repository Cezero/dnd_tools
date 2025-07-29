import { AbilityMap, NameToIdMap, SavingThrowMap } from './types';
import { AbbreviationSelectOptionList } from './Util';

export const ABILITY_MAP: AbilityMap = {
    1: { id: 1, name: 'Strength', abbreviation: 'STR' },
    2: { id: 2, name: 'Dexterity', abbreviation: 'DEX' },
    3: { id: 3, name: 'Constitution', abbreviation: 'CON' },
    4: { id: 4, name: 'Intelligence', abbreviation: 'INT' },
    5: { id: 5, name: 'Wisdom', abbreviation: 'WIS' },
    6: { id: 6, name: 'Charisma', abbreviation: 'CHA' },
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

export const SAVING_THROW_MAP: SavingThrowMap = {
    1: { id: 1, name: "Fortitude", abbreviation: "Fort" },
    2: { id: 2, name: "Will", abbreviation: "Will" },
    3: { id: 3, name: "Reflex", abbreviation: "Ref" },
}

export const SAVING_THROW_LIST = Object.values(SAVING_THROW_MAP)
export const SAVING_THROW_SELECT_LIST = AbbreviationSelectOptionList(SAVING_THROW_LIST);
