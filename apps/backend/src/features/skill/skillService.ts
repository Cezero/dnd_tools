import { PrismaClient } from '@shared/prisma-client';
import { CreateResponse, CreateSkillRequest, GetSkillResponse, SkillIdParamRequest, UpdateResponse, UpdateSkillRequest, GetAllSkillsResponse } from '@shared/schema';

import type { SkillService } from './types';

const prisma = new PrismaClient();

export const skillService: SkillService = {
    async getAllSkills(): Promise<GetAllSkillsResponse> {
        const [skills] = await Promise.all([
            prisma.skill.findMany({
                orderBy: { name: 'asc' }
            }),
            prisma.skill.count()
        ]);

        return {
            total: skills.length,
            results: skills,
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
    },
};
