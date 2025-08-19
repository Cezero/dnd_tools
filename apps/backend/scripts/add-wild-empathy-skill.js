import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

async function addWildEmpathySkill() {
    try {
        console.log('Adding Wild Empathy skill to database...');

        // Check if Wild Empathy skill already exists
        const existingSkill = await prisma.skill.findFirst({
            where: { name: 'Wild Empathy' }
        });

        if (existingSkill) {
            console.log(`Wild Empathy skill already exists with ID: ${existingSkill.id}`);

            // Update it to be analog if it's not already
            if (!existingSkill.isAnalog) {
                await prisma.skill.update({
                    where: { id: existingSkill.id },
                    data: { isAnalog: true }
                });
                console.log('Updated Wild Empathy skill to be analog');
            } else {
                console.log('Wild Empathy skill is already marked as analog');
            }

            return existingSkill.id;
        }

        // Create the Wild Empathy skill
        const wildEmpathySkill = await prisma.skill.create({
            data: {
                name: 'Wild Empathy',
                abilityId: 6, // Charisma
                trainedOnly: true,
                isAnalog: true,
                description: 'A ranger can improve the attitude of an animal. This ability functions just like a Diplomacy check to improve the attitude of a person. The ranger rolls 1d20 and adds his ranger level and his Charisma modifier to determine the wild empathy check result.',
                checkDescription: 'Make a Wild Empathy check (1d20 + ranger level + Charisma modifier) to improve an animal\'s attitude.',
                actionDescription: 'Full-round action',
                retryTypeId: null,
                retryDescription: null,
                specialNotes: 'Only available to Druids and Rangers. Cannot be used on magical beasts.',
                synergyNotes: null,
                untrainedNotes: 'Cannot be used untrained.',
                affectedByArmor: false,
                restrictionNotes: 'Only available to characters with levels in Druid or Ranger classes.'
            }
        });

        console.log(`Created Wild Empathy skill with ID: ${wildEmpathySkill.id}`);
        return wildEmpathySkill.id;

    } catch (error) {
        console.error('Error adding Wild Empathy skill:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
addWildEmpathySkill()
    .then((skillId) => {
        console.log(`Script completed successfully. Wild Empathy skill ID: ${skillId}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
