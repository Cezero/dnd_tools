import {
    FeatureProgression,
    CharacterWithAllDetailsResponse,
    CharacterAdvancementWithDetailsResponse,
    DnDClass
} from '@shared/schema';
import {
    EntityAppliesToType,
    EntityType,
    SpecialFeatureId,
} from '@shared/static-data';

// Type alias for the feature progression with relations
type FeatureProgressionWithRelations = FeatureProgression;

export class ClassSkillService {
    /**
     * Extract class skills from feature progressions
     */
    static getClassSkills(progressions: FeatureProgression[]): number[] {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill)
            .flatMap(prog =>
                prog.entities
                    ?.filter(entity => entity.appliesTo === EntityAppliesToType.Skill && entity.appliesToId)
                    .map(entity => entity.appliesToId) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Add a skill to class skills progression
     */
    static addSkill(
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
    }

    /**
     * Remove a skill from class skills progression
     */
    static removeSkill(
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

    /**
     * Calculate the total skill bonus for a specific skill across all advancements
     * Takes into account class skill status per advancement and handles half-ranks properly
     * @param character The character with all advancement data
     * @param skillId The skill ID to calculate for
     * @param abilityScore The character's ability score for this skill
     * @param classDetailsMap Map of class ID to class details for looking up class skills
     * @returns The total skill bonus (always an integer)
     */
    static calculateSkillTotal(
        character: CharacterWithAllDetailsResponse,
        skillId: number,
        abilityScore: number,
        classDetailsMap: Map<number, DnDClass> = new Map()
    ): number {
        const abilityModifier = Math.floor((abilityScore - 10) / 2);
        let totalRanks = 0;

        // Sum up ranks from all advancements, respecting class skill status per advancement
        character.advancements.forEach(advancement => {
            const advancementSkills = advancement.skills || [];

            // Find all skill entries for this skill ID in this advancement
            const skillEntries = advancementSkills.filter(skill => skill.skillId === skillId);

            skillEntries.forEach(skillEntry => {
                const pointsSpent = skillEntry.pointsSpent || 0;

                // Check if this skill is a class skill for this specific advancement's class
                const isClassSkill = this.isSkillClassSkillForAdvancement(
                    classDetailsMap,
                    advancement,
                    skillId,
                    skillEntry.skillSubId,
                    skillEntry.customSubtype
                );

                if (isClassSkill) {
                    // Class skills: 1 point = 1 rank
                    totalRanks += pointsSpent;
                } else {
                    // Cross-class skills: 2 points = 1 rank
                    totalRanks += pointsSpent * 0.5;
                }
            });
        });

        // Total is always an integer (floor the ranks + ability modifier)
        return Math.floor(totalRanks) + abilityModifier;
    }

    /**
     * Check if a skill is a class skill for a specific advancement
     * @param classes Array of class details
     * @param advancement The specific advancement to check
     * @param skillId The skill ID
     * @param skillSubId Optional skill subtype ID
     * @param customSubtype Optional custom subtype
     * @returns True if the skill is a class skill for this advancement
     */
    private static isSkillClassSkillForAdvancement(
        classDetailsMap: Map<number, DnDClass>,
        advancement: CharacterAdvancementWithDetailsResponse,
        skillId: number,
        skillSubId?: number | null,
        _customSubtype?: string | null
    ): boolean {
        if (!advancement.classId) return false;

        const classDetails = classDetailsMap.get(advancement.classId);
        if (!classDetails?.features) return false;

        // Check if the specific subtype is a class skill
        const isSpecificSubtypeClassSkill = this.isSkillSubtypeClassSkillForClass(
            classDetails.features,
            skillId,
            skillSubId
        );

        if (isSpecificSubtypeClassSkill) {
            return true;
        }

        // Check if the parent skill is a class skill with appliesToSubId: -1 (all subtypes)
        const isParentSkillClassSkill = this.isSkillClassSkillForClass(
            classDetails.features,
            skillId
        );

        return isParentSkillClassSkill;
    }

    /**
     * Check if a skill is a class skill for a specific class (helper method)
     * @param features The class features
     * @param skillId The skill ID
     * @returns True if the skill is a class skill
     */
    private static isSkillClassSkillForClass(
        features: FeatureProgressionWithRelations[],
        skillId: number
    ): boolean {
        return features.some(prog =>
            prog.featureId === SpecialFeatureId.ClassSkill &&
            prog.entities?.some(entity =>
                entity.appliesTo === EntityAppliesToType.Skill &&
                entity.appliesToId === skillId &&
                entity.appliesToSubId === -1 // All subtypes
            )
        );
    }

    /**
     * Check if a specific skill subtype is a class skill for a specific class (helper method)
     * @param features The class features
     * @param skillId The skill ID
     * @param skillSubId The skill subtype ID
     * @returns True if the specific subtype is a class skill
     */
    private static isSkillSubtypeClassSkillForClass(
        features: FeatureProgressionWithRelations[],
        skillId: number,
        skillSubId?: number | null
    ): boolean {
        return features.some(prog =>
            prog.featureId === SpecialFeatureId.ClassSkill &&
            prog.entities?.some(entity =>
                entity.appliesTo === EntityAppliesToType.Skill &&
                entity.appliesToId === skillId &&
                entity.appliesToSubId === skillSubId
            )
        );
    }
};
