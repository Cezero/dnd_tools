import { prisma } from '@/lib/prisma';
import type {
    CharacterFeatureUses,
    UpdateMoneyRequest,
    AddItemRequest,
    UpdateWoundsRequest,
    UpdateNotesRequest,
    SyncItemsRequest,
    SyncSpellPreparationsRequest,
    SyncSpellsKnownRequest,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';
import { CurrencyId, SpellSlotType, USES_FREQUENCY_ENUM } from '@shared/static-data';


/**
 * Service for managing character detail operations.
 * 
 * Handles items, money, wounds, notes, feature uses tracking, spell casting,
 * and sync operations for bulk updates.
 */
export const characterDetailService = {
    async getCharacterUses(characterId: number): Promise<CharacterFeatureUses[]> {
        const uses = await prisma.characterFeatureUses.findMany({
            where: { characterId },
        });
        return uses;
    },

    async updateFeatureUses(characterId: number, featureId: number, entityId: number, delta: number): Promise<CharacterFeatureUses> {
        // Find or create the uses record
        const existing = await prisma.characterFeatureUses.findUnique({
            where: {
                characterId_featureId_featureEntityId: {
                    characterId,
                    featureId,
                    featureEntityId: entityId,
                },
            },
        });

        if (existing) {
            const newCurrentUses = Math.max(0, Math.min(existing.maxUses, existing.currentUses + delta));
            return await prisma.characterFeatureUses.update({
                where: { id: existing.id },
                data: { currentUses: newCurrentUses },
            });
        } else {
            // Need to get maxUses and frequency from the feature entity
            const featureEntity = await prisma.featureEntity.findUnique({
                where: { id: entityId },
                include: {
                    feature: true,
                },
            });

            if (!featureEntity) {
                throw new Error('Feature entity not found');
            }

            // Determine maxUses and frequency from the feature entity
            // For uses per day/week, the value field typically contains the number of uses
            // and the frequency should be determined from the feature definition
            // For now, we'll use the value as maxUses and default to PER_DAY
            const maxUses = featureEntity.value || 1;
            const frequency = USES_FREQUENCY_ENUM.PER_DAY; // Default to PER_DAY - should be determined from feature definition

            const newCurrentUses = Math.max(0, Math.min(maxUses, delta));
            return await prisma.characterFeatureUses.create({
                data: {
                    characterId,
                    featureId,
                    featureEntityId: entityId,
                    currentUses: newCurrentUses,
                    maxUses,
                    frequency,
                },
            });
        }
    },

    async resetDailyUses(characterId: number): Promise<UpdateResponse> {
        await prisma.$transaction([
            // Reset daily uses (frequency = PER_DAY)
            prisma.characterFeatureUses.updateMany({
                where: {
                    characterId,
                    frequency: USES_FREQUENCY_ENUM.PER_DAY,
                },
                data: {
                    currentUses: 0,
                },
            }),
        ]);
        // Reset spell cast counts (separate call to allow independent reset)
        await characterDetailService.resetDailySpellPreparations(characterId);
        return { message: 'Daily uses reset successfully' };
    },

    async resetAllUses(characterId: number): Promise<UpdateResponse> {
        await prisma.characterFeatureUses.updateMany({
            where: { characterId },
            data: {
                currentUses: 0,
            },
        });
        return { message: 'All uses reset successfully' };
    },

    async updateMoney(characterId: number, money: UpdateMoneyRequest): Promise<UpdateResponse> {
        const updates: Array<{ currencyId: number; quantity: number }> = [];
        if (money.platinum !== undefined) {
            updates.push({ currencyId: CurrencyId.Platinum, quantity: money.platinum });
        }
        if (money.gold !== undefined) {
            updates.push({ currencyId: CurrencyId.Gold, quantity: money.gold });
        }
        if (money.silver !== undefined) {
            updates.push({ currencyId: CurrencyId.Silver, quantity: money.silver });
        }
        if (money.copper !== undefined) {
            updates.push({ currencyId: CurrencyId.Copper, quantity: money.copper });
        }

        await prisma.$transaction(async (tx) => {
            for (const update of updates) {
                const existing = await tx.characterWealth.findFirst({
                    where: {
                        characterId,
                        currencyId: update.currencyId,
                        value: null,
                        description: null,
                    },
                    select: { id: true },
                });

                if (existing) {
                    await tx.characterWealth.update({
                        where: { id: existing.id },
                        data: { quantity: update.quantity },
                    });
                } else {
                    await tx.characterWealth.create({
                        data: {
                            characterId,
                            currencyId: update.currencyId,
                            quantity: update.quantity,
                            value: null,
                            description: null,
                        },
                    });
                }
            }
        });

        return { message: 'Money updated successfully' };
    },

    async addItem(characterId: number, item: AddItemRequest): Promise<CreateResponse> {
        const result = await prisma.characterItem.create({
            data: {
                characterId,
                baseItemId: item.baseItemId,
                name: item.name,
                quantity: item.quantity,
                location: item.location,
            },
        });
        return { id: result.id.toString(), message: 'Item added successfully' };
    },

    async removeItem(characterId: number, itemId: number): Promise<UpdateResponse> {
        await prisma.characterItem.delete({
            where: {
                id: itemId,
                characterId, // Ensure the item belongs to the character
            },
        });
        return { message: 'Item removed successfully' };
    },

    async updateWounds(characterId: number, wounds: UpdateWoundsRequest): Promise<UpdateResponse> {
        // Note: wounds and nonlethal are not currently stored in the database
        // This is a placeholder for future implementation
        // For now, we'll need to add these fields to UserCharacter model
        // or create a separate CharacterHealth model
        // This method is implemented but will need database schema updates
        throw new Error('Wounds tracking not yet implemented in database schema');
    },

    async updateNotes(characterId: number, notes: UpdateNotesRequest): Promise<UpdateResponse> {
        const updateData: {
            notes?: string | null;
        } = {};

        if (notes.notes !== undefined) {
            updateData.notes = notes.notes;
        }

        await prisma.character.update({
            where: { id: characterId },
            data: updateData,
        });
        return { message: 'Notes updated successfully' };
    },

    async castSpell(characterId: number, preparationId: number): Promise<UpdateResponse> {
        const preparation = await prisma.characterSpellPreparation.findUnique({
            where: {
                id: preparationId,
            },
        });

        if (!preparation) {
            throw new Error('Spell preparation not found');
        }

        if (preparation.characterId !== characterId) {
            throw new Error('Spell preparation does not belong to this character');
        }

        if (preparation.timesCast >= preparation.quantity) {
            throw new Error('All prepared spells have already been cast');
        }

        await prisma.characterSpellPreparation.update({
            where: {
                id: preparationId,
            },
            data: {
                timesCast: {
                    increment: 1,
                },
            },
        });
        return { message: 'Spell cast successfully' };
    },

    async uncastSpell(characterId: number, preparationId: number): Promise<UpdateResponse> {
        const preparation = await prisma.characterSpellPreparation.findUnique({
            where: {
                id: preparationId,
            },
        });

        if (!preparation) {
            throw new Error('Spell preparation not found');
        }

        if (preparation.characterId !== characterId) {
            throw new Error('Spell preparation does not belong to this character');
        }

        if (preparation.timesCast <= 0) {
            throw new Error('No spells have been cast');
        }

        await prisma.characterSpellPreparation.update({
            where: {
                id: preparationId,
            },
            data: {
                timesCast: {
                    decrement: 1,
                },
            },
        });
        return { message: 'Spell uncast successfully' };
    },

    async resetDailySpellPreparations(characterId: number): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.updateMany({
            where: {
                characterId,
            },
            data: {
                timesCast: 0,
            },
        });
        return { message: 'Daily spell preparations reset successfully' };
    },

    async syncItems(characterId: number, items: SyncItemsRequest['items']): Promise<UpdateResponse> {
        return await prisma.$transaction(async (tx) => {
            // Get current items from database
            const currentItems = await tx.characterItem.findMany({
                where: { characterId },
            });

            // Create maps for efficient lookup
            const currentItemsMap = new Map(currentItems.map(item => [item.id, item]));
            const incomingItemsMap = new Map<number, typeof items[0]>();

            // Track items by temporary ID (for new items without database ID)
            const incomingByTempId = new Map<number, typeof items[0]>();

            for (const item of items) {
                if (item.id && item.id > 0) {
                    // Has database ID - use it as key
                    incomingItemsMap.set(item.id, item);
                } else if (item.id && item.id < 0) {
                    // Temporary ID (negative) - track separately
                    incomingByTempId.set(item.id, item);
                }
            }

            // Find items to delete (in database but not in incoming array)
            const itemsToDelete = currentItems.filter(
                item => !incomingItemsMap.has(item.id)
            );

            // Find items to create (in incoming array but not in database, or have temp ID)
            const itemsToCreate = items.filter(
                item => !item.id || item.id < 0 || !currentItemsMap.has(item.id)
            );

            // Find items to update (in both arrays but different)
            const itemsToUpdate = items.filter(item => {
                if (!item.id || item.id < 0) return false; // Skip temp IDs
                const current = currentItemsMap.get(item.id);
                if (!current) return false;

                // Compare relevant fields
                return (
                    current.baseItemId !== item.baseItemId ||
                    current.quantity !== item.quantity ||
                    current.location !== item.location ||
                    current.name !== item.name
                );
            });

            // Perform operations
            if (itemsToDelete.length > 0) {
                await tx.characterItem.deleteMany({
                    where: {
                        id: { in: itemsToDelete.map(item => item.id) },
                        characterId,
                    },
                });
            }

            if (itemsToCreate.length > 0) {
                await tx.characterItem.createMany({
                    data: itemsToCreate.map(item => ({
                        characterId,
                        baseItemId: item.baseItemId,
                        name: item.name,
                        quantity: item.quantity ?? 1,
                        location: item.location,
                    })),
                });
            }

            if (itemsToUpdate.length > 0) {
                await Promise.all(
                    itemsToUpdate.map(item =>
                        tx.characterItem.update({
                            where: {
                                id: item.id!,
                                characterId,
                            },
                            data: {
                                baseItemId: item.baseItemId,
                                name: item.name,
                                quantity: item.quantity ?? 1,
                                location: item.location,
                            },
                        })
                    )
                );
            }

            return { message: 'Items synced successfully' };
        });
    },

    async syncSpellPreparations(characterId: number, spellPreparations: SyncSpellPreparationsRequest['spellPreparations']): Promise<UpdateResponse> {
        return await prisma.$transaction(async (tx) => {
            // Get current spell preparations from database
            const currentPreparations = await tx.characterSpellPreparation.findMany({
                where: { characterId },
            });

            // Create maps for efficient lookup
            const currentPreparationsMap = new Map(currentPreparations.map(prep => [prep.id, prep]));

            // Create composite key map for new preparations (classId-spellId-spellLevel-slotType-featId)
            const currentByCompositeKey = new Map<string, typeof currentPreparations[0]>();
            for (const prep of currentPreparations) {
                const key = `${prep.classId}-${prep.spellId}-${prep.spellLevel}-${prep.slotType}-${prep.featId ?? 'null'}`;
                currentByCompositeKey.set(key, prep);
            }

            const incomingPreparationsMap = new Map<number, typeof spellPreparations[0]>();
            const incomingByCompositeKey = new Map<string, typeof spellPreparations[0]>();

            for (const prep of spellPreparations) {
                if (prep.id && prep.id > 0) {
                    // Has database ID - use it as key
                    incomingPreparationsMap.set(prep.id, prep);
                } else {
                    // New preparation - use composite key
                    const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                    const featId = prep.featId ?? null;
                    const key = `${prep.classId}-${prep.spellId}-${prep.spellLevel}-${slotType}-${featId ?? 'null'}`;
                    incomingByCompositeKey.set(key, prep);
                }
            }

            // Find preparations to delete (in database but not in incoming array)
            const preparationsToDelete = currentPreparations.filter(
                prep => !incomingPreparationsMap.has(prep.id)
            );

            // Find preparations to create (in incoming array but not in database)
            const preparationsToCreate = spellPreparations.filter(prep => {
                if (prep.id && prep.id > 0) {
                    // Has database ID - check if exists
                    return !currentPreparationsMap.has(prep.id);
                } else {
                    // New preparation - check by composite key
                    const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                    const featId = prep.featId ?? null;
                    const key = `${prep.classId}-${prep.spellId}-${prep.spellLevel}-${slotType}-${featId ?? 'null'}`;
                    return !currentByCompositeKey.has(key);
                }
            });

            // Find preparations to update (in both arrays but different)
            const preparationsToUpdate = spellPreparations.filter(prep => {
                if (!prep.id || prep.id <= 0) return false; // Skip new preparations
                const current = currentPreparationsMap.get(prep.id);
                if (!current) return false;

                // Compare relevant fields
                const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                const featId = prep.featId ?? null;
                return (
                    current.classId !== prep.classId ||
                    current.spellId !== prep.spellId ||
                    current.spellLevel !== prep.spellLevel ||
                    current.quantity !== prep.quantity ||
                    current.slotType !== slotType ||
                    current.featId !== featId ||
                    current.timesCast !== (prep.timesCast ?? 0)
                );
            });

            // Perform operations
            if (preparationsToDelete.length > 0) {
                await tx.characterSpellPreparation.deleteMany({
                    where: {
                        id: { in: preparationsToDelete.map(prep => prep.id) },
                        characterId,
                    },
                });
            }

            if (preparationsToCreate.length > 0) {
                await tx.characterSpellPreparation.createMany({
                    data: preparationsToCreate.map(prep => ({
                        characterId,
                        classId: prep.classId,
                        spellId: prep.spellId,
                        spellLevel: prep.spellLevel,
                        quantity: prep.quantity,
                        timesCast: prep.timesCast ?? 0,
                        slotType: prep.slotType ?? SpellSlotType.NORMAL,
                        featId: prep.featId ?? null,
                    })),
                });
            }

            if (preparationsToUpdate.length > 0) {
                await Promise.all(
                    preparationsToUpdate.map(prep => {
                        const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                        const featId = prep.featId ?? null;
                        return tx.characterSpellPreparation.update({
                            where: {
                                id: prep.id!,
                                characterId,
                            },
                            data: {
                                classId: prep.classId,
                                spellId: prep.spellId,
                                spellLevel: prep.spellLevel,
                                quantity: prep.quantity,
                                timesCast: prep.timesCast ?? 0,
                                slotType: slotType,
                                featId: featId,
                            },
                        });
                    })
                );
            }

            return { message: 'Spell preparations synced successfully' };
        });
    },

    async syncSpellsKnown(characterId: number, advancementId: number, spellsKnown: SyncSpellsKnownRequest['spellsKnown']): Promise<UpdateResponse> {
        return await prisma.$transaction(async (tx) => {
            // Get current spellsKnown from database
            const currentSpellsKnown = await tx.advancementSpell.findMany({
                where: { advancementId },
            });

            // Create maps for efficient lookup
            const currentSpellsKnownMap = new Map(currentSpellsKnown.map(s => [s.spellId, s]));

            // Determine what to create, update, and delete
            const spellsKnownSet = new Set(spellsKnown.map(s => s.spellId));

            // Delete spells that are no longer in the new array
            const toDelete = currentSpellsKnown.filter(s => !spellsKnownSet.has(s.spellId));
            if (toDelete.length > 0) {
                await tx.advancementSpell.deleteMany({
                    where: {
                        advancementId,
                        spellId: { in: toDelete.map(s => s.spellId) }
                    }
                });
            }

            // Create or update spells
            for (const spell of spellsKnown) {
                const existing = currentSpellsKnownMap.get(spell.spellId);
                if (existing) {
                    // Update if isFreeGrant changed
                    if (existing.isFreeGrant !== spell.isFreeGrant) {
                        await tx.advancementSpell.update({
                            where: {
                                advancementId_spellId: {
                                    advancementId,
                                    spellId: spell.spellId
                                }
                            },
                            data: { isFreeGrant: spell.isFreeGrant }
                        });
                    }
                } else {
                    // Create new
                    await tx.advancementSpell.create({
                        data: {
                            advancementId,
                            spellId: spell.spellId,
                            isFreeGrant: spell.isFreeGrant
                        }
                    });
                }
            }

            return { message: 'Spells known synced successfully' };
        });
    },
};
