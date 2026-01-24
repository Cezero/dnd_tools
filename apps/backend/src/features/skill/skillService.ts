import { prisma } from '@/lib/prisma';
import { CreateResponse, CreateSkillRequest, GetSkillResponse, SkillIdParamRequest, UpdateResponse, UpdateSkillRequest, GetAllSkillsResponse, SkillCacheResponse } from '@shared/schema';

import type { SkillService } from './types';

export const skillService: SkillService = {
    async getAllSkills(): Promise<GetAllSkillsResponse> {
        const [skills] = await Promise.all([
            prisma.skill.findMany({
                orderBy: { name: 'asc' },
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
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
            where: { id: id.id },
            include: {
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                },
            },
        });
        return skill;
    },

    async createSkill(data: CreateSkillRequest): Promise<CreateResponse> {
        const skill = await prisma.skill.create({
            data: {
                ...data,
                sourceBookInfo: {
                    create: data.sourceBookInfo?.map(source => ({
                        sourceBookId: source.sourceBookId,
                        pageNumber: source.pageNumber
                    })) || []
                },
            },
        });
        return { id: skill.id.toString(), message: 'Skill created successfully' };
    },

    async updateSkill(id: SkillIdParamRequest, data: UpdateSkillRequest): Promise<UpdateResponse> {
        await prisma.skill.update({
            where: { id: id.id },
            data: {
                ...data,
                sourceBookInfo: {
                    create: data.sourceBookInfo?.map(source => ({
                        sourceBookId: source.sourceBookId,
                        pageNumber: source.pageNumber
                    })) || []
                },
            },
        });
        return { message: 'Skill updated successfully' };
    },

    async deleteSkill(id: SkillIdParamRequest): Promise<UpdateResponse> {
        await prisma.skill.delete({
            where: { id: id.id }
        });
        return { message: 'Skill deleted successfully' };
    },

    /**
     * Get skill cache data for frontend use
     * Returns lightweight skill data including subtypes and special flags
     * This cache is used by the frontend to avoid repeated database queries
     * @returns Skill cache response with skills and their subtypes
     */
    async getSkillCache(): Promise<SkillCacheResponse> {
        const skills = await prisma.skill.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                abilityId: true,
                trainedOnly: true,
                editionId: true,
                isVisible: true,
                isAnalog: true,
                hasSubtypes: true,
                usesCustomSubtype: true,
                hasNoMaxRanks: true,
                doubleArmorPenalty: true,
                subtypes: {
                    select: {
                        id: true,
                        name: true,
                        editionId: true,
                        isVisible: true,
                    },
                    orderBy: { name: 'asc' },
                },
            }
        });

        return {
            total: skills.length,
            results: skills,
        };
    },
};
