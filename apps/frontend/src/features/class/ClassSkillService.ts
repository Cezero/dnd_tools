import {
    FeatureProgression,
} from '@shared/schema';
import {
    EntityAppliesToType,
    EntityType,
    SpecialFeatureId,
} from '@shared/static-data';

export const ClassSkillService = {
    /**
 * Extract class skills from feature progressions
 */
    getClassSkills(progressions: FeatureProgression[]): number[] {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill)
            .flatMap(prog =>
                prog.entities
                    ?.filter(entity => entity.appliesTo === EntityAppliesToType.Skill && entity.appliesToId)
                    .map(entity => entity.appliesToId) || []
            )
            .filter(id => id > 0);
    },

    /**
     * Add a skill to class skills progression
     */
    addSkill(
        featureProgressions: FeatureProgression[],
        setFeatureProgressions: (progressions: FeatureProgression[]) => void,
        skillId: number,
        classId: number,
        subtypeId?: number | null
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
                entities: [],
            };
        }

        // Check if this specific skill with subtype is already added
        const existingSkillEntity = classSkillsProgression.entities?.find(e =>
            e.appliesTo === EntityAppliesToType.Skill &&
            e.appliesToId === skillId &&
            e.appliesToSubId === subtypeId
        );

        if (existingSkillEntity) {
            // Skill with this subtype already exists, don't add duplicate
            return;
        }

        // Add the skill as an entity to the progression
        const newEntity = {
            id: Date.now() + Math.random(), // Temporary ID
            progressionId: classSkillsProgression.id,
            type: EntityType.Other, // Not a bonus, just marking as class skill
            appliesTo: EntityAppliesToType.Skill,
            appliesToId: skillId,
            value: 0, // No bonus value - just marking as class skill
            bonusType: null, // No bonus type needed
            appliesToSubId: subtypeId || null,
            displayInDetail: true,
            filterType: null,
            groupingId: 1, // Group all class skills together as one feature
        };

        // Update the progression with the new entity
        const updatedProgression = {
            ...classSkillsProgression,
            entities: [...(classSkillsProgression.entities || []), newEntity]
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
        featureProgressions: FeatureProgression[],
        setFeatureProgressions: (progressions: FeatureProgression[]) => void,
        skillId: number
    ) {
        const updatedProgressions = featureProgressions.map(prog => {
            if (prog.featureId === SpecialFeatureId.ClassSkill) {
                // Remove the specific skill entity
                const updatedEntities = prog.entities?.filter(entity =>
                    !(entity.appliesTo === EntityAppliesToType.Skill && entity.appliesToId === skillId)
                ) || [];

                return {
                    ...prog,
                    entities: updatedEntities
                };
            }
            return prog;
        });

        // Remove the progression entirely if it has no entities left
        const finalProgressions = updatedProgressions.filter(prog =>
            !(prog.featureId === SpecialFeatureId.ClassSkill) ||
            (prog.entities && prog.entities.length > 0)
        );

        setFeatureProgressions(finalProgressions);
    }
};
