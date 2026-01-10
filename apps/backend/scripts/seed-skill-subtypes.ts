import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

/**
 * Craft skill subtypes data
 */
const craftSubtypes = [
    { name: 'alchemy' },
    { name: 'armorsmithing' },
    { name: 'basketweaving' },
    { name: 'bookbinding' },
    { name: 'bowmaking' },
    { name: 'blacksmithing' },
    { name: 'calligraphy' },
    { name: 'carpentry' },
    { name: 'cobbling' },
    { name: 'gemcutting' },
    { name: 'glassblowing' },
    { name: 'leatherworking' },
    { name: 'locksmithing' },
    { name: 'painting' },
    { name: 'poisonmaking' },
    { name: 'pottery' },
    { name: 'sculpting' },
    { name: 'shipmaking' },
    { name: 'siege engines' },
    { name: 'stonemasonry' },
    { name: 'trapmaking' },
    { name: 'tattooing' },
    { name: 'weaponsmithing' },
    { name: 'weaving' },
];

/**
 * Knowledge skill subtypes data
 */
const knowledgeSubtypes = [
    { name: 'arcana' },
    { name: 'architecture and engineering' },
    { name: 'dungeoneering' },
    { name: 'geography' },
    { name: 'history' },
    { name: 'local' },
    { name: 'nature' },
    { name: 'nobility and royalty' },
    { name: 'religion' },
    { name: 'the planes' },
];

async function seedSkillSubtypes() {
    try {
        console.log('Starting skill subtype seeding...');

        // Get skill records by name to find their IDs and editionIds
        const craftSkill = await prisma.skill.findFirst({
            where: { name: 'Craft' },
        });
        const knowledgeSkill = await prisma.skill.findFirst({
            where: { name: 'Knowledge' },
        });
        const performSkill = await prisma.skill.findFirst({
            where: { name: 'Perform' },
        });
        const professionSkill = await prisma.skill.findFirst({
            where: { name: 'Profession' },
        });
        const speakLanguageSkill = await prisma.skill.findFirst({
            where: { name: 'Speak Language' },
        });
        const swimSkill = await prisma.skill.findFirst({
            where: { name: 'Swim' },
        });

        if (!craftSkill || !knowledgeSkill || !performSkill || !professionSkill) {
            throw new Error('Required skills (Craft, Knowledge, Perform, Profession) not found in database');
        }

        if (!speakLanguageSkill) {
            console.warn('Warning: Speak Language skill not found. Skipping hasNoMaxRanks flag update.');
        }

        if (!swimSkill) {
            console.warn('Warning: Swim skill not found. Skipping doubleArmorPenalty flag update.');
        }

        // Update skill flags
        console.log('Updating skill flags...');
        
        // Update Craft skill
        await prisma.skill.update({
            where: { id: craftSkill.id },
            data: { hasSubtypes: true },
        });
        console.log(`Updated Craft skill (ID: ${craftSkill.id}) - set hasSubtypes: true`);

        // Update Knowledge skill
        await prisma.skill.update({
            where: { id: knowledgeSkill.id },
            data: { hasSubtypes: true },
        });
        console.log(`Updated Knowledge skill (ID: ${knowledgeSkill.id}) - set hasSubtypes: true`);

        // Update Perform skill
        await prisma.skill.update({
            where: { id: performSkill.id },
            data: { usesCustomSubtype: true },
        });
        console.log(`Updated Perform skill (ID: ${performSkill.id}) - set usesCustomSubtype: true`);

        // Update Profession skill
        await prisma.skill.update({
            where: { id: professionSkill.id },
            data: { usesCustomSubtype: true },
        });
        console.log(`Updated Profession skill (ID: ${professionSkill.id}) - set usesCustomSubtype: true`);

        // Update Speak Language skill
        if (speakLanguageSkill) {
            await prisma.skill.update({
                where: { id: speakLanguageSkill.id },
                data: { hasNoMaxRanks: true },
            });
            console.log(`Updated Speak Language skill (ID: ${speakLanguageSkill.id}) - set hasNoMaxRanks: true`);
        }

        // Update Swim skill
        if (swimSkill) {
            await prisma.skill.update({
                where: { id: swimSkill.id },
                data: { doubleArmorPenalty: true },
            });
            console.log(`Updated Swim skill (ID: ${swimSkill.id}) - set doubleArmorPenalty: true`);
        }

        // Seed Craft subtypes
        console.log('\nSeeding Craft subtypes...');
        let craftInserted = 0;
        let craftSkipped = 0;

        for (const subtype of craftSubtypes) {
            try {
                // Check if subtype already exists
                const existing = await prisma.skillSubtype.findFirst({
                    where: {
                        skillId: craftSkill.id,
                        name: subtype.name,
                        editionId: craftSkill.editionId,
                    },
                });

                if (existing) {
                    console.log(`Skipping Craft subtype: ${subtype.name} - already exists`);
                    craftSkipped++;
                    continue;
                }

                // Create the subtype
                await prisma.skillSubtype.create({
                    data: {
                        skillId: craftSkill.id,
                        name: subtype.name,
                        editionId: craftSkill.editionId,
                        isVisible: true,
                    },
                });

                console.log(`Inserted Craft subtype: ${subtype.name}`);
                craftInserted++;
            } catch (error) {
                console.error(`Error processing Craft subtype ${subtype.name}:`, error);
            }
        }

        // Seed Knowledge subtypes
        console.log('\nSeeding Knowledge subtypes...');
        let knowledgeInserted = 0;
        let knowledgeSkipped = 0;

        for (const subtype of knowledgeSubtypes) {
            try {
                // Check if subtype already exists
                const existing = await prisma.skillSubtype.findFirst({
                    where: {
                        skillId: knowledgeSkill.id,
                        name: subtype.name,
                        editionId: knowledgeSkill.editionId,
                    },
                });

                if (existing) {
                    console.log(`Skipping Knowledge subtype: ${subtype.name} - already exists`);
                    knowledgeSkipped++;
                    continue;
                }

                // Create the subtype
                await prisma.skillSubtype.create({
                    data: {
                        skillId: knowledgeSkill.id,
                        name: subtype.name,
                        editionId: knowledgeSkill.editionId,
                        isVisible: true,
                    },
                });

                console.log(`Inserted Knowledge subtype: ${subtype.name}`);
                knowledgeInserted++;
            } catch (error) {
                console.error(`Error processing Knowledge subtype ${subtype.name}:`, error);
            }
        }

        console.log('\n=== Seeding Summary ===');
        console.log(`Craft subtypes - Inserted: ${craftInserted}, Skipped: ${craftSkipped}`);
        console.log(`Knowledge subtypes - Inserted: ${knowledgeInserted}, Skipped: ${knowledgeSkipped}`);
        console.log('\nSkill subtype seeding completed successfully!');

    } catch (error) {
        console.error('Error during skill subtype seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
seedSkillSubtypes()
    .then(() => {
        console.log('Skill subtype seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Skill subtype seeding failed:', error);
        process.exit(1);
    });
