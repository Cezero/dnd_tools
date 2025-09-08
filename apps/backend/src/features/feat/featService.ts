import { Feat, Prisma, PrismaClient } from '@shared/prisma-client';
import {
    FeatIdParamRequest,
    CreateFeatRequest,
    UpdateFeatRequest,
    GetAllFeatsResponse,
    CreateResponse,
    UpdateResponse,
    FeatQueryResponse,
    FeatQueryRequest,
    GetFeatListResponse
} from '@shared/schema';
import { FeatBenefitType } from '@shared/static-data';

import type { FeatService } from './types';

const prisma = new PrismaClient();

export const featService: FeatService = {
    async getAllFeats(): Promise<GetAllFeatsResponse> {
        const [feats] = await Promise.all([
            prisma.feat.findMany({
                orderBy: { name: 'asc' },
            }),
            prisma.feat.count(),
        ]);

        return {
            total: feats.length,
            results: feats,
        };
    },

    async featQuery(query: FeatQueryRequest): Promise<FeatQueryResponse> {
        let whereClause: Prisma.FeatWhereInput = {};
        if (query.queryType === 'proficiency') {
            whereClause = {
                benefits: {
                    some: {
                        typeId: FeatBenefitType.PROFICIENCY
                    }
                }
            }
        }
        // For 'all' query type, no where clause is needed - get all feats
        const [feats] = await Promise.all([
            prisma.feat.findMany({
                where: whereClause,
                include: {
                    benefits: true,
                    prereqs: true,
                },
                orderBy: { name: 'asc' },
            }),
            prisma.feat.count({
                where: whereClause,
            }),
        ]);
        return {
            total: feats.length,
            results: feats,
        };
    },

    async getFeatList(query: FeatQueryRequest): Promise<GetFeatListResponse> {
        let whereClause: Prisma.FeatWhereInput = {};
        if (query.queryType === 'proficiency') {
            whereClause = {
                benefits: {
                    some: {
                        typeId: FeatBenefitType.PROFICIENCY
                    }
                }
            }
        }
        // For 'all' query type, no where clause is needed - get all feats

        const feats = await prisma.feat.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        return feats;
    },

    async getFeatById(query: FeatIdParamRequest): Promise<Feat | null> {
        const feat = await prisma.feat.findUnique({
            where: { id: query.id },
            include: {
                benefits: true,
                prereqs: true,
            },
        });

        return feat as Feat;
    },

    async createFeat(data: CreateFeatRequest): Promise<CreateResponse> {
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

    async updateFeat(query: FeatIdParamRequest, data: UpdateFeatRequest): Promise<UpdateResponse> {
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

    async deleteFeat(query: FeatIdParamRequest): Promise<UpdateResponse> {
        await prisma.feat.delete({
            where: { id: query.id },
        });
        return { message: 'Feat deleted successfully' };
    },
}; 
