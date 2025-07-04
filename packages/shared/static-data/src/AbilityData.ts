import { AbilityMap, SavingThrowMap } from './types';

export const ABILITY_MAP: AbilityMap = {
    1: { id: 1, name: 'Strength', abbreviation: 'STR' },
    2: { id: 2, name: 'Dexterity', abbreviation: 'DEX' },
    3: { id: 3, name: 'Constitution', abbreviation: 'CON' },
    4: { id: 4, name: 'Intelligence', abbreviation: 'INT' },
    5: { id: 5, name: 'Wisdom', abbreviation: 'WIS' },
    6: { id: 6, name: 'Charisma', abbreviation: 'CHA' },
}

export const ABILITY_LIST = Object.values(ABILITY_MAP);
export const ABILITY_SELECT_LIST = ABILITY_LIST.map(ability => ({
    value: ability.id,
    label: ability.abbreviation
}));

export const GetAbilityModifier = (abilityScore: number): number => {
    return Math.floor((abilityScore - 10) / 2);
}

export const GetAbilityModifierString = (abilityScore: number): string => {
    const modifier = GetAbilityModifier(abilityScore);
    return modifier > 0 ? `+${modifier}` : modifier.toString();
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
export const SAVING_THROW_SELECT_LIST = SAVING_THROW_LIST.map(savingThrow => ({
    value: savingThrow.id,
    label: savingThrow.abbreviation
}));
