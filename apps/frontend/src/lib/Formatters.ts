import { FeatureProgressionWithRelations } from "@shared/schema";
import { ASPECT_FORMATTERS, FeatureModifierType } from "@shared/static-data";

export function formatClassProficiencies(proficiencies: Array<{ featId: number; itemId: number; featName: string; itemName?: string }>): string {
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
    value: (valueInt: number | null) => string;
}

// Default progression formatters
export const PROGRESSION_FORMATTERS: Record<FeatureModifierType, ProgressionFormatter> = {
    [FeatureModifierType.UsesPerDay]: {
        value: (valueInt) => valueInt ? `${valueInt}/day` : ''
    },
    [FeatureModifierType.FlatBonus]: {
        value: (valueInt) => {
            if (valueInt !== null) {
                return valueInt > 0 ? `+${valueInt}` : `${valueInt}`;
            }
            return '';
        }
    },
    [FeatureModifierType.DR]: {
        value: (valueInt) => valueInt ? `${valueInt}/—` : ''
    },
    [FeatureModifierType.Distance]: {
        value: (valueInt) => valueInt ? `${valueInt} ft.` : ''
    },
    [FeatureModifierType.EnergyResistance]: {
        value: (valueInt) => valueInt ? `${valueInt}/` : ''
    },
    [FeatureModifierType.AC]: {
        value: (valueInt) => valueInt ? `${valueInt} AC` : ''
    },
    [FeatureModifierType.SaveBonus]: {
        value: (valueInt) => valueInt ? `${valueInt} save bonus` : ''
    },
    [FeatureModifierType.SkillBonus]: {
        value: (valueInt) => valueInt ? `${valueInt} skill bonus` : ''
    },
    [FeatureModifierType.AttackBonus]: {
        value: (valueInt) => valueInt ? `${valueInt} attack bonus` : ''
    },
    [FeatureModifierType.SpellDC]: {
        value: (valueInt) => valueInt ? `${valueInt} spell DC` : ''
    },
    [FeatureModifierType.ClassSkill]: {
        value: (valueInt) => valueInt ? `${valueInt} class skill` : ''
    },
    [FeatureModifierType.DamageDice]: {
        value: (valueInt) => valueInt ? `${valueInt} damage dice` : ''
    },
    [FeatureModifierType.MovementSpeed]: {
        value: (valueInt) => valueInt ? `${valueInt} movement speed` : ''
    },
    [FeatureModifierType.Other]: {
        value: (valueInt) => valueInt ? `${valueInt}` : ''
    }
};

export function formatProgression(progression: FeatureProgressionWithRelations): { label: string; value: string; note?: string } {
    const featureName = progression.feature?.name || `Feature ${progression.featureId}`;
    const label = `${featureName}:`;

    // Extract value from modifiers if available
    let value = '';
    for (const modifier of progression.modifiers) {
        const formatter = PROGRESSION_FORMATTERS[modifier.modifierType];
        value += formatter.value(modifier.value);
    }

    // Extract note from effects if available
    let note: string | undefined;
    for (const effect of progression.effects) {
        if (effect.value) {
            note = effect.value;
        }
    }

    return {
        label,
        value,
        note
    };
}

export function formatDiceDisplay(expr: string): string {
    return expr
        .replace('/level', ' per level')
        .replace(/,max(\d+d?\d*)/, ' (max $1)');
}
