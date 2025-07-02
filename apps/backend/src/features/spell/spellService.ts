import { PrismaClient, Prisma } from '@shared/prisma-client';
import type { SpellIdParamRequest, UpdateSpellRequest, SpellQueryRequest } from '@shared/schema';

import type { SpellService } from './types';

const prisma = new PrismaClient();

export const spellService: SpellService = {
    async getSpells(query: SpellQueryRequest) {
        const page = query.page;
        const limit = query.limit;
        const skip = (page - 1) * limit;

        // Build Prisma where clause based on filters
        const where: Prisma.SpellWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }

        if (query.editionId) {
            if (query.editionId === 4) {
                where.editionId = { in: [4, 5] };
            } else {
                where.editionId = query.editionId;
            }
        }

        // Handle class filtering through levelMapping relation
        if (query.classId) {
            where.levelMapping = {
                some: {
                    classId: { in: query.classId },
                    isVisible: true
                }
            };
        }

        // Handle spell level filtering using baseLevel from Prisma schema
        if (query.spellLevel) {
            where.levelMapping = {
                some: {
                    level: { in: query.spellLevel },
                    isVisible: true
                }
            };
        }

        // Handle schools filtering
        if (query.schools) {
            where.schools = {
                some: {
                    schoolId: { in: query.schools }
                }
            };
        }

        // Handle descriptors filtering
        if (query.descriptors) {
            where.descriptors = {
                some: {
                    descriptorId: { in: query.descriptors }
                }
            };
        }

        // Handle components filtering using Prisma's type-safe approach
        if (query.components) {
            // Get spell IDs that have these components
            const spellIdsWithComponents = await prisma.spellComponentMap.findMany({
                where: {
                    componentId: { in: query.components }
                },
                select: { spellId: true }
            });

            where.id = { in: spellIdsWithComponents.map(s => s.spellId) };
        }

        const [spells, total] = await Promise.all([
            prisma.spell.findMany({
                where,
                include: {
                    levelMapping: {
                        where: { isVisible: true },
                        include: {
                            class: {
                                select: { name: true, abbreviation: true }
                            }
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

    async getSpellById(id: SpellIdParamRequest) {
        const spell = await prisma.spell.findUnique({
            where: { id: id.id },
            include: {
                levelMapping: {
                    where: { isVisible: true },
                    include: {
                        class: {
                            select: { name: true, abbreviation: true }
                        }
                    },
                    orderBy: { classId: 'asc' }
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

            await tx.spell.update({
                where: { id: id.id },
                data: {
                    ...data,
                    descriptors: {
                        create: data.descriptors?.map(descriptorId => ({ descriptorId: descriptorId.descriptorId }))
                    },
                    schools: {
                        create: data.schools?.map(schoolId => ({ schoolId: schoolId.schoolId }))
                    },
                    subschools: {
                        create: data.subschools?.map(subschoolId => ({ schoolId: subschoolId.schoolId }))
                    },
                    components: {
                        create: data.components?.map(componentId => ({ componentId: componentId.componentId }))
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