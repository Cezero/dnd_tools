import { PrismaClient, Prisma } from '@shared/prisma-client';
import type { SpellIdParamRequest, UpdateSpellRequest, SpellQueryRequest, SpellQueryResponse, GetSpellResponse } from '@shared/schema';

import type { SpellService } from './types';

const prisma = new PrismaClient();

export const spellService: SpellService = {
    async getAllSpells(): Promise<SpellQueryResponse> {
        const [spells, total] = await Promise.all([
            prisma.spell.findMany({
                include: {
                    levelMapping: {
                        select: {
                            classId: true,
                            level: true
                        },
                        where: { isVisible: true },
                    },
                    descriptorIds: {
                        select: {
                            descriptorId: true
                        }
                    },
                    schoolIds: {
                        select: {
                            schoolId: true
                        }
                    },
                    subSchoolIds: {
                        select: {
                            subSchoolId: true
                        }
                    },
                    componentIds: {
                        select: {
                            componentId: true
                        }
                    },
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.spell.count()
        ]);
        return {
            page: 1,
            limit: spells.length,
            total: spells.length,
            results: spells
        };
    },

    async getSpells(body: SpellQueryRequest): Promise<SpellQueryResponse> {
        const page = body.page ?? 1;
        const limit = body.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: Prisma.SpellWhereInput = {};

        if (body.name) {
            where.name = { contains: body.name };
        }

        if (body.sourceId) {
            where.sourceBookInfo = {
                some: {
                    sourceBookId: { in: body.sourceId.values }
                }
            };
        }

        if (body.editionId) {
            if (body.editionId === 4) {
                where.editionId = { in: [4, 5] };
            } else {
                where.editionId = body.editionId;
            }
        }

        if (body.classId || body.spellLevel) {
            where.levelMapping = {
                some: {
                    ...(body.classId && { classId: { in: body.classId.values } }),
                    ...(body.spellLevel && { level: body.spellLevel }),
                    isVisible: true
                }
            };
        }

        if (body.schoolId) {
            where.schoolIds = {
                some: {
                    schoolId: { in: body.schoolId.values }
                }
            };
        }

        if (body.descriptorId) {
            where.descriptorIds = {
                some: {
                    descriptorId: { in: body.descriptorId.values }
                }
            };
        }

        if (body.componentId) {
            where.componentIds = {
                some: {
                    componentId: { in: body.componentId.values }
                }
            };
        }

        const [spells, total] = await Promise.all([
            prisma.spell.findMany({
                where,
                include: {
                    levelMapping: {
                        select: {
                            classId: true,
                            level: true
                        },
                        where: { isVisible: true },
                    },
                    descriptorIds: {
                        select: {
                            descriptorId: true
                        }
                    },
                    schoolIds: {
                        select: {
                            schoolId: true
                        }
                    },
                    subSchoolIds: {
                        select: {
                            subSchoolId: true
                        }
                    },
                    componentIds: {
                        select: {
                            componentId: true
                        }
                    },
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.spell.count({ where })
        ]);

        return {
            page,
            limit,
            total,
            results: spells,
        };
    },

    async getSpellById(id: SpellIdParamRequest): Promise<GetSpellResponse | null> {
        const spell = await prisma.spell.findUnique({
            where: { id: id.id },
            include: {
                levelMapping: {
                    select: {
                        classId: true,
                        level: true
                    },
                    where: { isVisible: true },
                },
                descriptorIds: {
                    select: {
                        descriptorId: true
                    }
                },
                schoolIds: {
                    select: {
                        schoolId: true
                    }
                },
                subSchoolIds: {
                    select: {
                        subSchoolId: true
                    }
                },
                componentIds: {
                    select: {
                        componentId: true
                    }
                },
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                }
            }
        });
        return spell;
    },

    async updateSpell(id: SpellIdParamRequest, data: UpdateSpellRequest) {
        // Update the spell with nested relationships
        await prisma.$transaction(async (tx) => {
            await tx.spellDescriptorMap.deleteMany({ where: { spellId: id.id } });
            await tx.spellSchoolMap.deleteMany({ where: { spellId: id.id } });
            await tx.spellSubschoolMap.deleteMany({ where: { spellId: id.id } });
            await tx.spellComponentMap.deleteMany({ where: { spellId: id.id } });
            await tx.spellLevelMap.deleteMany({ where: { spellId: id.id } });
            await tx.spellSourceMap.deleteMany({ where: { spellId: id.id } });

            await tx.spell.update({
                where: { id: id.id },
                data: {
                    ...data,
                    descriptorIds: {
                        create: data.descriptorIds?.map(descriptorId => ({ descriptorId: descriptorId.descriptorId })) || []
                    },
                    schoolIds: {
                        create: data.schoolIds?.map(schoolId => ({ schoolId: schoolId.schoolId })) || []
                    },
                    subSchoolIds: {
                        create: data.subSchoolIds?.map(subschoolId => ({ subSchoolId: subschoolId.subSchoolId })) || []
                    },
                    componentIds: {
                        create: data.componentIds?.map(componentId => ({ componentId: componentId.componentId })) || []
                    },
                    levelMapping: {
                        create: data.levelMapping?.map(levelMapping => ({
                            classId: levelMapping.classId,
                            level: levelMapping.level
                        })) || []
                    },
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        })) || []
                    }
                }
            });
        });

        return { message: 'Spell updated successfully' };
    },

    async deleteSpell(id: SpellIdParamRequest) {
        await prisma.spell.delete({
            where: { id: id.id }
        });
        return { message: 'Spell deleted successfully' };
    }
};
