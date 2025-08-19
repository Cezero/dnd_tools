import {
    getBABProgression,
    getGoodSave,
    getPoorSave,
    ProgressionType
} from '@shared/static-data';

export interface ProgressionRow {
    level: number;
    bab: string;
    fort: number;
    ref: number;
    will: number;
    spells?: { [spellLevel: number]: number };
    spellsKnown?: { [spellLevel: number]: number };
}

export interface ClassProgressionConfig {
    babProgression: ProgressionType;
    fortProgression: ProgressionType;
    refProgression: ProgressionType;
    willProgression: ProgressionType;
    spellcastingProgression?: Array<{
        classLevel: number;
        slots?: Array<{
            spellLevel: number;
            slotsPerDay: number;
        }>;
    }>;
    spellsKnownProgression?: Array<{
        classLevel: number;
        slots?: Array<{
            spellLevel: number;
            slotsPerDay: number;
        }>;
    }>;
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

        // Add spellcasting data if available
        if (config.spellcastingProgression) {
            const spellProgression = config.spellcastingProgression.find(p => p.classLevel === level);
            if (spellProgression && spellProgression.slots) {
                const spells: { [spellLevel: number]: number } = {};
                spellProgression.slots.forEach(slot => {
                    spells[slot.spellLevel] = slot.slotsPerDay;
                });
                row.spells = spells;
            }
        }

        // Add spells known data if available
        if (config.spellsKnownProgression) {
            const spellsKnownProgression = config.spellsKnownProgression.find(p => p.classLevel === level);
            if (spellsKnownProgression && spellsKnownProgression.slots) {
                const spellsKnown: { [spellLevel: number]: number } = {};
                spellsKnownProgression.slots.forEach(slot => {
                    spellsKnown[slot.spellLevel] = slot.slotsPerDay;
                });
                row.spellsKnown = spellsKnown;
            }
        }

        progression.push(row);
    }

    return progression;
}
