import { PrismaClient, Prisma } from '@shared/prisma-client';
import { CreateResponse, CreateSkillRequest, GetSkillResponse, SkillIdParamRequest, SkillQueryRequest, SkillQueryResponse, UpdateResponse, UpdateSkillRequest } from '@shared/schema';

import type { SkillService } from './types';

const prisma = new PrismaClient();

export const skillService: SkillService = {
    async getSkills(query: SkillQueryRequest): Promise<SkillQueryResponse> {
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

    async getSkillById(id: SkillIdParamRequest): Promise<GetSkillResponse | null> {
        const skill = await prisma.skill.findUnique({
            where: { id: id.id }
        });
        return skill;
    },

    async createSkill(data: CreateSkillRequest): Promise<CreateResponse> {
        const skill = await prisma.skill.create({
            data: {
                ...data,
            },
        });
        return { id: skill.id.toString(), message: 'Skill created successfully' };
    },

    async updateSkill(id: SkillIdParamRequest, data: UpdateSkillRequest): Promise<UpdateResponse> {
        await prisma.skill.update({
            where: { id: id.id },
            data
        });
        return { message: 'Skill updated successfully' };
    },

    async deleteSkill(id: SkillIdParamRequest): Promise<UpdateResponse> {
        await prisma.skill.delete({
            where: { id: id.id }
        });
        return { message: 'Skill deleted successfully' };
    }
};