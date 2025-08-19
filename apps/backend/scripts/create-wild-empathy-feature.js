import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

async function createWildEmpathyFeature() {
    try {
        console.log('Creating Wild Empathy feature...');

        // First, check if the Wild Empathy feature already exists
        let wildEmpathyFeature = await prisma.feature.findFirst({
            where: { slug: 'wild-empathy' }
        });

        if (!wildEmpathyFeature) {
            // Create the Wild Empathy feature
            wildEmpathyFeature = await prisma.feature.create({
                data: {
                    slug: 'wild-empathy',
                    name: 'Wild Empathy',
                    description: 'A ranger can improve the attitude of an animal. This ability functions just like a Diplomacy check to improve the attitude of a person. The ranger rolls 1d20 and adds his ranger level and his Charisma modifier to determine the wild empathy check result. The typical domestic animal has a starting attitude of indifferent, while wild animals are usually unfriendly.',
                },
            });
            console.log(`Created Wild Empathy feature with ID: ${wildEmpathyFeature.id}`);
        } else {
            console.log(`Wild Empathy feature already exists with ID: ${wildEmpathyFeature.id}`);
        }

        // Get Druid and Ranger class IDs (edition 4 - D&D 3.5)
        const druidClass = await prisma.class.findFirst({
            where: {
                name: 'Druid',
                editionId: 4,
            },
        });

        const rangerClass = await prisma.class.findFirst({
            where: {
                name: 'Ranger',
                editionId: 4,
            },
        });

        if (!druidClass) {
            throw new Error('Druid class not found');
        }

        if (!rangerClass) {
            throw new Error('Ranger class not found');
        }

        console.log(`Found Druid class ID: ${druidClass.id}`);
        console.log(`Found Ranger class ID: ${rangerClass.id}`);

        // Check if progressions already exist
        let druidProgression = await prisma.featureProgression.findFirst({
            where: {
                featureId: wildEmpathyFeature.id,
                classId: druidClass.id,
            },
        });

        let rangerProgression = await prisma.featureProgression.findFirst({
            where: {
                featureId: wildEmpathyFeature.id,
                classId: rangerClass.id,
            },
        });

        // Create feature progressions for both classes if they don't exist
        if (!druidProgression) {
            druidProgression = await prisma.featureProgression.create({
                data: {
                    sourceType: 1, // Class
                    level: 1,
                    featureId: wildEmpathyFeature.id,
                    appliesToType: 0, // Skill
                    classId: druidClass.id,
                },
            });
            console.log(`Created Druid progression with ID: ${druidProgression.id}`);
        } else {
            console.log(`Druid progression already exists with ID: ${druidProgression.id}`);
        }

        if (!rangerProgression) {
            rangerProgression = await prisma.featureProgression.create({
                data: {
                    sourceType: 1, // Class
                    level: 1,
                    featureId: wildEmpathyFeature.id,
                    appliesToType: 0, // Skill
                    classId: rangerClass.id,
                },
            });
            console.log(`Created Ranger progression with ID: ${rangerProgression.id}`);
        } else {
            console.log(`Ranger progression already exists with ID: ${rangerProgression.id}`);
        }

        // Check if modifiers already exist
        let druidModifier = await prisma.featureModifier.findFirst({
            where: {
                featureProgressionId: druidProgression.id,
                appliesTo: 1, // ModifierAppliesToType.Skill
                appliesToId: 48, // Wild Empathy skill ID
            },
        });

        let rangerModifier = await prisma.featureModifier.findFirst({
            where: {
                featureProgressionId: rangerProgression.id,
                appliesTo: 1, // ModifierAppliesToType.Skill
                appliesToId: 48, // Wild Empathy skill ID
            },
        });

        // Create feature modifiers that grant the Wild Empathy skill (ID: 48)
        if (!druidModifier) {
            druidModifier = await prisma.featureModifier.create({
                data: {
                    featureProgressionId: druidProgression.id,
                    type: 3, // ModifierType.Other
                    value: 0, // No bonus value, just marking as granted
                    appliesTo: 1, // ModifierAppliesToType.Skill
                    appliesToId: 48, // Wild Empathy skill ID
                    bonusType: null,
                },
            });
            console.log(`Created Druid modifier with ID: ${druidModifier.id}`);
        } else {
            console.log(`Druid modifier already exists with ID: ${druidModifier.id}`);
        }

        if (!rangerModifier) {
            rangerModifier = await prisma.featureModifier.create({
                data: {
                    featureProgressionId: rangerProgression.id,
                    type: 3, // ModifierType.Other
                    value: 0, // No bonus value, just marking as granted
                    appliesTo: 1, // ModifierAppliesToType.Skill
                    appliesToId: 48, // Wild Empathy skill ID
                    bonusType: null,
                },
            });
            console.log(`Created Ranger modifier with ID: ${rangerModifier.id}`);
        } else {
            console.log(`Ranger modifier already exists with ID: ${rangerModifier.id}`);
        }

        console.log('Wild Empathy feature successfully created and added to Druid and Ranger classes!');

    } catch (error) {
        console.error('Error creating Wild Empathy feature:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createWildEmpathyFeature()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
