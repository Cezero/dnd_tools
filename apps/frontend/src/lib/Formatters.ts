import { FeatureProgressionWithRelations } from "@shared/schema";
import {
    ASPECT_FORMATTERS,
    FeatureModifierType,
    FeatureBonusType,
    ABILITY_MAP,
    SKILL_SELECT_LIST,
    SAVING_THROW_SELECT_LIST,
    SKILL_MAP,
    RPG_DICE,
    DAMAGE_TYPES,
    SAVING_THROW_MAP
} from "@shared/static-data";

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

// Helper function to create formatters
const fmt = (fn: (valueInt: number, appliesTo: number, bonusType?: number | null) => string) => ({
    value: (valueInt: number | null, appliesToType?: number | null, appliesTo?: number | null, bonusType?: number | null) =>
        fn(valueInt ?? 0, appliesTo ?? 0, bonusType)
});

// Default progression formatters
export const PROGRESSION_FORMATTERS = {
    [FeatureModifierType.Attribute]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `${ABILITY_MAP[appliesTo]?.abbreviation || ''}: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.SavingThrow]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `${SAVING_THROW_MAP[appliesTo]?.abbreviation || ''}: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.Skill]: fmt((valueInt, appliesTo, bonusType) => {
        let skillName = '';
        if (appliesTo === -1) {
            skillName = 'Any Skill';
        } else {
            skillName = SKILL_MAP[appliesTo]?.name || '';
        }
        const base = `${skillName}: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.AC]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `AC: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.Dice]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `${valueInt}${RPG_DICE[appliesTo]?.name || `${valueInt} Unknown Die`}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.UsesPerDay]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `${valueInt}/day`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.DamageType]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `${valueInt}/${DAMAGE_TYPES[appliesTo]?.name || `${valueInt} Unknown Damage Type`}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.MovementSpeed]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `+${valueInt} ft.`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.Distance]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `+${valueInt} ft.`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.Attack]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `Attack: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.Damage]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `Damage: ${valueInt > 0 ? `+${valueInt}` : valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.NumTargets]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `${valueInt} targets`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    }),
    [FeatureModifierType.Other]: fmt((valueInt, appliesTo, bonusType) => {
        const base = `${valueInt}`;
        return bonusType !== null && bonusType !== undefined ? `${base} (${Object.keys(FeatureBonusType)[bonusType]?.toLowerCase() || 'unknown'})` : base;
    })
};

export function formatProgression(progression: FeatureProgressionWithRelations): { label: string; value: string; note?: string } {
    const featureName = progression.feature?.name || `Feature ${progression.featureId}`;
    const label = `${featureName}:`;

    // Extract value from modifiers if available
    let value = '';
    for (let i = 0; i < progression.modifiers.length; i++) {
        const modifier = progression.modifiers[i];
        const formatter = PROGRESSION_FORMATTERS[modifier.modifierType];

        // Safety check: if formatter doesn't exist, skip this modifier
        if (!formatter) {
            console.warn(`No formatter found for modifier type: ${modifier.modifierType}`);
            continue;
        }

        const modifierValue = formatter.value(modifier.value, undefined, modifier.appliesTo, modifier.bonusType);

        if (modifierValue) {
            if (value) {
                value += ', ';
            }
            value += modifierValue;
        }
    }

    // Extract note from effects if available
    let note: string | undefined;
    for (const effect of progression.effects) {
        if (effect.value) {
            note = effect.value;
        }
    }

    // Add prerequisite information to note if available
    if (progression.prerequisites && progression.prerequisites.length > 0) {
        const prereqNotes = progression.prerequisites.map(prereq => {
            if (prereq.type === 0) { // SkillRanks
                const skillName = SKILL_MAP[prereq.skillId || 0]?.name || 'Unknown Skill';
                return `${skillName} ${prereq.minValue} ranks`;
            }
            return `Prerequisite ${prereq.minValue}`;
        });

        if (note) {
            note += `; ${prereqNotes.join(', ')}`;
        } else {
            note = prereqNotes.join(', ');
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
