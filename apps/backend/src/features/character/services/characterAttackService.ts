import { prisma } from '@/lib/prisma';
import type {
    CreateCharacterAttackDefinitionRequest,
    UpdateCharacterAttackDefinitionRequest,
    CharacterAttackDefinition,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';
import { ARMOR_CATEGORY_ENUM } from '@shared/static-data';


/**
 * Service for managing character attack definitions.
 * 
 * Handles CRUD operations for attack definitions including validation
 * for dual-wield rules, slot conflicts, and shield detection.
 */
export const characterAttackService = {
    async getCharacterAttackDefinitions(characterId: number): Promise<CharacterAttackDefinition[]> {
        const attackDefinitions = await prisma.characterAttackDefinition.findMany({
            where: { characterId },
            orderBy: { attackSlot: 'asc' },
        });

        return attackDefinitions as CharacterAttackDefinition[];
    },

    async createCharacterAttackDefinition(characterId: number, data: CreateCharacterAttackDefinitionRequest): Promise<CreateResponse> {
        // Validate that character items belong to the character
        if (data.mainHandCharacterItemId) {
            const mainHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: data.mainHandCharacterItemId,
                    characterId: characterId,
                },
            });
            if (!mainHandItem) {
                throw new Error('Main hand character item does not belong to this character');
            }
        }

        let isOffHandShield = false;
        if (data.offHandCharacterItemId) {
            const offHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: data.offHandCharacterItemId,
                    characterId: characterId,
                },
            });
            if (!offHandItem) {
                throw new Error('Off hand character item does not belong to this character');
            }
            // Check if offhand item is a shield by looking up the base item
            if (offHandItem.baseItemId) {
                const baseItem = await prisma.item.findUnique({
                    where: { id: offHandItem.baseItemId },
                    include: { armor: true },
                });
                if (baseItem?.armor?.category === ARMOR_CATEGORY_ENUM.Shield) {
                    isOffHandShield = true;
                }
            }
        }

        // Validate attack definition rules based on items
        // Dual-wield: both items required and different (shields don't count as dual-wield)
        const isDualWield = data.offHandCharacterItemId !== null && data.offHandCharacterItemId !== undefined && !isOffHandShield;
        if (isDualWield) {
            if (!data.mainHandCharacterItemId) {
                throw new Error('Dual wield requires both main hand and off hand character items');
            }
            if (data.mainHandCharacterItemId === data.offHandCharacterItemId) {
                throw new Error('Main hand and off hand items must be different');
            }
            // Dual wield cannot use slot 7 (off-hand would need slot 8)
            if (data.attackSlot === 7) {
                throw new Error('Dual wield cannot use attack slot 7 (off-hand would need slot 8)');
            }
        }

        // Validate slot conflicts
        if (data.attackSlot !== null) {
            const existingDefinitions = await prisma.characterAttackDefinition.findMany({
                where: {
                    characterId: characterId,
                    attackSlot: { not: null },
                },
            });

            // Check for slot conflicts
            for (const existing of existingDefinitions) {
                if (existing.attackSlot === data.attackSlot) {
                    throw new Error(`Attack slot ${data.attackSlot} is already occupied`);
                }
                // For dual wield, also check slot+1 (shields don't count as dual-wield)
                if (isDualWield && existing.attackSlot === data.attackSlot + 1) {
                    throw new Error(`Attack slot ${data.attackSlot + 1} is already occupied (needed for dual wield off-hand)`);
                }
                // If existing is dual wield, check if it occupies our slot
                if (existing.attackSlot !== null && data.attackSlot === existing.attackSlot + 1) {
                    // Check if existing is dual wield by checking if it has offHandCharacterItemId and is not a shield
                    // We need to check if the existing offhand is a shield
                    let existingIsDualWield = false;
                    if (existing.offHandCharacterItemId) {
                        const existingOffHandItem = await prisma.characterItem.findFirst({
                            where: { id: existing.offHandCharacterItemId },
                        });
                        if (existingOffHandItem?.baseItemId) {
                            const existingBaseItem = await prisma.item.findUnique({
                                where: { id: existingOffHandItem.baseItemId },
                                include: { armor: true },
                            });
                            // Only treat as dual-wield if it's not a shield
                            existingIsDualWield = existingBaseItem?.armor?.category !== ARMOR_CATEGORY_ENUM.Shield;
                        } else {
                            existingIsDualWield = true; // If no baseItemId, assume it's a weapon
                        }
                    }
                    if (existingIsDualWield) {
                        throw new Error(`Attack slot ${data.attackSlot} is already occupied by dual wield off-hand`);
                    }
                }
            }
        }

        const result = await prisma.characterAttackDefinition.create({
            data: {
                characterId: characterId,
                attackSlot: data.attackSlot ?? null,
                mainHandCharacterItemId: data.mainHandCharacterItemId ?? null,
                offHandCharacterItemId: data.offHandCharacterItemId ?? null,
                wieldTwoHanded: data.wieldTwoHanded ?? false,
            },
        });

        return { id: result.id.toString(), message: 'Attack definition created successfully' };
    },

    async updateCharacterAttackDefinition(characterId: number, attackId: number, data: UpdateCharacterAttackDefinitionRequest): Promise<UpdateResponse> {
        // Verify the attack definition belongs to the character
        const existing = await prisma.characterAttackDefinition.findFirst({
            where: {
                id: attackId,
                characterId: characterId,
            },
        });

        if (!existing) {
            throw new Error('Attack definition not found or does not belong to this character');
        }

        // Validate character items if provided
        if (data.mainHandCharacterItemId !== undefined && data.mainHandCharacterItemId !== null) {
            const mainHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: data.mainHandCharacterItemId,
                    characterId: characterId,
                },
            });
            if (!mainHandItem) {
                throw new Error('Main hand character item does not belong to this character');
            }
        }

        let isOffHandShield = false;
        const offHandId = data.offHandCharacterItemId ?? existing.offHandCharacterItemId;
        if (offHandId !== null && offHandId !== undefined) {
            const offHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: offHandId,
                    characterId: characterId,
                },
            });
            if (!offHandItem) {
                throw new Error('Off hand character item does not belong to this character');
            }
            // Check if offhand item is a shield by looking up the base item
            if (offHandItem.baseItemId) {
                const baseItem = await prisma.item.findUnique({
                    where: { id: offHandItem.baseItemId },
                    include: { armor: true },
                });
                if (baseItem?.armor?.category === ARMOR_CATEGORY_ENUM.Shield) {
                    isOffHandShield = true;
                }
            }
        }

        // Validate attack definition rules based on items
        const mainHand = data.mainHandCharacterItemId ?? existing.mainHandCharacterItemId;
        const offHand = data.offHandCharacterItemId ?? existing.offHandCharacterItemId;

        // Dual-wield: both items required and different (shields don't count as dual-wield)
        const isDualWield = offHand !== null && offHand !== undefined && !isOffHandShield;
        if (isDualWield) {
            if (!mainHand) {
                throw new Error('Dual wield requires both main hand and off hand character items');
            }
            if (mainHand === offHand) {
                throw new Error('Main hand and off hand items must be different');
            }
            // Dual wield cannot use slot 7
            const attackSlot = data.attackSlot ?? existing.attackSlot;
            if (attackSlot === 7) {
                throw new Error('Dual wield cannot use attack slot 7 (off-hand would need slot 8)');
            }
        }

        // Validate slot conflicts (excluding current definition)
        const attackSlot = data.attackSlot !== undefined ? data.attackSlot : existing.attackSlot;
        if (attackSlot !== null) {
            const existingDefinitions = await prisma.characterAttackDefinition.findMany({
                where: {
                    characterId: characterId,
                    id: { not: attackId },
                    attackSlot: { not: null },
                },
            });

            for (const other of existingDefinitions) {
                if (other.attackSlot === attackSlot) {
                    throw new Error(`Attack slot ${attackSlot} is already occupied`);
                }
                // For dual wield, also check slot+1 (shields don't count as dual-wield)
                if (isDualWield && other.attackSlot === attackSlot + 1) {
                    throw new Error(`Attack slot ${attackSlot + 1} is already occupied (needed for dual wield off-hand)`);
                }
                // If other is dual wield, check if it occupies our slot
                if (other.attackSlot !== null && attackSlot === other.attackSlot + 1) {
                    // Check if the other definition's offhand is a shield
                    let otherIsDualWield = false;
                    if (other.offHandCharacterItemId) {
                        const otherOffHandItem = await prisma.characterItem.findFirst({
                            where: { id: other.offHandCharacterItemId },
                        });
                        if (otherOffHandItem?.baseItemId) {
                            const otherBaseItem = await prisma.item.findUnique({
                                where: { id: otherOffHandItem.baseItemId },
                                include: { armor: true },
                            });
                            // Only treat as dual-wield if it's not a shield
                            otherIsDualWield = otherBaseItem?.armor?.category !== ARMOR_CATEGORY_ENUM.Shield;
                        } else {
                            otherIsDualWield = true; // If no baseItemId, assume it's a weapon
                        }
                    }
                    if (otherIsDualWield) {
                        throw new Error(`Attack slot ${attackSlot} is already occupied by dual wield off-hand`);
                    }
                }
            }
        }

        await prisma.characterAttackDefinition.update({
            where: { id: attackId },
            data: {
                attackSlot: data.attackSlot,
                mainHandCharacterItemId: data.mainHandCharacterItemId,
                offHandCharacterItemId: data.offHandCharacterItemId,
                wieldTwoHanded: data.wieldTwoHanded,
            },
        });

        return { message: 'Attack definition updated successfully' };
    },

    async deleteCharacterAttackDefinition(characterId: number, attackId: number): Promise<UpdateResponse> {
        // Verify the attack definition belongs to the character
        const existing = await prisma.characterAttackDefinition.findFirst({
            where: {
                id: attackId,
                characterId: characterId,
            },
        });

        if (!existing) {
            throw new Error('Attack definition not found or does not belong to this character');
        }

        await prisma.characterAttackDefinition.delete({
            where: { id: attackId },
        });

        return { message: 'Attack definition deleted successfully' };
    },

    async reorderCharacterAttackDefinitions(characterId: number, attackDefinitionIds: number[]): Promise<UpdateResponse> {
        // Verify all attack definitions belong to the character
        const existingDefinitions = await prisma.characterAttackDefinition.findMany({
            where: {
                characterId: characterId,
            },
        });

        const existingIds = new Set(existingDefinitions.map(def => def.id));
        for (const id of attackDefinitionIds) {
            if (!existingIds.has(id)) {
                throw new Error(`Attack definition ${id} does not belong to this character`);
            }
        }

        // Verify all IDs are provided (no missing definitions)
        if (attackDefinitionIds.length !== existingDefinitions.length) {
            throw new Error('All attack definitions must be included in reorder');
        }

        // Update slots based on order
        // Dual wield definitions take two consecutive slots
        await prisma.$transaction(async (tx) => {
            let currentSlot = 1;
            let i = 0;
            while (i < attackDefinitionIds.length) {
                const attackId = attackDefinitionIds[i];
                const definition = existingDefinitions.find(def => def.id === attackId);

                if (!definition) {
                    throw new Error(`Attack definition ${attackId} not found`);
                }

                // Check if this is dual wield (has off-hand item)
                const isDualWield = definition.offHandCharacterItemId !== null;

                if (isDualWield) {
                    // Dual wield: check if slot 7 would be needed
                    if (currentSlot === 7) {
                        throw new Error('Cannot place dual wield at slot 7 (off-hand would need slot 8)');
                    }
                    // Update main hand slot
                    await tx.characterAttackDefinition.update({
                        where: { id: attackId },
                        data: { attackSlot: currentSlot },
                    });
                    // Off-hand automatically uses currentSlot + 1, but we need to ensure no conflict
                    // The next definition should skip currentSlot + 1
                    currentSlot += 2;
                } else {
                    // Single slot attack
                    await tx.characterAttackDefinition.update({
                        where: { id: attackId },
                        data: { attackSlot: currentSlot },
                    });
                    currentSlot += 1;
                }

                i += 1;
            }

            // Set remaining definitions to null (not displayed on sheet)
            // This shouldn't happen if all definitions are in the list, but handle it anyway
            const updatedIds = new Set(attackDefinitionIds);
            const toNullify = existingDefinitions.filter(def => !updatedIds.has(def.id));
            if (toNullify.length > 0) {
                await tx.characterAttackDefinition.updateMany({
                    where: {
                        id: { in: toNullify.map(def => def.id) },
                    },
                    data: { attackSlot: null },
                });
            }
        });

        return { message: 'Attack definitions reordered successfully' };
    },
};
