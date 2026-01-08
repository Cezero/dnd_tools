import { PrismaClient } from '@shared/prisma-client';
import {
    CompanionIdParamRequest,
    CreateCompanionRequest,
    UpdateCompanionRequest,
    GetAllCompanionsResponse,
    GetCompanionResponse,
    CreateResponse,
    UpdateResponse,
    CreateCharacterCompanionRequest,
    UpdateCharacterCompanionRequest,
    GetAllCharacterCompanionsResponse,
} from '@shared/schema';

import type { CompanionService } from './types';

const prisma = new PrismaClient();

export const companionService: CompanionService = {
    async getAllCompanions(): Promise<GetAllCompanionsResponse> {
        const [companions, total] = await Promise.all([
            prisma.companion.findMany({
                orderBy: [
                    { type: 'asc' },
                    { monsterId: 'asc' },
                ],
                include: {
                    monster: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }),
            prisma.companion.count(),
        ]);

        return {
            total,
            results: companions,
        };
    },

    async getCompanionById(query: CompanionIdParamRequest): Promise<GetCompanionResponse | null> {
        const companion = await prisma.companion.findUnique({
            where: { id: query.id },
            include: {
                monster: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                benefits: {
                    include: {
                        conditions: true,
                    },
                    orderBy: {
                        index: 'asc',
                    }
                }
            }
        });

        if (!companion) {
            return null;
        }

        return companion;
    },

    async createCompanion(data: CreateCompanionRequest): Promise<CreateResponse> {
        const { benefits, ...companionData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the companion
            const companion = await tx.companion.create({
                data: companionData,
            });

            // Create benefits if provided
            if (benefits && benefits.length > 0) {
                for (const benefit of benefits) {
                    const { conditions, ...benefitData } = benefit;
                    const createdBenefit = await tx.companionBenefitMap.create({
                        data: {
                            ...benefitData,
                            companionId: companion.id,
                        }
                    });

                    // Create conditions if provided
                    if (conditions && conditions.length > 0) {
                        await tx.companionBenefitCondition.createMany({
                            data: conditions.map((condition) => ({
                                companionBenefitMapId: createdBenefit.id,
                                conditionType: condition.conditionType,
                                conditionValue: condition.conditionValue,
                            }))
                        });
                    }
                }
            }

            return companion;
        });

        return { id: result.id.toString(), message: 'Companion created successfully' };
    },

    async updateCompanion(data: UpdateCompanionRequest, query: CompanionIdParamRequest): Promise<UpdateResponse> {
        const { benefits, ...companionData } = data;

        await prisma.$transaction(async (tx) => {
            // Update the companion
            await tx.companion.update({
                where: { id: query.id },
                data: companionData,
            });

            // Update benefits if provided
            if (benefits !== undefined) {
                // Get existing benefits
                const existingBenefits = await tx.companionBenefitMap.findMany({
                    where: { companionId: query.id },
                    include: { conditions: true },
                });

                // Delete existing benefits and their conditions
                for (const existingBenefit of existingBenefits) {
                    await tx.companionBenefitCondition.deleteMany({
                        where: { companionBenefitMapId: existingBenefit.id },
                    });
                    await tx.companionBenefitMap.delete({
                        where: { id: existingBenefit.id },
                    });
                }

                // Create new benefits
                if (benefits.length > 0) {
                    for (const benefit of benefits) {
                        const { conditions, ...benefitData } = benefit;
                        const createdBenefit = await tx.companionBenefitMap.create({
                            data: {
                                ...benefitData,
                                companionId: query.id,
                            }
                        });

                        // Create conditions if provided
                        if (conditions && conditions.length > 0) {
                            await tx.companionBenefitCondition.createMany({
                                data: conditions.map((condition) => ({
                                    companionBenefitMapId: createdBenefit.id,
                                    conditionType: condition.conditionType,
                                    conditionValue: condition.conditionValue,
                                }))
                            });
                        }
                    }
                }
            }
        });

        return { message: 'Companion updated successfully' };
    },

    async deleteCompanion(query: CompanionIdParamRequest): Promise<UpdateResponse> {
        await prisma.companion.delete({
            where: { id: query.id }
        });

        return { message: 'Companion deleted successfully' };
    },

    async getCharacterCompanions(characterId: number): Promise<GetAllCharacterCompanionsResponse> {
        const [companions, total] = await Promise.all([
            prisma.characterCompanion.findMany({
                where: { characterId },
                include: {
                    monster: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    companion: {
                        select: {
                            id: true,
                            type: true,
                            monsterId: true,
                            minLevel: true,
                        }
                    },
                    tricks: {
                        include: {
                            trick: true
                        }
                    }
                },
                orderBy: { levelAcquired: 'asc' }
            }),
            prisma.characterCompanion.count({ where: { characterId } }),
        ]);

        return {
            total,
            results: companions,
        };
    },

    async createCharacterCompanion(data: CreateCharacterCompanionRequest): Promise<CreateResponse> {
        const { tricks, ...companionData } = data;

        // Get monster averageHP if hitPoints not provided
        let hitPoints = companionData.hitPoints;
        if (!hitPoints) {
            const monster = await prisma.monster.findUnique({
                where: { id: companionData.monsterId },
                select: { averageHP: true }
            });
            hitPoints = monster?.averageHP || null;
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create the character companion
            const characterCompanion = await tx.characterCompanion.create({
                data: {
                    characterId: companionData.characterId,
                    monsterId: companionData.monsterId,
                    companionId: companionData.companionId || null,
                    levelAcquired: companionData.levelAcquired || null,
                    hitPoints: hitPoints,
                    wounds: companionData.wounds || 0,
                }
            });

            // Create trick associations if provided
            if (tricks && tricks.length > 0) {
                await tx.characterCompanionTrick.createMany({
                    data: tricks.map((trickId) => ({
                        characterCompanionId: characterCompanion.id,
                        trickId: trickId,
                    }))
                });
            }

            return characterCompanion;
        });

        return { id: result.id.toString(), message: 'Character companion created successfully' };
    },

    async updateCharacterCompanion(data: UpdateCharacterCompanionRequest, query: { id: number }): Promise<UpdateResponse> {
        const { tricks, ...companionData } = data;

        await prisma.$transaction(async (tx) => {
            // Update the character companion
            await tx.characterCompanion.update({
                where: { id: query.id },
                data: {
                    monsterId: companionData.monsterId,
                    companionId: companionData.companionId,
                    levelAcquired: companionData.levelAcquired,
                    hitPoints: companionData.hitPoints,
                    wounds: companionData.wounds,
                }
            });

            // Update tricks if provided
            if (tricks !== undefined) {
                // Delete existing tricks
                await tx.characterCompanionTrick.deleteMany({
                    where: { characterCompanionId: query.id }
                });

                // Create new tricks
                if (tricks.length > 0) {
                    await tx.characterCompanionTrick.createMany({
                        data: tricks.map((trickId) => ({
                            characterCompanionId: query.id,
                            trickId: trickId,
                        }))
                    });
                }
            }
        });

        return { message: 'Character companion updated successfully' };
    },

    async deleteCharacterCompanion(query: { id: number }): Promise<UpdateResponse> {
        await prisma.characterCompanion.delete({
            where: { id: query.id }
        });

        return { message: 'Character companion deleted successfully' };
    },
};

