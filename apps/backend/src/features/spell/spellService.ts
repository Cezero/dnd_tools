import { PrismaClient, Prisma } from '@shared/prisma-client';
import type { SpellIdParamRequest, UpdateSpellRequest, SpellQueryRequest, SpellQueryResponse, GetSpellResponse } from '@shared/schema';

import type { SpellService } from './types';

const prisma = new PrismaClient();

export const spellService: SpellService = {
    async getSpells(query: SpellQueryRequest): Promise<SpellQueryResponse> {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        const where: Prisma.SpellWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }

        if (query.sourceId) {
            where.sourceBookInfo = {
                some: {
                    sourceBookId: { in: query.sourceId }
                }
            };
        }

        if (query.editionId) {
            if (query.editionId === 4) {
                where.editionId = { in: [4, 5] };
            } else {
                where.editionId = query.editionId;
            }
        }

        if (query.classId) {
            where.levelMapping = {
                some: {
                    classId: { in: query.classId },
                    isVisible: true
                }
            };
        }

        if (query.spellLevel) {
            where.levelMapping = {
                some: {
                    level: { in: query.spellLevel },
                    isVisible: true
                }
            };
        }

        if (query.schoolId) {
            where.schoolIds = {
                some: {
                    schoolId: { in: query.schoolId }
                }
            };
        }

        if (query.descriptorId) {
            where.descriptorIds = {
                some: {
                    descriptorId: { in: query.descriptorId }
                }
            };
        }

        if (query.componentId) {
            where.componentIds = {
                some: {
                    componentId: { in: query.componentId }
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