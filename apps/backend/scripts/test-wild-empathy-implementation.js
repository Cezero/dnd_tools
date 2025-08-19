import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

async function testWildEmpathyImplementation() {
    try {
        console.log('Testing Wild Empathy Implementation...\n');

        // 1. Test that Wild Empathy skill exists and is marked as analog
        console.log('1. Testing Wild Empathy skill...');
        const wildEmpathySkill = await prisma.skill.findFirst({
            where: { name: 'Wild Empathy' }
        });

        if (!wildEmpathySkill) {
            throw new Error('Wild Empathy skill not found');
        }

        if (!wildEmpathySkill.isAnalog) {
            throw new Error('Wild Empathy skill is not marked as analog');
        }

        console.log(`✅ Wild Empathy skill found with ID: ${wildEmpathySkill.id}, isAnalog: ${wildEmpathySkill.isAnalog}`);

        // 2. Test that Wild Empathy feature exists
        console.log('\n2. Testing Wild Empathy feature...');
        const wildEmpathyFeature = await prisma.feature.findFirst({
            where: { slug: 'wild-empathy' }
        });

        if (!wildEmpathyFeature) {
            throw new Error('Wild Empathy feature not found');
        }

        console.log(`✅ Wild Empathy feature found with ID: ${wildEmpathyFeature.id}`);

        // 3. Test that Druid and Ranger classes have Wild Empathy progressions
        console.log('\n3. Testing class progressions...');

        const druidClass = await prisma.class.findFirst({
            where: { name: 'Druid', editionId: 4 }
        });

        const rangerClass = await prisma.class.findFirst({
            where: { name: 'Ranger', editionId: 4 }
        });

        if (!druidClass) {
            throw new Error('Druid class not found');
        }

        if (!rangerClass) {
            throw new Error('Ranger class not found');
        }

        console.log(`✅ Druid class found with ID: ${druidClass.id}`);
        console.log(`✅ Ranger class found with ID: ${rangerClass.id}`);

        // 4. Test that both classes have Wild Empathy feature progressions
        const druidProgression = await prisma.featureProgression.findFirst({
            where: {
                featureId: wildEmpathyFeature.id,
                classId: druidClass.id
            }
        });

        const rangerProgression = await prisma.featureProgression.findFirst({
            where: {
                featureId: wildEmpathyFeature.id,
                classId: rangerClass.id
            }
        });

        if (!druidProgression) {
            throw new Error('Druid Wild Empathy progression not found');
        }

        if (!rangerProgression) {
            throw new Error('Ranger Wild Empathy progression not found');
        }

        console.log(`✅ Druid Wild Empathy progression found with ID: ${druidProgression.id}`);
        console.log(`✅ Ranger Wild Empathy progression found with ID: ${rangerProgression.id}`);

        // 5. Test that both progressions have Wild Empathy skill modifiers
        const druidModifier = await prisma.featureModifier.findFirst({
            where: {
                featureProgressionId: druidProgression.id,
                appliesTo: 1, // ModifierAppliesToType.Skill
                appliesToId: wildEmpathySkill.id
            }
        });

        const rangerModifier = await prisma.featureModifier.findFirst({
            where: {
                featureProgressionId: rangerProgression.id,
                appliesTo: 1, // ModifierAppliesToType.Skill
                appliesToId: wildEmpathySkill.id
            }
        });

        if (!druidModifier) {
            throw new Error('Druid Wild Empathy modifier not found');
        }

        if (!rangerModifier) {
            throw new Error('Ranger Wild Empathy modifier not found');
        }

        console.log(`✅ Druid Wild Empathy modifier found with ID: ${druidModifier.id}`);
        console.log(`✅ Ranger Wild Empathy modifier found with ID: ${rangerModifier.id}`);

        // 6. Test that other classes don't have Wild Empathy
        console.log('\n4. Testing that other classes don\'t have Wild Empathy...');

        const otherClasses = await prisma.class.findMany({
            where: {
                name: { notIn: ['Druid', 'Ranger'] },
                editionId: 4
            },
            take: 3 // Test a few other classes
        });

        for (const otherClass of otherClasses) {
            const otherProgression = await prisma.featureProgression.findFirst({
                where: {
                    featureId: wildEmpathyFeature.id,
                    classId: otherClass.id
                }
            });

            if (otherProgression) {
                console.log(`⚠️  Warning: ${otherClass.name} has Wild Empathy progression (ID: ${otherProgression.id})`);
            } else {
                console.log(`✅ ${otherClass.name} correctly does not have Wild Empathy`);
            }
        }

        console.log('\n🎉 All tests passed! Wild Empathy implementation is working correctly.');
        console.log('\nSummary:');
        console.log(`- Wild Empathy skill (ID: ${wildEmpathySkill.id}) is marked as analog`);
        console.log(`- Wild Empathy feature (ID: ${wildEmpathyFeature.id}) exists`);
        console.log(`- Druid (ID: ${druidClass.id}) has Wild Empathy progression (ID: ${druidProgression.id})`);
        console.log(`- Ranger (ID: ${rangerClass.id}) has Wild Empathy progression (ID: ${rangerProgression.id})`);
        console.log(`- Both classes have proper skill modifiers`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testWildEmpathyImplementation()
    .then(() => {
        console.log('\nTest completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nTest failed:', error);
        process.exit(1);
    });
