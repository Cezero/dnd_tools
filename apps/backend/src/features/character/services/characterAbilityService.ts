import { prisma } from '@/lib/prisma';
import type {
    CreateCharacterAbilityScoreRequest,
    UpdateCharacterAbilityScoreRequest,
    CharacterAbilityScoreResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

/**
 * Service for managing character ability scores.
 * 
 * Handles CRUD operations for character ability scores including
 * individual operations and bulk upsert operations.
 */
export const characterAbilityService = {
    async createCharacterAbilityScore(data: CreateCharacterAbilityScoreRequest): Promise<CreateResponse> {
        const result = await prisma.characterAbilityScore.create({
            data,
        });

        return { id: result.id.toString(), message: 'Character ability score created successfully' };
    },

    async updateCharacterAbilityScore(id: number, data: UpdateCharacterAbilityScoreRequest): Promise<UpdateResponse> {
        await prisma.characterAbilityScore.update({
            where: { id },
            data,
        });

        return { message: 'Character ability score updated successfully' };
    },

    async deleteCharacterAbilityScore(id: number): Promise<UpdateResponse> {
        await prisma.characterAbilityScore.delete({
            where: { id },
        });

        return { message: 'Character ability score deleted successfully' };
    },

    async upsertCharacterAbilityScores(data: { characterId: number; abilityScores: Array<{ abilityId: number; value: number }> }): Promise<UpdateResponse> {
        // Use a transaction to ensure all operations succeed or fail together
        await prisma.$transaction(async (tx) => {
            // Get existing ability scores for this character
            const existingScores = await tx.characterAbilityScore.findMany({
                where: { characterId: data.characterId },
            });

            // Create a map of existing scores by abilityId
            const existingMap = new Map(existingScores.map(score => [score.abilityId, score]));

            // Process each ability score in the request
            for (const abilityScore of data.abilityScores) {
                const existing = existingMap.get(abilityScore.abilityId);
                if (existing) {
                    // Update existing score if value changed
                    if (existing.value !== abilityScore.value) {
                        await tx.characterAbilityScore.update({
                            where: { id: existing.id },
                            data: { value: abilityScore.value },
                        });
                    }
                } else {
                    // Create new score
                    await tx.characterAbilityScore.create({
                        data: {
                            characterId: data.characterId,
                            abilityId: abilityScore.abilityId,
                            value: abilityScore.value,
                        },
                    });
                }
            }

            // Delete scores that are no longer in the request
            const requestedAbilityIds = new Set(data.abilityScores.map(score => score.abilityId));
            const toDelete = existingScores.filter(score => !requestedAbilityIds.has(score.abilityId));

            if (toDelete.length > 0) {
                await tx.characterAbilityScore.deleteMany({
                    where: {
                        id: { in: toDelete.map(score => score.id) },
                    },
                });
            }
        });

        return { message: 'Character ability scores updated successfully' };
    },

    async getCharacterAbilityScores(characterId: number): Promise<CharacterAbilityScoreResponse[]> {
        const abilities = await prisma.characterAbilityScore.findMany({
            where: { characterId },
        });

        return abilities as CharacterAbilityScoreResponse[];
    },
};
