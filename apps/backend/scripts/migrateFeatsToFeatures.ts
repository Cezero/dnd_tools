import { PrismaClient } from '@shared/prisma-client';
import { FeatureSourceType, EntityType, EntityAppliesToType, FeaturePrerequisiteType } from '@shared/static-data';
import { FeatBenefitType, FeatPrerequisiteType } from '@shared/static-data';

const prisma = new PrismaClient();

/**
 * Map FeatBenefitType to EntityAppliesToType and EntityType
 */
function mapFeatBenefitToEntity(benefitTypeId: number): { appliesTo: number; entityType: number } {
    switch (benefitTypeId) {
        case FeatBenefitType.SKILL:
            return { appliesTo: EntityAppliesToType.Skill, entityType: EntityType.Bonus };
        case FeatBenefitType.SAVE:
            return { appliesTo: EntityAppliesToType.SavingThrow, entityType: EntityType.Bonus };
        case FeatBenefitType.PROFICIENCY:
            return { appliesTo: EntityAppliesToType.Feat, entityType: EntityType.Proficiency };
        case FeatBenefitType.ATTACK_BONUS:
            return { appliesTo: EntityAppliesToType.Attack, entityType: EntityType.Bonus };
        case FeatBenefitType.DAMAGE_BONUS:
            return { appliesTo: EntityAppliesToType.Damage, entityType: EntityType.Bonus };
        case FeatBenefitType.INITIATIVE:
            return { appliesTo: EntityAppliesToType.Initiative, entityType: EntityType.Bonus };
        case FeatBenefitType.CASTER_LEVEL:
            return { appliesTo: EntityAppliesToType.CasterLevel, entityType: EntityType.Bonus };
        case FeatBenefitType.DIFFICULTY_CLASS:
            return { appliesTo: EntityAppliesToType.SpellSvDC, entityType: EntityType.Bonus };
        default:
            return { appliesTo: EntityAppliesToType.Other, entityType: EntityType.Bonus };
    }
}

/**
 * Map FeatPrerequisiteType to FeaturePrerequisiteType
 */
function mapFeatPrerequisiteToFeaturePrerequisite(featPrereqTypeId: number): number {
    switch (featPrereqTypeId) {
        case FeatPrerequisiteType.ABILITY:
            return FeaturePrerequisiteType.AbilityScore;
        case FeatPrerequisiteType.SKILL:
            return FeaturePrerequisiteType.SkillRanks;
        case FeatPrerequisiteType.BAB:
            return FeaturePrerequisiteType.BaseAttackBonus;
        case FeatPrerequisiteType.CLASSLEVEL:
            return FeaturePrerequisiteType.ClassLevel;
        case FeatPrerequisiteType.FEAT:
            return FeaturePrerequisiteType.Feat;
        case FeatPrerequisiteType.SPELLCASTING:
            return FeaturePrerequisiteType.Spellcasting;
        case FeatPrerequisiteType.CLASSFEATURE:
            return FeaturePrerequisiteType.ClassFeature;
        case FeatPrerequisiteType.SIZE:
            return FeaturePrerequisiteType.Size;
        case FeatPrerequisiteType.SPECIAL:
            return FeaturePrerequisiteType.Other;
        case FeatPrerequisiteType.PROFICIENCY:
            return FeaturePrerequisiteType.Proficiency;
        default:
            return FeaturePrerequisiteType.Other;
    }
}

/**
 * Concatenate feat text fields into Feature.description with markdown headers
 */
function concatenateFeatDescription(feat: {
    description: string | null;
    benefit: string | null;
    normalEffect: string | null;
    specialEffect: string | null;
    prerequisites: string | null;
}): string {
    const descriptionParts: string[] = [];

    // Base description (if present)
    if (feat.description) {
        descriptionParts.push(feat.description);
    }

    // Benefit section (if present) - use markdown header
    if (feat.benefit) {
        descriptionParts.push(`\n\n## Benefit:\n${feat.benefit}`);
    }

    // Normal effect section (if present) - use markdown header
    if (feat.normalEffect) {
        descriptionParts.push(`\n\n## Normal:\n${feat.normalEffect}`);
    }

    // Special effect section (if present) - use markdown header
    if (feat.specialEffect) {
        descriptionParts.push(`\n\n## Special:\n${feat.specialEffect}`);
    }

    // Prerequisites section (if present) - use markdown header
    if (feat.prerequisites) {
        descriptionParts.push(`\n\n## Prerequisites:\n${feat.prerequisites}`);
    }

    return descriptionParts.join('');
}

async function migrateFeatsToFeatures() {
    try {
        console.log('Starting feat to feature migration...');

        // Get all feats with their benefits and prerequisites
        const feats = await prisma.feat.findMany({
            include: {
                benefits: {
                    orderBy: {
                        index: 'asc',
                    },
                },
                prereqs: {
                    orderBy: {
                        index: 'asc',
                    },
                },
            },
        });

        console.log(`Found ${feats.length} feats to migrate`);

        let featuresCreated = 0;
        let progressionsCreated = 0;
        let entitiesCreated = 0;
        let prerequisitesCreated = 0;
        let skipped = 0;

        for (const feat of feats) {
            try {
                // Check if Feature already exists for this feat
                const existingFeature = await prisma.feature.findFirst({
                    where: {
                        slug: `feat-${feat.id}`,
                    },
                });

                if (existingFeature) {
                    console.log(`Skipping feat ${feat.id} (${feat.name}) - Feature already exists`);
                    skipped++;
                    continue;
                }

                // Concatenate text fields into description
                const concatenatedDescription = concatenateFeatDescription({
                    description: feat.description,
                    benefit: feat.benefit,
                    normalEffect: feat.normalEffect,
                    specialEffect: feat.specialEffect,
                    prerequisites: feat.prerequisites,
                });

                // Create Feature record
                const feature = await prisma.feature.create({
                    data: {
                        slug: `feat-${feat.id}`,
                        name: feat.name,
                        description: concatenatedDescription || '',
                        summary: feat.summary || null,
                        displayInCharacterSheet: feat.isVisible,
                    },
                });

                featuresCreated++;

                // Create FeatureProgression
                const progression = await prisma.featureProgression.create({
                    data: {
                        sourceType: FeatureSourceType.Feat,
                        featId: feat.id,
                        featureId: feature.id,
                        level: 1, // Feats are available from level 1
                    },
                });

                progressionsCreated++;

                // Convert FeatBenefitMap entries to FeatureEntity
                for (const benefit of feat.benefits) {
                    const { appliesTo, entityType } = mapFeatBenefitToEntity(benefit.typeId);

                    await prisma.featureEntity.create({
                        data: {
                            progressionId: progression.id,
                            type: entityType,
                            appliesTo: appliesTo,
                            appliesToId: benefit.referenceId || null,
                            appliesToSubId: null,
                            value: benefit.amount || null,
                            bonusType: null,
                            groupingId: benefit.index,
                            displayInDetail: true,
                            filterType: null,
                        },
                    });

                    entitiesCreated++;
                }

                // Convert FeatPrerequisiteMap entries to FeaturePrerequisite
                for (const prereq of feat.prereqs) {
                    const featurePrereqType = mapFeatPrerequisiteToFeaturePrerequisite(prereq.typeId);

                    await prisma.featurePrerequisite.create({
                        data: {
                            featureId: feature.id,
                            type: featurePrereqType,
                            appliesToId: prereq.referenceId || null,
                            minValue: prereq.amount || 0,
                        },
                    });

                    prerequisitesCreated++;
                }

                if (featuresCreated % 100 === 0) {
                    console.log(`Processed ${featuresCreated} feats...`);
                }
            } catch (error) {
                console.error(`Error migrating feat ${feat.id} (${feat.name}):`, error);
                throw error;
            }
        }

        console.log('\nMigration complete!');
        console.log(`Features created: ${featuresCreated}`);
        console.log(`Progressions created: ${progressionsCreated}`);
        console.log(`Entities created: ${entitiesCreated}`);
        console.log(`Prerequisites created: ${prerequisitesCreated}`);
        console.log(`Skipped (already exists): ${skipped}`);
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
migrateFeatsToFeatures()
    .then(() => {
        console.log('Migration script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });

