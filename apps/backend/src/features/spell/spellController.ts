import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@shared/prisma-client';

const prisma = new PrismaClient();

interface SpellQueryParams {
    name?: string;
    classId?: string | string[];
    spellLevel?: string | string[];
    schools?: string | string[];
    descriptors?: string | string[];
    source?: string | string[];
    components?: string | string[];
    editionId?: string;
    page?: string;
    limit?: string;
}

interface UpdateSpellRequest {
    summary?: string;
    description?: string;
    castingTime?: string;
    range?: string;
    rangeTypeId?: number;
    rangeValue?: string;
    area?: string;
    duration?: string;
    savingThrow?: string;
    spellResistance?: string;
    editionId?: number;
    schools?: number[];
    subschools?: number[];
    descriptors?: number[];
    components?: number[];
    effect?: string;
    target?: string;
}

export async function GetSpells(req: Request<object, object, object, SpellQueryParams>, res: Response) {
    const { page = '1', limit = '10', ...filters } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    try {
        // Build Prisma where clause based on filters
        const where: Prisma.SpellWhereInput = {};

        if (filters.name) {
            where.name = { contains: filters.name };
        }

        if (filters.editionId) {
            const editionId = parseInt(filters.editionId);
            if (editionId === 4) {
                where.editionId = { in: [4, 5] };
            } else {
                where.editionId = editionId;
            }
        }

        // Handle class filtering through levelMapping relation
        if (filters.classId) {
            const classIds = Array.isArray(filters.classId)
                ? filters.classId.map(id => parseInt(id))
                : [parseInt(filters.classId)];

            where.levelMapping = {
                some: {
                    classId: { in: classIds },
                    isVisible: true
                }
            };
        }

        // Handle spell level filtering
        if (filters.spellLevel) {
            const levels = Array.isArray(filters.spellLevel)
                ? filters.spellLevel.map(level => parseInt(level))
                : [parseInt(filters.spellLevel)];

            where.levelMapping = {
                some: {
                    level: { in: levels },
                    isVisible: true
                }
            };
        }

        // Handle schools filtering
        if (filters.schools) {
            const schoolIds = Array.isArray(filters.schools)
                ? filters.schools.map(id => parseInt(id))
                : [parseInt(filters.schools)];

            where.schools = {
                some: {
                    schoolId: { in: schoolIds }
                }
            };
        }

        // Handle descriptors filtering
        if (filters.descriptors) {
            const descriptorIds = Array.isArray(filters.descriptors)
                ? filters.descriptors.map(id => parseInt(id))
                : [parseInt(filters.descriptors)];

            where.descriptors = {
                some: {
                    descriptorId: { in: descriptorIds }
                }
            };
        }

        // Handle components filtering (separate query due to missing relation)
        if (filters.components) {
            const componentIds = Array.isArray(filters.components)
                ? filters.components.map(id => parseInt(id))
                : [parseInt(filters.components)];

            // Get spell IDs that have these components
            const spellIdsWithComponents = await prisma.$queryRaw<{ spellId: number }[]>`
                SELECT DISTINCT spellId FROM spell_component_map 
                WHERE componentId IN (${componentIds.join(',')})
            `;

            where.id = { in: spellIdsWithComponents.map(s => s.spellId) };
        }

        // Get total count
        const total = await prisma.spell.count({ where });

        // Get spells with pagination
        const spells = await prisma.spell.findMany({
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
            take: limitNum,
            orderBy: { name: 'asc' }
        });

        res.json({
            page: pageNum,
            limit: limitNum,
            total,
            results: spells,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function GetSpellById(req: Request, res: Response) {
    const spellId = parseInt(req.params.id);
    if (isNaN(spellId)) {
        return res.status(400).json({ error: 'Invalid spell ID' });
    }

    try {
        // Get spell with level mapping
        const spell = await prisma.spell.findUnique({
            where: { id: spellId },
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

        if (!spell) {
            return res.status(404).json({ error: `Spell not found: ${spellId}` });
        }

        res.json(spell);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function UpdateSpell(req: Request<{ id: string }, object, UpdateSpellRequest>, res: Response) {
    const spellId = parseInt(req.params.id);
    const {
        summary, description, castingTime, range, rangeTypeId, rangeValue,
        area, duration, savingThrow, spellResistance, editionId,
        schools, subschools, descriptors, components, effect, target
    } = req.body;

    if (isNaN(spellId)) {
        return res.status(400).json({ error: 'Invalid spell ID' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Update main spell data
            const updateData: Prisma.SpellUpdateInput = {};
            if (summary !== undefined) updateData.summary = summary;
            if (description !== undefined) updateData.description = description;
            if (castingTime !== undefined) updateData.castingTime = castingTime;
            if (range !== undefined) updateData.range = range;
            if (rangeTypeId !== undefined) updateData.rangeTypeId = rangeTypeId;
            if (rangeValue !== undefined) updateData.rangeValue = rangeValue;
            if (area !== undefined) updateData.area = area;
            if (duration !== undefined) updateData.duration = duration;
            if (savingThrow !== undefined) updateData.savingThrow = savingThrow;
            if (spellResistance !== undefined) updateData.spellResistance = spellResistance;
            if (editionId !== undefined) updateData.editionId = editionId;
            if (effect !== undefined) updateData.effect = effect;
            if (target !== undefined) updateData.target = target;

            if (Object.keys(updateData).length > 0) {
                await tx.spell.update({
                    where: { id: spellId },
                    data: updateData
                });
            }

            // Handle spell schools
            if (schools !== undefined) {
                await tx.spellSchoolMap.deleteMany({ where: { spellId } });
                if (schools.length > 0) {
                    await tx.spellSchoolMap.createMany({
                        data: schools.map(schoolId => ({ spellId, schoolId }))
                    });
                }
            }

            // Handle spell subschools
            if (subschools !== undefined) {
                await tx.spellSubschoolMap.deleteMany({ where: { spellId } });
                if (subschools.length > 0) {
                    await tx.spellSubschoolMap.createMany({
                        data: subschools.map(schoolId => ({ spellId, schoolId }))
                    });
                }
            }

            // Handle spell descriptors
            if (descriptors !== undefined) {
                await tx.spellDescriptorMap.deleteMany({ where: { spellId } });
                if (descriptors.length > 0) {
                    await tx.spellDescriptorMap.createMany({
                        data: descriptors.map(descriptorId => ({ spellId, descriptorId }))
                    });
                }
            }

            // Handle spell components (separate query due to missing relation)
            if (components !== undefined) {
                await tx.$executeRaw`DELETE FROM spell_component_map WHERE spellId = ${spellId}`;
                if (components.length > 0) {
                    const componentInserts = components.map(componentId => [spellId, componentId]);
                    await tx.$executeRaw`INSERT INTO spell_component_map (spellId, componentId) VALUES ${componentInserts}`;
                }
            }
        });

        res.json({ message: 'Spell updated successfully' });
    } catch (err) {
        console.error('Update spell error:', err);
        res.status(500).send('Server error');
    }
}

export async function Resolve(spellNames: string[]) {
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