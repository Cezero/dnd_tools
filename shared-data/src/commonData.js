export const RPG_DICE = {
    0: { id: 0, name: 'd4', sides: 4, min: 1, max: 4 },
    1: { id: 1, name: 'd6', sides: 6, min: 1, max: 6 },
    2: { id: 2, name: 'd8', sides: 8, min: 1, max: 8 },
    3: { id: 3, name: 'd10', sides: 10, min: 1, max: 10 },
    4: { id: 4, name: 'd12', sides: 12, min: 1, max: 12 },
    5: { id: 5, name: 'd20', sides: 20, min: 1, max: 20 },
    6: { id: 6, name: 'd100', sides: 100, min: 1, max: 100 },
}

export const RPG_DICE_LIST = Object.values(RPG_DICE);

export const ALIGNMENTS_BY_ID = {
    0: { id: 0, name: 'Lawful Good', abbr: 'LG' },
    1: { id: 1, name: 'Neutral Good', abbr: 'NG' },
    2: { id: 2, name: 'Chaotic Good', abbr: 'CG' },
    3: { id: 3, name: 'Lawful Neutral', abbr: 'LN' },
    4: { id: 4, name: 'True Neutral', abbr: 'N' },
    5: { id: 5, name: 'Chaotic Neutral', abbr: 'CN' },
    6: { id: 6, name: 'Lawful Evil', abbr: 'LE' },
    7: { id: 7, name: 'Neutral Evil', abbr: 'NE' },
    8: { id: 8, name: 'Chaotic Evil', abbr: 'CE' },
}

export const ALIGNMENT_LIST = Object.values(ALIGNMENTS_BY_ID);

export const ATTRIBUTE_MAP = {
    1: { id: 1, name: 'Strength', abbr: 'STR' },
    2: { id: 2, name: 'Dexterity', abbr: 'DEX' },
    3: { id: 3, name: 'Constitution', abbr: 'CON' },
    4: { id: 4, name: 'Intelligence', abbr: 'INT' },
    5: { id: 5, name: 'Wisdom', abbr: 'WIS' },
    6: { id: 6, name: 'Charisma', abbr: 'CHA' },
}

export const ATTRIBUTE_LIST = Object.values(ATTRIBUTE_MAP);
