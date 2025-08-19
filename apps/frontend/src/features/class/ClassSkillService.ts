import {
    FeatureProgressionWithRelations,
} from '@shared/schema';
import {
    ModifierAppliesToType,
    ModifierType,
    FeatureSpecialEffectType,
    FeatureAppliesToType,
    SpecialFeatureId,
} from '@shared/static-data';

export const ClassSkillService = {
    /**
     * Extract class skills from feature progressions
     */
    getClassSkills(progressions: FeatureProgressionWithRelations[]): number[] {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill && prog.appliesToType === FeatureAppliesToType.Skill)
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
            fp.featureId === SpecialFeatureId.ClassSkill && fp.appliesToType === FeatureAppliesToType.Skill
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
                appliesToType: FeatureAppliesToType.Skill,
                appliesTo: null, // No specific skill, this is the container progression
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
            setFeatureProgressions([...featureProgressions, classSkillsProgression]);
            return;
        }

        // Check if this specific skill is already added
        const existingSkillModifier = classSkillsProgression.modifiers?.find(m =>
            m.appliesTo === ModifierAppliesToType.Skill && m.appliesToId === skillId
        );

        if (existingSkillModifier) {
            // Skill already exists, don't add duplicate
            return;
        }

        // Add the skill as a modifier to the existing progression
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

        // Create a new array with the updated progression
        const updatedProgressions = featureProgressions.map(p => {
            if (p.id === classSkillsProgression.id) {
                return {
                    ...p,
                    modifiers: [...(p.modifiers || []), newModifier]
                };
            }
            return p;
        });

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
            if (prog.featureId === SpecialFeatureId.ClassSkill && prog.appliesToType === FeatureAppliesToType.Skill) {
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
            !(prog.featureId === SpecialFeatureId.ClassSkill && prog.appliesToType === FeatureAppliesToType.Skill) ||
            (prog.modifiers && prog.modifiers.length > 0)
        );

        setFeatureProgressions(finalProgressions);
    }
};
