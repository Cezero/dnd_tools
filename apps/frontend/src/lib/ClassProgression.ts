import {
    getBABProgression,
    getGoodSave,
    getPoorSave,
    ProgressionType,
    SpellProgressionType,
    SPELL_TABLE_MAP
} from '@shared/static-data';

export interface ProgressionRow {
    level: number;
    bab: string;
    fort: number;
    ref: number;
    will: number;
    spells?: { [spellLevel: number]: number };
}

export interface ClassProgressionConfig {
    babProgression: ProgressionType;
    fortProgression: ProgressionType;
    refProgression: ProgressionType;
    willProgression: ProgressionType;
    spellProgression?: SpellProgressionType;
}

/**
 * Generates progression data for a class from level 1 to 20
 */
export function generateClassProgression(config: ClassProgressionConfig): ProgressionRow[] {
    const progression: ProgressionRow[] = [];

    for (let level = 1; level <= 20; level++) {
        const row: ProgressionRow = {
            level,
            bab: getBABProgression(level, config.babProgression),
            fort: config.fortProgression === ProgressionType.good ? getGoodSave(level) : getPoorSave(level),
            ref: config.refProgression === ProgressionType.good ? getGoodSave(level) : getPoorSave(level),
            will: config.willProgression === ProgressionType.good ? getGoodSave(level) : getPoorSave(level),
        };

        // Add spell progression if defined
        if (config.spellProgression !== undefined && config.spellProgression !== null) {
            const spellTable = SPELL_TABLE_MAP[config.spellProgression];
            if (spellTable && spellTable[level]) {
                row.spells = { ...spellTable[level] };
            }
        }

        progression.push(row);
    }

    return progression;
}

/**
 * Formats spell progression for display
 */
export function formatSpellProgression(spells: { [spellLevel: number]: number }): string {
    const spellLevels = Object.keys(spells)
        .map(Number)
        .sort((a, b) => a - b);

    return spellLevels
        .map(level => `${spells[level]}`)
        .join('/');
}

/**
 * Gets the maximum spell level for a progression
 */
export function getMaxSpellLevel(spells: { [spellLevel: number]: number }): number {
    return Math.max(...Object.keys(spells).map(Number));
} 