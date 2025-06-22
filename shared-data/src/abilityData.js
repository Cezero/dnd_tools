export const ABILITY_MAP = {
    1: { id: 1, name: 'Strength', abbr: 'STR' },
    2: { id: 2, name: 'Dexterity', abbr: 'DEX' },
    3: { id: 3, name: 'Constitution', abbr: 'CON' },
    4: { id: 4, name: 'Intelligence', abbr: 'INT' },
    5: { id: 5, name: 'Wisdom', abbr: 'WIS' },
    6: { id: 6, name: 'Charisma', abbr: 'CHA' },
}

export const ABILITY_LIST = Object.values(ABILITY_MAP);

export const getAbilityModifier = (abilityScore) => {
    return Math.floor((abilityScore - 10) / 2);
}

export const getAbilityModifierString = (abilityScore) => {
    const modifier = getAbilityModifier(abilityScore);
    return modifier > 0 ? `+${modifier}` : modifier;
}

export const getBonusSpellsForAbility = (abilityScore) => {
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