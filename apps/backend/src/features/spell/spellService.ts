import { PrismaClient, Prisma } from '@shared/prisma-client';

import type { SpellService } from './types';
import type { UpdateSpellRequest, SpellQueryRequest } from '@shared/schema';

const prisma = new PrismaClient();

export const spellService: SpellService = {
    async getAllSpells(query) {
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

    async getSpellById(id) {
        const spell = await prisma.spell.findUnique({
            where: { id },
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

    async updateSpell(id: number, data: UpdateSpellRequest) {
        // Use Prisma's nested input types for complex relationships
        const updateData: Prisma.SpellUpdateInput = {
            ...data,
        };

        // Handle components through the separate mapping table since it's not a direct Prisma relation
        const components = (data as any).components;
        if (components !== undefined) {
            await prisma.$transaction(async (tx) => {
                await tx.spellComponentMap.deleteMany({ where: { spellId: id } });
                if (components.length > 0) {
                    await tx.spellComponentMap.createMany({
                        data: components.map((componentId: number) => ({ spellId: id, componentId }))
                    });
                }
            });
        }

        // Update the spell with nested relationships
        await prisma.spell.update({
            where: { id },
            data: updateData
        });

        return { message: 'Spell updated successfully' };
    },

    async resolveSpellNames(spellNames: string[]) {
        const spells = await prisma.spell.findMany({
            where: {
                name: { in: spellNames }
            },
            select: {
                id: true,
                name: true
            }
        });

        const resolvedSpells: Record<string, number> = {};
        for (const spell of spells) {
            resolvedSpells[spell.name.toLowerCase()] = spell.id;
        }
        return resolvedSpells;
    }
}; 