import { PrismaClient } from '@shared/prisma-client';
import {
    DeityIdParamRequest,
    CreateDeityRequest,
    UpdateDeityRequest,
    GetAllDeitiesResponse,
    CreateResponse,
    UpdateResponse,
    Deity,
} from '@shared/schema';

import type { DeityService, ValidationResult } from './types';

const prisma = new PrismaClient();

export const deityService: DeityService = {
    async getAllDeities(): Promise<GetAllDeitiesResponse> {
        const [deities] = await Promise.all([
            prisma.deity.findMany({
                orderBy: { name: 'asc' },
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                }
            }),
            prisma.deity.count(),
        ]);

        return {
            total: deities.length,
            results: deities,
        };
    },

    async getDeityById(query: DeityIdParamRequest): Promise<Deity | null> {
        const deity = await prisma.deity.findUnique({
            where: { id: query.id },
            include: {
                domains: {
                    include: {
                        domain: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                },
                deityClasses: {
                    select: {
                        classId: true
                    }
                },
                deityRaces: {
                    select: {
                        raceId: true
                    }
                },
                favoredWeapons: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
                sourceBookInfo: {
                    include: {
                        sourceBook: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!deity) {
            return null;
        }

        // Transform the data to match the expected schema
        const transformedDeity = {
            ...deity,
            classIds: deity.deityClasses.map(dc => dc.classId),
            raceIds: deity.deityRaces.map(dr => dr.raceId),
            domains: deity.domains.map(d => d.domain),
            favoredWeapons: deity.favoredWeapons.map(fw => ({
                id: fw.item.id,
                name: fw.item.name
            })),
            deityClasses: undefined, // Remove the raw relation
            deityRaces: undefined, // Remove the raw relation
            favoredWeaponIds: undefined // Remove the raw relation
        };

        return transformedDeity as Deity;
    },

    async createDeity(data: CreateDeityRequest): Promise<CreateResponse> {
        const result = await prisma.$transaction(async (tx) => {
            const { classIds, raceIds, domainIds, favoredWeaponIds, sourceBookInfo, ...deityData } = data;

            const newDeity = await tx.deity.create({
                data: {
                    ...deityData,
                    sourceBookInfo: sourceBookInfo ? {
                        create: sourceBookInfo.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        }))
                    } : undefined,
                },
            });

            // Create domain relationships
            if (domainIds && domainIds.length > 0) {
                await tx.deityDomain.createMany({
                    data: domainIds.map(domainId => ({
                        deityId: newDeity.id,
                        domainId: domainId
                    }))
                });
            }

            // Create class relationships
            if (classIds && classIds.length > 0) {
                await tx.deityClassMap.createMany({
                    data: classIds.map(classId => ({
                        deityId: newDeity.id,
                        classId: classId
                    }))
                });
            }

            // Create race relationships
            if (raceIds && raceIds.length > 0) {
                await tx.deityRaceMap.createMany({
                    data: raceIds.map(raceId => ({
                        deityId: newDeity.id,
                        raceId: raceId
                    }))
                });
            }

            // Create favored weapon relationships
            if (favoredWeaponIds && favoredWeaponIds.length > 0) {
                await tx.deityFavoredWeaponMap.createMany({
                    data: favoredWeaponIds.map(itemId => ({
                        deityId: newDeity.id,
                        itemId: itemId
                    }))
                });
            }

            return newDeity.id;
        });

        return { id: result.toString(), message: 'Deity created successfully' };
    },

    async updateDeity(data: UpdateDeityRequest, query: DeityIdParamRequest): Promise<UpdateResponse> {
        await prisma.$transaction(async (tx) => {
            const { classIds, raceIds, domainIds, favoredWeaponIds, sourceBookInfo, ...deityData } = data;

            // Delete existing mappings
            await tx.deitySourceMap.deleteMany({ where: { deityId: query.id } });
            await tx.deityDomain.deleteMany({ where: { deityId: query.id } });
            await tx.deityClassMap.deleteMany({ where: { deityId: query.id } });
            await tx.deityRaceMap.deleteMany({ where: { deityId: query.id } });
            await tx.deityFavoredWeaponMap.deleteMany({ where: { deityId: query.id } });

            const updatedDeity = await tx.deity.update({
                where: { id: query.id },
                data: {
                    ...deityData,
                    sourceBookInfo: sourceBookInfo ? {
                        create: sourceBookInfo.map(sourceBookInfo => ({
                            sourceBookId: sourceBookInfo.sourceBookId,
                            pageNumber: sourceBookInfo.pageNumber
                        }))
                    } : undefined,
                },
            });

            // Create new domain relationships
            if (domainIds && domainIds.length > 0) {
                await tx.deityDomain.createMany({
                    data: domainIds.map(domainId => ({
                        deityId: query.id,
                        domainId: domainId
                    }))
                });
            }

            // Create new class relationships
            if (classIds && classIds.length > 0) {
                await tx.deityClassMap.createMany({
                    data: classIds.map(classId => ({
                        deityId: query.id,
                        classId: classId
                    }))
                });
            }

            // Create new race relationships
            if (raceIds && raceIds.length > 0) {
                await tx.deityRaceMap.createMany({
                    data: raceIds.map(raceId => ({
                        deityId: query.id,
                        raceId: raceId
                    }))
                });
            }

            // Create new favored weapon relationships
            if (favoredWeaponIds && favoredWeaponIds.length > 0) {
                await tx.deityFavoredWeaponMap.createMany({
                    data: favoredWeaponIds.map(itemId => ({
                        deityId: query.id,
                        itemId: itemId
                    }))
                });
            }

            return updatedDeity;
        });

        return { message: 'Deity updated successfully' };
    },

    async deleteDeity(query: DeityIdParamRequest): Promise<UpdateResponse> {
        await prisma.deity.delete({
            where: { id: query.id },
        });
        return { message: 'Deity deleted successfully' };
    },


    async validateDeitySelection(advancementId: number, deityId: number): Promise<ValidationResult> {
        const errors: string[] = [];

        // Get the advancement to check character and class
        const advancement = await prisma.characterAdvancement.findUnique({
            where: { id: advancementId },
            include: {
                character: true,
                class: true
            }
        });

        if (!advancement) {
            errors.push('Advancement not found');
            return { isValid: false, errors };
        }

        // Check if deity exists
        const deity = await prisma.deity.findUnique({
            where: {
                id: deityId
            }
        });

        if (!deity) {
            errors.push('Deity not found or not visible');
        }

        // Check if this is a cleric or similar class that can worship deities
        const canWorshipDeities = advancement.class.name.toLowerCase().includes('cleric') ||
            advancement.class.name.toLowerCase().includes('paladin');

        if (!canWorshipDeities) {
            errors.push('This class cannot worship deities');
        }

        // Check alignment compatibility (simplified - in full implementation, you'd check alignment restrictions)
        // For now, we'll just ensure the deity exists and is visible

        return {
            isValid: errors.length === 0,
            errors
        };
    },
};
