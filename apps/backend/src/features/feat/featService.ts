import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    FeatIdParamRequest,
    FeatQueryRequest,
    CreateFeatRequest,
    UpdateFeatRequest,
    GetAllFeatsResponse,
    GetFeatResponse
} from '@shared/schema';

import type { FeatService } from './types';

const prisma = new PrismaClient();

export const featService: FeatService = {
    async getFeats(query: FeatQueryRequest) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.FeatWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.typeId) {
            where.typeId = query.typeId;
        }
        if (query.description) {
            where.description = { contains: query.description };
        }
        if (query.benefit) {
            where.benefit = { contains: query.benefit };
        }
        if (query.normalEffect) {
            where.normalEffect = { contains: query.normalEffect };
        }
        if (query.specialEffect) {
            where.specialEffect = { contains: query.specialEffect };
        }
        if (query.prerequisites) {
            where.prerequisites = { contains: query.prerequisites };
        }
        if (query.repeatable !== undefined) {
            where.repeatable = query.repeatable;
        }

        const [feats, total] = await Promise.all([
            prisma.feat.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    benefits: true,
                    prereqs: true,
                },
            }),
            prisma.feat.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            results: feats,
        };
    },

    async getAllFeats() {
        const feats = await prisma.feat.findMany({
            orderBy: { name: 'asc' },
        });
        return feats as GetAllFeatsResponse;
    },

    async getFeatById(query: FeatIdParamRequest) {
        const feat = await prisma.feat.findUnique({
            where: { id: query.id },
            include: {
                benefits: true,
                prereqs: true,
            },
        });

        return feat as GetFeatResponse;
    },

    async createFeat(data: CreateFeatRequest) {
        const result = await prisma.$transaction(async (tx) => {
            const newFeat = await tx.feat.create({
                data: {
                    ...data,
                    benefits: data.benefits ? {
                        create: data.benefits
                    } : undefined,
                    prereqs: data.prereqs ? {
                        create: data.prereqs
                    } : undefined,
                },
            });

            return newFeat.id;
        });

        return { id: result.toString(), message: 'Feat created successfully' };
    },

    async updateFeat(query: FeatIdParamRequest, data: UpdateFeatRequest) {
        await prisma.$transaction(async (tx) => {
            const updatedFeat = await tx.feat.update({
                where: { id: query.id },
                data: {
                    ...data,
                    benefits: data.benefits ? {
                        deleteMany: {},
                        create: data.benefits
                    } : undefined,
                    prereqs: data.prereqs ? {
                        deleteMany: {},
                        create: data.prereqs
                    } : undefined,
                },
            });

            return updatedFeat;
        });

        return { message: 'Feat updated successfully' };
    },

    async deleteFeat(query: FeatIdParamRequest) {
        await prisma.feat.delete({
            where: { id: query.id },
        });
        return { message: 'Feat deleted successfully' };
    },
}; 