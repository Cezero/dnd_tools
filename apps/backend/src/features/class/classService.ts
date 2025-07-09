import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    ClassIdParamRequest,
    ClassQueryRequest,
    CreateClassRequest,
    GetAllClassesResponse,
    GetClassResponse,
    UpdateClassRequest,
    ClassFeatureQueryRequest,
    ClassFeatureSlugParamRequest,
    CreateClassFeatureRequest,
    UpdateClassFeatureRequest,
    ClassFeatureQueryResponse,
    GetClassFeatureResponse,
    GetAllClassFeaturesResponse
} from '@shared/schema';
import type { SpellProgressionType, ProgressionType } from '@shared/static-data';

import type { ClassService } from './types';

const prisma = new PrismaClient();

export const classService: ClassService = {
    async getClasses(query: ClassQueryRequest) {
        const page = query.page;
        const limit = query.limit;
        const offset = (page - 1) * limit;

        const where: Prisma.ClassWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.editionId) {
            where.editionId = query.editionId;
        }
        if (query.isPrestige !== undefined) {
            where.isPrestige = query.isPrestige;
        }
        if (query.isVisible !== undefined) {
            where.isVisible = query.isVisible;
        }
        if (query.canCastSpells !== undefined) {
            where.canCastSpells = query.canCastSpells;
        }
        if (query.hitDie) {
            where.hitDie = query.hitDie;
        }
        if (query.castingAbilityId) {
            where.castingAbilityId = query.castingAbilityId;
        }
        if (query.sourceId) {
            where.sourceBookInfo = {
                some: {
                    sourceBookId: { in: query.sourceId }
                }
            };
        }

        const [classes, total] = await Promise.all([
            prisma.class.findMany({
                where,
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
                skip: offset,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.class.count({ where }),
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
            page,
            limit,
            total,
            results: typedClasses,
        };
    },

    async getAllClasses() {
        const classes = await prisma.class.findMany() as GetAllClassesResponse;
        return classes;
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

    async createClass(data: CreateClassRequest) {
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

        return { id: result.id, message: 'Class created successfully' };
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
    async getClassFeatures(query: ClassFeatureQueryRequest): Promise<ClassFeatureQueryResponse> {
        const page = query.page;
        const limit = query.limit;
        const offset = (page - 1) * limit;

        const where: Prisma.ClassFeatureWhereInput = {};

        if (query.slug) {
            where.slug = { contains: query.slug };
        }
        if (query.description) {
            where.description = { contains: query.description };
        }

        const [features, total] = await Promise.all([
            prisma.classFeature.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { slug: 'asc' },
            }),
            prisma.classFeature.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            results: features,
        };
    },

    async getAllClassFeatures(): Promise<GetAllClassFeaturesResponse> {
        const features = await prisma.classFeature.findMany();
        return features;
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
