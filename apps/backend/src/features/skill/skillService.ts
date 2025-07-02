import { PrismaClient, Prisma } from '@shared/prisma-client';
import { CreateSkillRequest, SkillIdParamRequest, SkillQueryRequest, UpdateSkillRequest } from '@shared/schema';

import type { SkillService } from './types';

const prisma = new PrismaClient();

export const skillService: SkillService = {
    async getSkills(query: SkillQueryRequest) {
        const skip = (query.page - 1) * query.limit;

        // Build where clause for filtering
        const where: Prisma.SkillWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }

        if (query.abilityId) {
            where.abilityId = query.abilityId;
        }

        if (query.trainedOnly !== undefined) {
            where.trainedOnly = query.trainedOnly;
        }

        if (query.affectedByArmor !== undefined) {
            where.affectedByArmor = query.affectedByArmor;
        }

        const [skills, total] = await Promise.all([
            prisma.skill.findMany({
                where,
                skip,
                take: query.limit,
                orderBy: { name: 'asc' }
            }),
            prisma.skill.count({ where })
        ]);

        return {
            page: query.page,
            limit: query.limit,
            total,
            results: skills
        };
    },

    async getSkillById(id: SkillIdParamRequest) {
        const skill = await prisma.skill.findUnique({
            where: { id: id.id }
        });
        return skill;
    },

    async createSkill(data: CreateSkillRequest) {
        const skill = await prisma.skill.create({
            data
        });
        return { id: skill.id, message: 'Skill created successfully' };
    },

    async updateSkill(id: SkillIdParamRequest, data: UpdateSkillRequest) {
        await prisma.skill.update({
            where: { id: id.id },
            data
        });
        return { message: 'Skill updated successfully' };
    },

    async deleteSkill(id: SkillIdParamRequest) {
        await prisma.skill.delete({
            where: { id: id.id }
        });
        return { message: 'Skill deleted successfully' };
    }
};