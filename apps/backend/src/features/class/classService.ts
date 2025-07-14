import { PrismaClient } from '@shared/prisma-client';
import {
    ClassIdParamRequest,
    CreateClassRequest,
    GetAllClassesResponse,
    GetClassResponse,
    UpdateClassRequest,
    ClassFeatureSlugParamRequest,
    CreateClassFeatureRequest,
    UpdateClassFeatureRequest,
    GetClassFeatureResponse,
    GetAllClassFeaturesResponse,
    CreateResponse
} from '@shared/schema';
import type { SpellProgressionType, ProgressionType } from '@shared/static-data';

import type { ClassService } from './types';

const prisma = new PrismaClient();

export const classService: ClassService = {
    async getAllClasses(): Promise<GetAllClassesResponse> {
        const [classes] = await Promise.all([
            prisma.class.findMany({
                orderBy: { name: 'asc' },
            }),
            prisma.class.count(),
        ]);

        // Cast enum fields to the correct types
        const typedClasses = classes.map(cls => ({
            ...cls,
            spellProgression: cls.spellProgression as SpellProgressionType | null,
            babProgression: cls.babProgression as ProgressionType,
            fortProgression: cls.fortProgression as ProgressionType,
            refProgression: cls.refProgression as ProgressionType,
            willProgression: cls.willProgression as ProgressionType
        }));

        return {
            total: classes.length,
            results: typedClasses as GetAllClassesResponse['results'],
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
                                description: true
                            }
                        }
                    }
                },
                skills: true,
            },
        });

        const flattenedFeatures = classData?.features.map((f) => ({
            description: f.feature.description,
            classId: f.classId,
            featureSlug: f.featureSlug,
            level: f.level,
        })) ?? [];

        return {
            ...classData,
            features: flattenedFeatures,
        } as GetClassResponse;
    },

    async createClass(data: CreateClassRequest): Promise<CreateResponse> {
        const result = await prisma.class.create({
            data: {
                ...data,
                sourceBookInfo: {
                    create: data.sourceBookInfo?.map(sourceBookInfo => ({
                        sourceBookId: sourceBookInfo.sourceBookId,
                        pageNumber: sourceBookInfo.pageNumber
                    })) || [],
                },
                features: {
                    create: data.features?.map(feature => ({
                        featureSlug: feature.featureSlug,
                        level: feature.level
                    })) || [],
                },
                skills: {
                    create: data.skills?.map(skill => ({
                        skillId: skill.skillId
                    })) || [],
                },
            },
        });

        return { id: result.id.toString(), message: 'Class created successfully' };
    },

    async updateClass(query: ClassIdParamRequest, data: UpdateClassRequest) {
        await prisma.$transaction(async (tx) => {
            await tx.classSourceMap.deleteMany({ where: { classId: query.id } });
            await tx.classFeatureMap.deleteMany({ where: { classId: query.id } });
            await tx.classSkillMap.deleteMany({ where: { classId: query.id } });
            await tx.class.update({
                where: { id: query.id },
                data: {
                    ...data,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        })) || []
                    },
                    features: {
                        create: data.features?.map(feature => ({
                            featureSlug: feature.featureSlug,
                            level: feature.level
                        })) || [],
                    },
                    skills: {
                        create: data.skills?.map(skill => ({
                            skillId: skill.skillId
                        })) || [],
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

    // Class Feature methods
    async getAllClassFeatures(): Promise<GetAllClassFeaturesResponse> {
        const [features, total] = await Promise.all([
            prisma.classFeature.findMany({
                orderBy: { slug: 'asc' },
            }),
            prisma.classFeature.count(),
        ]);

        return {
            total: features.length,
            results: features,
        };
    },

    async getClassFeatureBySlug(query: ClassFeatureSlugParamRequest): Promise<GetClassFeatureResponse | null> {
        const featureData = await prisma.classFeature.findUnique({
            where: { slug: query.slug },
        });

        return featureData as GetClassFeatureResponse;
    },

    async createClassFeature(data: CreateClassFeatureRequest) {
        const result = await prisma.classFeature.create({
            data: {
                ...data,
            },
        });

        return { id: result.slug, message: 'Class feature created successfully' };
    },

    async updateClassFeature(query: ClassFeatureSlugParamRequest, data: UpdateClassFeatureRequest) {
        await prisma.classFeature.update({
            where: { slug: query.slug },
            data: {
                ...data,
            },
        });

        return { message: 'Class feature updated successfully' };
    },

    async deleteClassFeature(query: ClassFeatureSlugParamRequest) {
        await prisma.classFeature.delete({
            where: { slug: query.slug },
        });

        return { message: 'Class feature deleted successfully' };
    },
};
