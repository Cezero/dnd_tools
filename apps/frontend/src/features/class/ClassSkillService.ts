import {
    FeatureWithRelations,
    CharacterWithAllDetailsResponse,
    CharacterAdvancementWithDetailsResponse,
    DnDClass
} from '@shared/schema';
import {
    EntityAppliesToType,
    EntityType,
    FeatureSourceType,
} from '@shared/static-data';


export class ClassSkillService {
    /**
     * Extract class skills from feature features
     */
    static getClassSkills(features: FeatureWithRelations[]): number[] {
        return features
            .filter(prog => prog.sourceType === FeatureSourceType.Class)
            .flatMap(prog =>
                prog.entities
                    ?.filter(entity =>
                        entity.type === EntityType.Base &&
                        entity.appliesTo === EntityAppliesToType.Skill &&
                        entity.appliesToId
                    )
                    .map(entity => entity.appliesToId) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Add a skill to class skills feature
     */
    static addSkill(
        features: FeatureWithRelations[],
        setFeatures: (features: FeatureWithRelations[]) => void,
        skillId: number,
        classId: number,
        subtypeId?: number | null
    ) {
        // Find existing class skills feature (look for class feature with Base entities for skills)
        let classSkillsProgression = features.find(fp =>
            fp.sourceType === FeatureSourceType.Class &&
            fp.classes?.some(c => c.classId === classId) &&
            fp.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)
        );

        if (!classSkillsProgression) {
            // Get class name for feature name
            // Note: In a real scenario, we'd need to fetch the class name, but for now we'll use a placeholder
            // The backend will handle creating the proper feature and linking it to the class
            const tempFeatureId = Math.floor(Date.now() + Math.random() * 1000);
            classSkillsProgression = {
                id: tempFeatureId, // Temporary ID for frontend state
                slug: `class-${classId}-skills`,
                name: 'Class Skills',
                description: 'Class skill feature',
                displayInCharacterSheet: true,
                sourceType: FeatureSourceType.Class,
                level: 1, // Class skills are level 1 features
                domainId: null,
                featId: null,
                companionId: null,
                editionId: null,
                // classes array will be populated by backend based on context
                feature: {
                    id: tempFeatureId,
                    slug: `class-${classId}-skills`,
                    name: `Class Skills`,
                    description: 'Class skill feature',
                    displayInCharacterSheet: true,
                },
                entities: [],
            } as FeatureWithRelations;
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

        // Add the skill as an entity to the feature
        const newEntity = {
            id: Math.floor(Date.now() + Math.random() * 1000), // Temporary ID
            featureId: classSkillsProgression.id,
            type: EntityType.Base, // Use Base type for class skills
            appliesTo: EntityAppliesToType.Skill,
            appliesToId: skillId,
            value: 0, // No bonus value - just marking as class skill
            bonusType: null, // No bonus type needed for Base entities
            appliesToSubId: subtypeId || null,
            displayInDetail: true,
            filterType: null,
            groupingId: 1, // Group all class skills together as one feature
        };

        // Update the feature with the new entity
        const updatedProgression = {
            ...classSkillsProgression,
            entities: [...(classSkillsProgression.entities || []), newEntity]
        };

        // Update the features array
        const updatedProgressions = features.some(p => p.id === classSkillsProgression.id)
            ? features.map(p => p.id === classSkillsProgression.id ? updatedProgression : p)
            : [...features, updatedProgression];

        setFeatures(updatedProgressions);
    }

    /**
     * Remove a skill from class skills feature
     */
    static removeSkill(
        features: FeatureWithRelations[],
        setFeatures: (features: FeatureWithRelations[]) => void,
        skillId: number
    ) {
        const updatedProgressions = features.map(prog => {
            // Find class skill features (class source with Base skill entities)
            if (prog.sourceType === FeatureSourceType.Class &&
                prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)) {
                // Remove the specific skill entity
                const updatedEntities = prog.entities?.filter(entity =>
                    !(entity.type === EntityType.Base &&
                        entity.appliesTo === EntityAppliesToType.Skill &&
                        entity.appliesToId === skillId)
                ) || [];

                return {
                    ...prog,
                    entities: updatedEntities
                };
            }
            return prog;
        });

        // Remove the feature entirely if it has no entities left
        const finalProgressions = updatedProgressions.filter(prog =>
            !(prog.sourceType === FeatureSourceType.Class &&
                prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)) ||
            (prog.entities && prog.entities.length > 0)
        );

        setFeatures(finalProgressions);
    }

    static calculateSkillTotal(
        character: CharacterWithAllDetailsResponse,
        skillId: number,
        abilityScore: number,
        effectiveClassDetails?: DnDClass,
        classFeatures?: FeatureWithRelations[]
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
                    effectiveClassDetails,
                    advancement,
                    skillId,
                    skillEntry.skillSubId,
                    skillEntry.customSubtype,
                    classFeatures
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

    static isSkillClassSkillForAdvancement(
        effectiveClassDetails: DnDClass | undefined,
        advancement: CharacterAdvancementWithDetailsResponse,
        skillId: number,
        skillSubId?: number | null,
        _customSubtype?: string | null,
        classFeatures?: FeatureWithRelations[]
    ): boolean {
        const features = classFeatures ?? [];
        if (features.length === 0) return false;

        // Check if the specific subtype is a class skill
        const isSpecificSubtypeClassSkill = this.isSkillSubtypeClassSkillForClass(
            features,
            skillId,
            skillSubId
        );

        if (isSpecificSubtypeClassSkill) {
            return true;
        }

        // Check if the parent skill is a class skill with appliesToSubId: -1 (all subtypes)
        const isParentSkillClassSkill = this.isSkillClassSkillForClass(
            features,
            skillId
        );

        return isParentSkillClassSkill;
    }

    private static isSkillClassSkillForClass(
        features: FeatureWithRelations[],
        skillId: number
    ): boolean {
        return features.some(prog =>
            prog.sourceType === FeatureSourceType.Class &&
            prog.entities?.some(entity =>
                entity.type === EntityType.Base &&
                entity.appliesTo === EntityAppliesToType.Skill &&
                entity.appliesToId === skillId &&
                entity.appliesToSubId === -1 // All subtypes
            )
        );
    }

    private static isSkillSubtypeClassSkillForClass(
        features: FeatureWithRelations[],
        skillId: number,
        skillSubId?: number | null
    ): boolean {
        return features.some(prog =>
            prog.sourceType === FeatureSourceType.Class &&
            prog.entities?.some(entity =>
                entity.type === EntityType.Base &&
                entity.appliesTo === EntityAppliesToType.Skill &&
                entity.appliesToId === skillId &&
                entity.appliesToSubId === skillSubId
            )
        );
    }
};
