import { CLASS_MAP } from "@shared/static-data/ClassData";

export const GetClassDisplay = (classes: any[], spellLevel: number): string => {
    if (!classes || classes.length === 0) return '';

    const formattedClasses = classes.map(cls => {
        const classItem = CLASS_MAP[cls.class_id];
        if (classItem) {
            if (cls.level !== spellLevel) {
                return `${classItem.abbr} ${cls.level}`;
            } else {
                return classItem.abbr;
            }
        }
        return 'Unknown Class';
    });

    return formattedClasses.join(', ');
}

export const GetClassLevelAbbr = (classLevels: any[]): string => {
    if (!classLevels || classLevels.length === 0) return '';
    // Use a Map to store { spell_level: { sorcererPresent: boolean, wizardPresent: boolean, otherClasses: Set<string> } }
    const organizedClassLevels = new Map<number, { sorcererPresent: boolean; wizardPresent: boolean; otherClasses: Set<string> }>();

    classLevels.forEach((cl: any) => {
        const classItem = CLASS_MAP[cl.class_id];
        if (classItem) {
            const levelData = organizedClassLevels.get(cl.spell_level) || {
                sorcererPresent: false,
                wizardPresent: false,
                otherClasses: new Set<string>()
            };

            const abbr = classItem.abbr;
            if (abbr === 'Sor') {
                levelData.sorcererPresent = true;
            } else if (abbr === 'Wiz') {
                levelData.wizardPresent = true;
            } else {
                levelData.otherClasses.add(abbr);
            }
            organizedClassLevels.set(cl.spell_level, levelData);
        }
    });

    const formattedEntries: string[] = [];

    // Sort levels to ensure consistent order
    const sortedLevels = Array.from(organizedClassLevels.keys()).sort((a, b) => a - b);

    sortedLevels.forEach(level => {
        const levelData = organizedClassLevels.get(level)!;
        let currentLevelAbbrs: string[] = [];

        // Handle Sorcerer/Wizard combination first for this level
        if (levelData.sorcererPresent && levelData.wizardPresent) {
            currentLevelAbbrs.push('Sor/Wiz');
        } else {
            if (levelData.sorcererPresent) {
                currentLevelAbbrs.push('Sor');
            }
            if (levelData.wizardPresent) {
                currentLevelAbbrs.push('Wiz');
            }
        }

        // Add other classes, sorted alphabetically
        const sortedOtherClasses = Array.from(levelData.otherClasses).sort();
        currentLevelAbbrs.push(...sortedOtherClasses);

        // Format each abbreviation with its level
        currentLevelAbbrs.forEach(abbr => {
            formattedEntries.push(`${abbr} ${level}`);
        });
    });

    // Sort the final combined entries alphabetically
    formattedEntries.sort();

    return formattedEntries.join(', ');
}