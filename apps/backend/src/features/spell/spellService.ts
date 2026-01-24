import { prisma } from '@/lib/prisma';
import type { SpellIdParamRequest, UpdateSpellRequest, GetSpellResponse, GetAllSpellsResponse, ClassSpellListResponse, ClassSpellListEntry, SpellCacheResponse, Spell } from '@shared/schema';

import type { SpellService } from './types';

export const spellService: SpellService = {
    async getAllSpells(): Promise<GetAllSpellsResponse> {
        const [spells] = await Promise.all([
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
            total: spells.length,
            results: spells
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
    },

    async getSpellsForClass(classId: number, level?: number): Promise<ClassSpellListResponse> {
        return this.getBaseClassSpells(classId, level);
    },

    async getBaseClassSpells(classId: number, level?: number): Promise<ClassSpellListResponse> {
        const whereClause: { classId: number; level?: number } = { classId };
        if (level !== undefined) {
            whereClause.level = level;
        }

        const spellLevelMappings = await prisma.spellLevelMap.findMany({
            where: whereClause,
            select: {
                spellId: true,
                level: true
            }
        });

        const spellEntries: ClassSpellListEntry[] = spellLevelMappings.map(mapping => ({
            spellId: mapping.spellId,
            level: mapping.level
        }));

        return {
            results: spellEntries,
            total: spellEntries.length
        };
    },


    async getSpellCache(): Promise<SpellCacheResponse> {
        const spells = await prisma.spell.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                editionId: true,
                isVisible: true,
                baseLevel: true,
                summary: true,
            }
        });

        return {
            total: spells.length,
            results: spells,
        };
    },

    async getDomainSpells(domainIds: number[], characterLevel: number, classId: number): Promise<Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null }>> {
        if (domainIds.length === 0) {
            return [];
        }

        // Get domain spells where spellLevel <= characterLevel
        const domainSpells = await prisma.domainSpell.findMany({
            where: {
                domainId: { in: domainIds },
                spellLevel: { lte: characterLevel }
            },
            include: {
                domain: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                spell: {
                    include: {
                        levelMapping: {
                            where: { classId },
                            select: {
                                classId: true,
                                level: true
                            }
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
                                pageNumber: true,
                                sourceBook: {
                                    select: {
                                        id: true,
                                        abbreviation: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return domainSpells.map(ds => ({
            domainId: ds.domainId,
            domainName: ds.domain.name,
            spell: ds.spell,
            spellLevel: ds.spellLevel,
            classSpellLevel: ds.spell.levelMapping[0]?.level ?? null
        }));
    }
};
