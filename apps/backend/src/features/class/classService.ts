import { PrismaClient } from '@shared/prisma-client';
import {
    ClassIdParamRequest,
    CreateClassRequest,
    GetAllClassesResponse,
    GetClassResponse,
    UpdateClassRequest,
    CreateResponse
} from '@shared/schema';
import type { SpellProgressionType, ProgressionType, SpellsKnownType } from '@shared/static-data';

import type { ClassService } from './types';

const prisma = new PrismaClient();

export const classService: ClassService = {
    async getAllClasses(): Promise<GetAllClassesResponse> {
        const [classes] = await Promise.all([
            prisma.class.findMany({
                orderBy: { name: 'asc' },
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    },
                }
            }),
            prisma.class.count(),
        ]);

        return {
            total: classes.length,
            results: classes as GetAllClassesResponse['results'],
        };
    },

    async getClassById(query: ClassIdParamRequest) {
        const classData = await prisma.class.findUnique({
            where: { id: query.id },
            include: {
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                },
                features: {
                    include: {
                        feature: {
                            select: {
                                id: true,
                                slug: true,
                                name: true,
                                description: true
                            }
                        },
                        modifiers: true,
                        choices: true,
                        effects: true
                    }
                },
                spellcastingProgression: true,
            },
        });

        return {
            ...classData,
            spellcastingProgression: classData?.spellcastingProgression ?? null,
        } as GetClassResponse;
    },

    async createClass(data: CreateClassRequest): Promise<CreateResponse> {
        const { features, spellcastingProgression, ...classData } = data;
        const result = await prisma.class.create({
            data: {
                ...classData,
                sourceBookInfo: {
                    create: data.sourceBookInfo?.map(sourceBookInfo => ({
                        sourceBookId: sourceBookInfo.sourceBookId,
                        pageNumber: sourceBookInfo.pageNumber
                    })) || [],
                },
            },
        });

        return { id: result.id.toString(), message: 'Class created successfully' };
    },

    async updateClass(query: ClassIdParamRequest, data: UpdateClassRequest) {
        await prisma.$transaction(async (tx) => {
            await tx.classSourceMap.deleteMany({ where: { classId: query.id } });

            const { features, spellcastingProgression, ...classData } = data;
            await tx.class.update({
                where: { id: query.id },
                data: {
                    ...classData,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        })) || []
                    },
                },
            });
        });

        return { message: 'Class updated successfully' };
    },

    async deleteClass(query: ClassIdParamRequest) {
        await prisma.class.delete({
            where: { id: query.id },
        });

        return { message: 'Class deleted successfully' };
    },


};
