import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UpdateSpellRequest, SpellQueryRequest } from '@shared/schema';
import { PrismaClient } from '@shared/prisma-client';

// Mock Prisma client
vi.mock('@shared/prisma-client', () => {
    const mPrisma = {
        spell: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            update: vi.fn(),
        },
        spellComponentMap: {
            findMany: vi.fn(),
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        spellSchoolMap: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        spellSubschoolMap: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        spellDescriptorMap: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        $transaction: vi.fn(),
    };
    return {
        PrismaClient: vi.fn(() => mPrisma),
        Prisma: {
            SpellWhereInput: {},
            SpellUpdateInput: {},
        },
    };
});

// Import the service after mocking
import { spellService } from './spellService';

describe('spellService', () => {
    const prisma = new PrismaClient() as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAllSpells', () => {
        it('should return spells with default pagination', async () => {
            const mockSpells = [
                {
                    id: 1,
                    name: 'Magic Missile',
                    levelMapping: []
                }
            ];

            prisma.spell.findMany.mockResolvedValue(mockSpells);
            prisma.spell.count.mockResolvedValue(1);

            const query: SpellQueryRequest = { page: 1, limit: 10 };
            const result = await spellService.getAllSpells(query);

            expect(result).toEqual({
                page: 1,
                limit: 10,
                total: 1,
                results: mockSpells,
            });
        });

        it('should return spells with custom pagination', async () => {
            const mockSpells = [
                {
                    id: 1,
                    name: 'Magic Missile',
                    levelMapping: []
                }
            ];

            prisma.spell.findMany.mockResolvedValue(mockSpells);
            prisma.spell.count.mockResolvedValue(1);

            const query: SpellQueryRequest = { page: 2, limit: 5 };
            const result = await spellService.getAllSpells(query);

            expect(result).toEqual({
                page: 2,
                limit: 5,
                total: 1,
                results: mockSpells,
            });
        });

        it('should filter by name', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, name: 'Magic' };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        name: { contains: 'Magic' }
                    }
                })
            );
        });

        it('should filter by edition ID', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, editionId: 3 };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        editionId: 3
                    }
                })
            );
        });

        it('should handle edition ID 4 special case', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, editionId: 4 };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        editionId: { in: [4, 5] }
                    }
                })
            );
        });

        it('should filter by class ID', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, classId: [1, 2, 3] };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        levelMapping: {
                            some: {
                                classId: { in: [1, 2, 3] },
                                isVisible: true
                            }
                        }
                    }
                })
            );
        });

        it('should filter by spell level', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, spellLevel: [1, 2, 3] };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        levelMapping: {
                            some: {
                                level: { in: [1, 2, 3] },
                                isVisible: true
                            }
                        }
                    }
                })
            );
        });

        it('should filter by schools', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, schools: [1, 2, 3] };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        schools: {
                            some: {
                                schoolId: { in: [1, 2, 3] }
                            }
                        }
                    }
                })
            );
        });

        it('should filter by descriptors', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, descriptors: [1, 2, 3] };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        descriptors: {
                            some: {
                                descriptorId: { in: [1, 2, 3] }
                            }
                        }
                    }
                })
            );
        });

        it('should filter by components', async () => {
            const mockComponentSpells = [{ spellId: 1 }, { spellId: 2 }];
            prisma.spellComponentMap.findMany.mockResolvedValue(mockComponentSpells);

            const query: SpellQueryRequest = { page: 1, limit: 10, components: [1, 2, 3] };

            await spellService.getAllSpells(query);

            expect(prisma.spellComponentMap.findMany).toHaveBeenCalledWith({
                where: {
                    componentId: { in: [1, 2, 3] }
                },
                select: { spellId: true }
            });

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        id: { in: [1, 2] }
                    }
                })
            );
        });

        it('should handle multiple filters simultaneously', async () => {
            const query: SpellQueryRequest = { page: 1, limit: 10, name: 'Magic', editionId: 3, classId: [1], spellLevel: [3] };

            await spellService.getAllSpells(query);

            expect(prisma.spell.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        name: { contains: 'Magic' },
                        editionId: 3,
                        levelMapping: {
                            some: {
                                level: { in: [3] },
                                isVisible: true
                            }
                        }
                    }
                })
            );
        });
    });

    describe('getSpellById', () => {
        it('should return spell by ID with level mapping', async () => {
            const mockSpell = {
                id: 1,
                name: 'Magic Missile',
                levelMapping: [
                    {
                        id: 1,
                        classId: 1,
                        spellId: 1,
                        level: 1,
                        isVisible: true,
                        class: { name: 'Wizard', abbreviation: 'Wiz' }
                    }
                ]
            };

            prisma.spell.findUnique.mockResolvedValue(mockSpell);

            const result = await spellService.getSpellById(1);

            expect(result).toEqual(mockSpell);
            expect(prisma.spell.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
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
        });

        it('should return null for non-existent spell', async () => {
            prisma.spell.findUnique.mockResolvedValue(null);

            const result = await spellService.getSpellById(999);

            expect(result).toBeNull();
        });
    });

    describe('updateSpell', () => {
        it('should update spell with basic fields', async () => {
            const updateData: UpdateSpellRequest = {
                summary: 'Updated summary',
                description: 'Updated description'
            };

            const result = await spellService.updateSpell(1, updateData);

            expect(result).toEqual({ message: 'Spell updated successfully' });
            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    summary: 'Updated summary',
                    description: 'Updated description'
                }
            });
        });

        it('should update spell with all fields', async () => {
            const updateData: UpdateSpellRequest = {
                summary: 'Updated summary',
                description: 'Updated description',
                castingTime: '1 standard action',
                range: 'Close',
                rangeTypeId: 1,
                rangeValue: '25 ft.',
                area: 'One creature',
                duration: 'Instantaneous',
                savingThrow: 'None',
                spellResistance: 'Yes',
                editionId: 3,
                effect: 'Force damage',
                target: 'One creature'
            };

            const result = await spellService.updateSpell(1, updateData);

            expect(result).toEqual({ message: 'Spell updated successfully' });
            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData
            });
        });

        it('should handle spell schools update', async () => {
            const updateData: UpdateSpellRequest = {
                schools: { create: [{ schoolId: 1 }, { schoolId: 2 }] }
            };

            await spellService.updateSpell(1, updateData);

            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData
            });
        });

        it('should handle empty schools array', async () => {
            const updateData: UpdateSpellRequest = {
                schools: { create: [] }
            };

            await spellService.updateSpell(1, updateData);

            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData
            });
        });

        it('should handle spell subschools update', async () => {
            const updateData: UpdateSpellRequest = {
                subschools: { create: [{ schoolId: 1 }, { schoolId: 2 }] }
            };

            await spellService.updateSpell(1, updateData);

            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData
            });
        });

        it('should handle spell descriptors update', async () => {
            const updateData: UpdateSpellRequest = {
                descriptors: { create: [{ descriptorId: 1 }, { descriptorId: 2 }, { descriptorId: 3 }, { descriptorId: 4 }] }
            };

            await spellService.updateSpell(1, updateData);

            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData
            });
        });

        it('should handle spell components update', async () => {
            const updateData: UpdateSpellRequest = {
                components: { create: [{ componentId: 1 }, { componentId: 2 }] }
            };

            prisma.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => any) => {
                return await callback(prisma);
            });

            await spellService.updateSpell(1, updateData);

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData
            });
        });

        it('should handle update with no fields to update', async () => {
            const updateData: UpdateSpellRequest = {};

            const result = await spellService.updateSpell(1, updateData);

            expect(result).toEqual({ message: 'Spell updated successfully' });
            expect(prisma.spell.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {}
            });
        });

        it('should handle transaction errors', async () => {
            const updateData: UpdateSpellRequest = {
                components: { create: [{ componentId: 1 }] }
            };

            const error = new Error('Database transaction failed');
            prisma.$transaction.mockRejectedValue(error);

            await expect(spellService.updateSpell(1, updateData)).rejects.toThrow('Database transaction failed');
        });
    });

    describe('resolveSpellNames', () => {
        it('should resolve spell names to IDs', async () => {
            const mockSpells = [
                { id: 1, name: 'Magic Missile' },
                { id: 2, name: 'Fireball' }
            ];

            prisma.spell.findMany.mockResolvedValue(mockSpells);

            const result = await spellService.resolveSpellNames(['Magic Missile', 'Fireball']);

            expect(result).toEqual({
                'magic missile': 1,
                'fireball': 2
            });
        });

        it('should handle case insensitive matching', async () => {
            const mockSpells = [
                { id: 1, name: 'Magic Missile' },
                { id: 2, name: 'FIREBALL' }
            ];

            prisma.spell.findMany.mockResolvedValue(mockSpells);

            const result = await spellService.resolveSpellNames(['magic missile', 'FIREBALL']);

            expect(result).toEqual({
                'magic missile': 1,
                'fireball': 2
            });
        });

        it('should handle empty spell names array', async () => {
            prisma.spell.findMany.mockResolvedValue([]);

            const result = await spellService.resolveSpellNames([]);

            expect(result).toEqual({});
        });

        it('should handle spells not found', async () => {
            prisma.spell.findMany.mockResolvedValue([]);

            const result = await spellService.resolveSpellNames(['NonExistentSpell']);

            expect(result).toEqual({});
        });

        it('should handle partial matches', async () => {
            const mockSpells = [
                { id: 1, name: 'Magic Missile' }
            ];

            prisma.spell.findMany.mockResolvedValue(mockSpells);

            const result = await spellService.resolveSpellNames(['Magic Missile', 'NonExistentSpell']);

            expect(result).toEqual({
                'magic missile': 1
            });
        });
    });
}); 