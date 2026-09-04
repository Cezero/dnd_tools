import type { CharacterEditState } from '@shared/schema';
import { DraftAction as DraftActionEnum } from '@shared/static-data';

import type { AttackDefinition, EquipmentItem } from '../types';
import type { CharacterDraftWriter } from './companionDraftSync';
import { mapEquipmentToCharacterItems } from './equipmentUtils';

type CharacterItemDraft = NonNullable<CharacterEditState['characterItems']>[number];
type AttackDefinitionDraft = NonNullable<CharacterEditState['attackDefinitions']>[number];

/**
 * Write one character item as sequential scalar byId updates.
 */
export async function writeCharacterItemToDraft(
    writer: CharacterDraftWriter,
    item: CharacterItemDraft
): Promise<void> {
    const prefix = `characterItems.byId.${item.id}`;
    await writer.updateValue(`${prefix}.characterId`, item.characterId);
    await writer.updateValue(`${prefix}.baseItemId`, item.baseItemId);
    await writer.updateValue(`${prefix}.name`, item.name);
    await writer.updateValue(`${prefix}.quantity`, item.quantity);
    await writer.updateValue(`${prefix}.location`, item.location ?? null);
}

/**
 * Replace draft characterItems with the current editor equipment list.
 */
export async function syncCharacterItemsToDraft(
    writer: CharacterDraftWriter,
    characterId: number,
    previous: EquipmentItem[],
    next: EquipmentItem[]
): Promise<void> {
    const previousIds = new Set(previous.map((row) => row.id));
    const nextItems = mapEquipmentToCharacterItems(next, characterId);
    const nextIds = new Set(nextItems.map((row) => row.id));

    for (const item of nextItems) {
        await writeCharacterItemToDraft(writer, item);
    }

    for (const rowId of previousIds) {
        if (!nextIds.has(rowId)) {
            await writer.updateValue(`characterItems.byId.${rowId}`, null, DraftActionEnum.Remove);
        }
    }
}

/**
 * Write one attack definition as sequential scalar byId updates.
 */
export async function writeAttackDefinitionToDraft(
    writer: CharacterDraftWriter,
    attack: AttackDefinitionDraft
): Promise<void> {
    const prefix = `attackDefinitions.byId.${attack.id}`;
    await writer.updateValue(`${prefix}.characterId`, attack.characterId);
    await writer.updateValue(`${prefix}.attackSlot`, attack.attackSlot ?? null);
    await writer.updateValue(`${prefix}.mainHandCharacterItemId`, attack.mainHandCharacterItemId);
    await writer.updateValue(`${prefix}.offHandCharacterItemId`, attack.offHandCharacterItemId);
    await writer.updateValue(`${prefix}.wieldTwoHanded`, attack.wieldTwoHanded ?? false);
}

/**
 * Replace draft attackDefinitions with the current editor list.
 */
export async function syncAttackDefinitionsToDraft(
    writer: CharacterDraftWriter,
    characterId: number,
    previous: AttackDefinition[],
    next: AttackDefinition[]
): Promise<void> {
    const previousIds = new Set(previous.map((row) => row.id));
    const nextIds = new Set(next.map((row) => row.id));

    for (const definition of next) {
        await writeAttackDefinitionToDraft(writer, {
            id: definition.id,
            characterId,
            attackSlot: definition.attackSlot,
            mainHandCharacterItemId: definition.mainHandCharacterItemId,
            offHandCharacterItemId: definition.offHandCharacterItemId,
            wieldTwoHanded: definition.wieldTwoHanded,
        });
    }

    for (const rowId of previousIds) {
        if (!nextIds.has(rowId)) {
            await writer.updateValue(`attackDefinitions.byId.${rowId}`, null, DraftActionEnum.Remove);
        }
    }
}
