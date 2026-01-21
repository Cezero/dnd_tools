import { FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType, FeaturePrerequisiteType } from '@shared/static-data';

/**
 * Extracts all entity IDs from feature features that need precaching for name resolution.
 * This includes entities referenced in feature features and prerequisites.
 */
export function extractEntityIdsForPrecaching(
    features: FeatureWithRelations[]
): {
    featIds: Set<number>;
    featureIds: Set<number>;
    spellIds: Set<number>;
    domainIds: Set<number>;
    classIds: Set<number>;
    skillIds: Set<number>;
    raceIds: Set<number>;
} {
    const featIds = new Set<number>();
    const featureIds = new Set<number>();
    const spellIds = new Set<number>();
    const domainIds = new Set<number>();
    const classIds = new Set<number>();
    const skillIds = new Set<number>();
    const raceIds = new Set<number>();

    for (const feature of features) {
        // Extract entity IDs from feature entities
        if (feature.entities) {
            for (const entity of feature.entities) {
                if (entity.appliesToId) {
                    switch (entity.appliesTo) {
                        case EntityAppliesToType.Feat:
                            featIds.add(entity.appliesToId);
                            break;
                        case EntityAppliesToType.Feature:
                            featureIds.add(entity.appliesToId);
                            break;
                        case EntityAppliesToType.Spell:
                            spellIds.add(entity.appliesToId);
                            break;
                        case EntityAppliesToType.Domain:
                            domainIds.add(entity.appliesToId);
                            break;
                        case EntityAppliesToType.Skill:
                            skillIds.add(entity.appliesToId);
                            break;
                        default:
                            // Other entity types don't need precaching for name resolution
                            break;
                    }
                }
            }
        }

        // Extract entity IDs from prerequisites
        if (feature.prerequisites) {
            for (const prereq of feature.prerequisites) {
                if (prereq.appliesToId) {
                    switch (prereq.type) {
                        case FeaturePrerequisiteType.Feat:
                            featIds.add(prereq.appliesToId);
                            break;
                        case FeaturePrerequisiteType.ClassLevel:
                            // Skip -1 which is used as a placeholder
                            if (prereq.appliesToId !== -1) {
                                classIds.add(prereq.appliesToId);
                            }
                            break;
                        case FeaturePrerequisiteType.SkillRanks:
                            skillIds.add(prereq.appliesToId);
                            break;
                        case FeaturePrerequisiteType.ClassFeature:
                            // Class features are features, not classes
                            featureIds.add(prereq.appliesToId);
                            break;
                        default:
                            // Other prerequisite types don't need precaching
                            break;
                    }
                }
            }
        }
    }

    return {
        featIds,
        featureIds,
        spellIds,
        domainIds,
        classIds,
        skillIds,
        raceIds,
    };
}
