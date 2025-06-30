import { PrismaClient, Prisma } from '@shared/prisma-client';

import type { FeatService } from './types';

const prisma = new PrismaClient();

export const featService: FeatService = {
    async getAllFeats(query) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.FeatWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.typeId) {
            where.typeId = parseInt(query.typeId);
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
            where.repeatable = query.repeatable === 'true';
        }

        const [feats, total] = await Promise.all([
            prisma.feat.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    benefits: true,
                    prerequisitesMap: true,
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

    async getAllFeatsSimple() {
        const feats = await prisma.feat.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
        return feats;
    },

    async getFeatById(id) {
        const feat = await prisma.feat.findUnique({
            where: { id },
            include: {
                benefits: true,
                prerequisitesMap: true,
            },
        });

        return feat;
    },

    async createFeat(data) {
        const result = await prisma.$transaction(async (tx) => {
            const newFeat = await tx.feat.create({
                data: {
                    ...data,
                    benefits: data.benefits ? {
                        create: data.benefits
                    } : undefined,
                    prerequisitesMap: data.prereqs ? {
                        create: data.prereqs
                    } : undefined,
                },
            });

            return newFeat.id;
        });

        return { id: result, message: 'Feat created successfully' };
    },

    async updateFeat(id, data) {
        await prisma.$transaction(async (tx) => {
            const updatedFeat = await tx.feat.update({
                where: { id },
                data: {
                    ...data,
                    benefits: data.benefits ? {
                        deleteMany: {},
                        create: data.benefits
                    } : undefined,
                    prerequisitesMap: data.prereqs ? {
                        deleteMany: {},
                        create: data.prereqs
                    } : undefined,
                },
            });

            return updatedFeat;
        });

        return { message: 'Feat updated successfully' };
    },

    async deleteFeat(id) {
        await prisma.feat.delete({
            where: { id },
        });
        return { message: 'Feat deleted successfully' };
    },
}; 