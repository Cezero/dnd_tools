import { CLASS_MAP } from "@shared/static-data";

interface ClassLevel {
    class_id: number;
    level: number;
}

interface ClassLevelMapping {
    classId: number;
    level: number;
}

export const GetClassDisplay = (classes: ClassLevel[], spellLevel: number): string => {
    if (!classes || classes.length === 0) return '';

    const formattedClasses = classes.map(cls => {
        const classItem = CLASS_MAP[cls.class_id];
        if (classItem) {
            if (cls.level !== spellLevel) {
                return `${classItem.abbreviation} ${cls.level}`;
            } else {
                return classItem.abbreviation;
            }
        }
        return 'Unknown Class';
    });

    return formattedClasses.join(', ');
}

export const GetClassLevelAbbr = (classLevels: ClassLevelMapping[]): string => {
    if (!classLevels || classLevels.length === 0) return '';
    // Use a Map to store { spell_level: { sorcererPresent: boolean, wizardPresent: boolean, otherClasses: Set<string> } }
    const organizedClassLevels = new Map<number, { sorcererPresent: boolean; wizardPresent: boolean; otherClasses: Set<string> }>();

    classLevels.forEach((cl: ClassLevelMapping) => {
        const classItem = CLASS_MAP[cl.classId];
        if (classItem) {
            const levelData = organizedClassLevels.get(cl.level) || {
                sorcererPresent: false,
                wizardPresent: false,
                otherClasses: new Set<string>()
            };

            const abbr = classItem.abbreviation;
            if (abbr === 'Sor') {
                levelData.sorcererPresent = true;
            } else if (abbr === 'Wiz') {
                levelData.wizardPresent = true;
            } else {
                levelData.otherClasses.add(abbr);
            }
            organizedClassLevels.set(cl.level, levelData);
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