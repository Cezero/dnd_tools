import { prisma } from '@/lib/prisma';

/**
 * Service for managing skill subtypes (Craft and Knowledge subtypes)
 */
export const skillSubtypeService = {
    /**
     * Get all subtypes for a specific skill
     * @param skillId - The skill ID to get subtypes for
     * @returns Array of skill subtypes
     */
    async getSkillSubtypes(skillId: number) {
        return await prisma.skillSubtype.findMany({
            where: { skillId },
            orderBy: { name: 'asc' },
        });
    },

    /**
     * Get a specific skill subtype by ID
     * @param skillId - The skill ID
     * @param subtypeId - The subtype ID
     * @returns The skill subtype or null if not found
     */
    async getSkillSubtypeById(skillId: number, subtypeId: number) {
        return await prisma.skillSubtype.findFirst({
            where: {
                id: subtypeId,
                skillId: skillId,
            },
        });
    },
};
