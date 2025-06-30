import { PrismaClient, Prisma } from '@shared/prisma-client';

import type { SkillService } from './types';

const prisma = new PrismaClient();

export const skillService: SkillService = {
    async getAllSkills(query) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.SkillWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.abilityId) {
            where.abilityId = parseInt(query.abilityId);
        }
        if (query.trainedOnly !== undefined) {
            where.trainedOnly = query.trainedOnly === 'true';
        }
        if (query.affectedByArmor !== undefined) {
            where.affectedByArmor = query.affectedByArmor === 'true';
        }

        const [skills, total] = await Promise.all([
            prisma.skill.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.skill.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            results: skills,
        };
    },

    async getAllSkillsSimple() {
        const skills = await prisma.skill.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
        return skills;
    },

    async getSkillById(id) {
        const skill = await prisma.skill.findUnique({
            where: { id },
        });

        return skill;
    },

    async createSkill(data) {
        const result = await prisma.skill.create({
            data,
        });

        return { id: result.id, message: 'Skill created successfully' };
    },

    async updateSkill(id, data) {
        await prisma.skill.update({
            where: { id },
            data,
        });

        return { message: 'Skill updated successfully' };
    },

    async deleteSkill(id) {
        await prisma.skill.delete({
            where: { id },
        });
        return { message: 'Skill deleted successfully' };
    },
}; 