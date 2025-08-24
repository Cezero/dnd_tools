import {
    FeatureProgressionWithRelations,
} from '@shared/schema';
import {
    ModifierAppliesToType,
    ModifierType,
    FeatureSpecialEffectType,
    SpecialFeatureId,
} from '@shared/static-data';

export const ClassSkillService = {
    /**
 * Extract class skills from feature progressions
 */
    getClassSkills(progressions: FeatureProgressionWithRelations[]): number[] {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill)
            .flatMap(prog =>
                prog.modifiers
                    ?.filter(mod => mod.appliesTo === ModifierAppliesToType.Skill && mod.appliesToId)
                    .map(mod => mod.appliesToId) || []
            )
            .filter(id => id > 0);
    },

    /**
     * Add a skill to class skills progression
     */
    addSkill(
        featureProgressions: FeatureProgressionWithRelations[],
        setFeatureProgressions: (progressions: FeatureProgressionWithRelations[]) => void,
        skillId: number,
        classId: number
    ) {
        // Check if class skills progression already exists
        let classSkillsProgression = featureProgressions.find(fp =>
            fp.featureId === SpecialFeatureId.ClassSkill
        );

        if (!classSkillsProgression) {
            // Create the main class skills progression if it doesn't exist
            classSkillsProgression = {
                id: Date.now() + Math.random(), // Temporary ID for frontend state
                featureId: SpecialFeatureId.ClassSkill,
                sourceType: 1, // 1 for Class
                classId: classId,
                raceId: null,
                level: 1, // Class skills are level 1 features
                // REMOVED: appliesToType and appliesTo - redundant with SpecialFeatureId
                feature: {
                    id: SpecialFeatureId.ClassSkill,
                    slug: 'class-skill',
                    name: 'Class Skill',
                    description: 'Class skill feature',
                },
                modifiers: [],
                choices: [],
                effects: [],
            };
        }

        // Check if this specific skill is already added
        const existingSkillModifier = classSkillsProgression.modifiers?.find(m =>
            m.appliesTo === ModifierAppliesToType.Skill && m.appliesToId === skillId
        );

        if (existingSkillModifier) {
            // Skill already exists, don't add duplicate
            return;
        }

        // Add the skill as a modifier to the progression
        const newModifier = {
            id: Date.now() + Math.random(), // Temporary ID
            featureProgressionId: classSkillsProgression.id,
            type: ModifierType.Other, // Not a bonus, just marking as class skill
            appliesTo: ModifierAppliesToType.Skill,
            appliesToId: skillId,
            formulaParamsId: null,
            value: 0, // No bonus value - just marking as class skill
            bonusType: null, // No bonus type needed
            appliesIfChoiceKey: null,
            appliesIfChoiceValue: null,
        };

        // Update the progression with the new modifier
        const updatedProgression = {
            ...classSkillsProgression,
            modifiers: [...(classSkillsProgression.modifiers || []), newModifier]
        };

        // Update the progressions array
        const updatedProgressions = featureProgressions.some(p => p.id === classSkillsProgression.id)
            ? featureProgressions.map(p => p.id === classSkillsProgression.id ? updatedProgression : p)
            : [...featureProgressions, updatedProgression];

        setFeatureProgressions(updatedProgressions);
    },

    /**
     * Remove a skill from class skills progression
     */
    removeSkill(
        featureProgressions: FeatureProgressionWithRelations[],
        setFeatureProgressions: (progressions: FeatureProgressionWithRelations[]) => void,
        skillId: number
    ) {
        const updatedProgressions = featureProgressions.map(prog => {
            if (prog.featureId === SpecialFeatureId.ClassSkill) {
                // Remove the specific skill modifier
                const updatedModifiers = prog.modifiers?.filter(mod =>
                    !(mod.appliesTo === ModifierAppliesToType.Skill && mod.appliesToId === skillId)
                ) || [];

                return {
                    ...prog,
                    modifiers: updatedModifiers
                };
            }
            return prog;
        });

        // Remove the progression entirely if it has no modifiers left
        const finalProgressions = updatedProgressions.filter(prog =>
            !(prog.featureId === SpecialFeatureId.ClassSkill) ||
            (prog.modifiers && prog.modifiers.length > 0)
        );

        setFeatureProgressions(finalProgressions);
    }
};
