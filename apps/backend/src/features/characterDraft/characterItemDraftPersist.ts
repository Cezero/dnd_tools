import { Prisma } from '@shared/prisma-client';
import type { CharacterEditState } from '@shared/schema';

type CharacterItemDraft = NonNullable<CharacterEditState['characterItems']>[number];
type AttackDefinitionDraft = NonNullable<CharacterEditState['attackDefinitions']>[number];

/**
 * Persist draft equipment and remap attack item IDs onto MySQL rows.
 *
 * Existing positive IDs are updated in place so attack FKs stay valid.
 * Temp / missing IDs are created and collected in the returned map.
 * A missing (undefined) collection is left untouched — never treated as a wipe.
 */
export async function persistCharacterItemDraftCollections(
    tx: Prisma.TransactionClient,
    characterId: number,
    characterItems: CharacterItemDraft[] | undefined,
    attackDefinitions: AttackDefinitionDraft[] | undefined
): Promise<void> {
    const itemIdMap = new Map<number, number>();

    if (characterItems !== undefined) {
        const existingItems = await tx.characterItem.findMany({ where: { characterId } });
        const existingById = new Map(existingItems.map((item) => [item.id, item]));
        const incomingPersistedIds = new Set(
            characterItems.filter((item) => item.id > 0).map((item) => item.id)
        );

        const itemsToDelete = existingItems.filter((item) => !incomingPersistedIds.has(item.id));
        if (itemsToDelete.length > 0) {
            await tx.characterItem.deleteMany({
                where: {
                    id: { in: itemsToDelete.map((item) => item.id) },
                    characterId,
                },
            });
        }

        for (const item of characterItems) {
            if (item.baseItemId < 1) {
                continue;
            }
            if (item.id > 0 && existingById.has(item.id)) {
                await tx.characterItem.update({
                    where: { id: item.id },
                    data: {
                        baseItemId: item.baseItemId,
                        name: item.name,
                        quantity: item.quantity,
                        location: item.location ?? null,
                    },
                });
                itemIdMap.set(item.id, item.id);
            } else {
                const created = await tx.characterItem.create({
                    data: {
                        characterId,
                        baseItemId: item.baseItemId,
                        name: item.name,
                        quantity: item.quantity,
                        location: item.location ?? null,
                    },
                });
                itemIdMap.set(item.id, created.id);
            }
        }
    } else {
        const existingItems = await tx.characterItem.findMany({
            where: { characterId },
            select: { id: true },
        });
        for (const item of existingItems) {
            itemIdMap.set(item.id, item.id);
        }
    }

    if (attackDefinitions === undefined) {
        return;
    }

    const remapItemId = (id: number | null): number | null => {
        if (id === null) {
            return null;
        }
        return itemIdMap.get(id) ?? (id > 0 ? id : null);
    };

    const existingAttacks = await tx.characterAttackDefinition.findMany({ where: { characterId } });
    const existingById = new Map(existingAttacks.map((attack) => [attack.id, attack]));
    const incomingPersistedIds = new Set(
        attackDefinitions.filter((attack) => attack.id > 0).map((attack) => attack.id)
    );

    const attacksToDelete = existingAttacks.filter((attack) => !incomingPersistedIds.has(attack.id));
    if (attacksToDelete.length > 0) {
        await tx.characterAttackDefinition.deleteMany({
            where: {
                id: { in: attacksToDelete.map((attack) => attack.id) },
                characterId,
            },
        });
    }

    for (const attack of attackDefinitions) {
        const data = {
            attackSlot: attack.attackSlot ?? null,
            mainHandCharacterItemId: remapItemId(attack.mainHandCharacterItemId),
            offHandCharacterItemId: remapItemId(attack.offHandCharacterItemId),
            wieldTwoHanded: attack.wieldTwoHanded ?? false,
        };

        if (attack.id > 0 && existingById.has(attack.id)) {
            await tx.characterAttackDefinition.update({
                where: { id: attack.id },
                data,
            });
        } else {
            await tx.characterAttackDefinition.create({
                data: {
                    characterId,
                    ...data,
                },
            });
        }
    }
}
