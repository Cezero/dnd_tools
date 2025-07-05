import { PrismaClient, Prisma } from '@shared/prisma-client';
import { ClassIdParamRequest, ClassQueryRequest, CreateClassRequest, GetAllClassesResponse, GetClassResponse, UpdateClassRequest } from '@shared/schema';

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

        return {
            page,
            limit,
            total,
            results: classes,
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
                features: true,
                attributes: true,
                spellProgression: true,
                skills: true,
            },
        });

        return classData as GetClassResponse;
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
                    attributes: {
                        create: data.attributes?.map(attribute => ({
                            level: attribute.level,
                            baseAttackBonus: attribute.baseAttackBonus,
                            fortSave: attribute.fortSave,
                            refSave: attribute.refSave,
                            willSave: attribute.willSave
                        })) || [],
                    },
                    spellProgression: {
                        create: data.spellProgression?.map(spellProgression => ({
                            level: spellProgression.level,
                            spellLevel: spellProgression.spellLevel,
                            spellSlots: spellProgression.spellSlots
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
            await tx.classLevelAttribute.deleteMany({ where: { classId: query.id } });
            await tx.classSpellProgression.deleteMany({ where: { classId: query.id } });
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
                    attributes: {
                        create: data.attributes?.map(attribute => ({
                            level: attribute.level,
                            baseAttackBonus: attribute.baseAttackBonus,
                            fortSave: attribute.fortSave,
                            refSave: attribute.refSave,
                            willSave: attribute.willSave
                        })) || [],
                    },
                    spellProgression: {
                        create: data.spellProgression?.map(spellProgression => ({
                            level: spellProgression.level,
                            spellLevel: spellProgression.spellLevel,
                            spellSlots: spellProgression.spellSlots
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
};
