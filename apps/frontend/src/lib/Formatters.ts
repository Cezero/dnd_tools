import { ClassProficiencyInQueryResponse, ClassFeatureProgressionDetailInQueryResponse } from "@shared/schema";
import { ASPECT_FORMATTERS } from "@shared/static-data";

export function formatClassProficiencies(proficiencies: ClassProficiencyInQueryResponse[]): string {
    const proficiencyNameMap = {
        "Armor Proficiency (Light)": { display: "light armor", sort: 4 },
        "Armor Proficiency (Medium)": { display: "medium armor", sort: 5 },
        "Armor Proficiency (Heavy)": { display: "heavy armor", sort: 6 },
        "Shield Proficiency": { display: "shields", sort: 7 },
        "Tower Shield Proficiency": { display: "tower shields", sort: 8 },
        "Simple Weapon Proficiency": { display: "simple weapons", sort: 1 },
        "Martial Weapon Proficiency": { display: "martial weapons", sort: 2 },
        "Exotic Weapon Proficiency": { display: "exotic weapons", sort: 3 },
    };

    return proficiencies
        .map((proficiency) => {
            let display: string;
            let sort: number;

            if (proficiency.itemId === -1) {
                const mapping = proficiencyNameMap[proficiency.featName];
                if (!mapping) return { display: proficiency.featName, sort: 999 }; // fallback

                if (
                    proficiency.featName.startsWith("Armor Proficiency") ||
                    proficiency.featName.startsWith("Shield Proficiency")
                ) {
                    display = mapping.display;
                } else {
                    display = `all ${mapping.display}`;
                }

                sort = mapping.sort;
            } else {
                display = proficiency.itemName?.toLowerCase() || `item ${proficiency.itemId}`;
                sort = 999; // default sort order for item-based proficiencies
            }

            return { display, sort };
        })
        .sort((a, b) => a.sort - b.sort)
        .map(({ display }) => display)
        .join(', ');
}

// Types for progression formatting
export interface ProgressionFormatter {
    label?: (progression: ClassFeatureProgressionDetailInQueryResponse) => string;
    value: (valueInt: number | null, valueString: string | null) => string;
}

export interface ProgressionFormatConfig {
    [aspect: string]: ProgressionFormatter;
}

// Default progression formatters
export const PROGRESSION_FORMATTERS: ProgressionFormatConfig = {
    bonusFeat: {
        label: () => 'Bonus Feat',
        value: () => ''
    },
    usesPerDay: {
        value: (valueInt) => valueInt ? `${valueInt}/day` : ''
    },
    secondaryUsesPerDay: {
        value: (valueInt) => valueInt ? `${valueInt}/day` : ''
    },
    usesPerWeek: {
        value: (valueInt) => valueInt ? `${valueInt}/week` : ''
    },
    bonus: {
        value: (valueInt) => {
            if (valueInt !== null) {
                return valueInt > 0 ? `+${valueInt}` : `${valueInt}`;
            }
            return '';
        }
    },
    damageReduction: {
        value: (valueInt) => valueInt ? `${valueInt}/—` : ''
    },
    distance: {
        value: (valueInt, valueString) => valueInt ? `${valueInt} ft.` : valueString ? `${valueString} distance` : ''
    }
};

// Helper function to format progression values (legacy function for backward compatibility)
export function formatProgressionValue(aspect: string, valueInt: number | null, valueString: string | null): string {
    const formatter = ASPECT_FORMATTERS[aspect];
    if (formatter) {
        return formatter(valueInt, valueString);
    }

    // For aspects without defined formatters, return the raw value
    if (valueInt !== null) {
        return valueInt > 0 ? `+${valueInt}` : `${valueInt}`;
    }
    if (valueString) {
        return valueString;
    }
    return '';
}

// New function to format complete progression display
export function formatProgression(progression: ClassFeatureProgressionDetailInQueryResponse): { label: string; value: string; note?: string } {
    const formatter = PROGRESSION_FORMATTERS[progression.aspect];

    if (formatter) {
        const label = formatter.label ? formatter.label(progression) : `${progression.featureName || progression.featureSlug}:`;
        const value = formatter.value(progression.valueInt, progression.valueString);

        return {
            label,
            value,
            note: progression.note || undefined
        };
    }

    // Default formatting for aspects without custom formatters
    const value = formatProgressionValue(progression.aspect, progression.valueInt, progression.valueString);

    return {
        label: `${progression.featureName || progression.featureSlug}:`,
        value,
        note: progression.note || undefined
    };
}

