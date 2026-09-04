import type { CharacterBonusSkillRankDraft } from '@shared/schema';
import { DraftAction as DraftActionEnum } from '@shared/static-data';

import type { CharacterDraftWriter } from './companionDraftSync';

/**
 * Write one bonus-rank grant as sequential scalar byId updates.
 */
export async function writeBonusSkillRankToDraft(
    writer: CharacterDraftWriter,
    grant: CharacterBonusSkillRankDraft
): Promise<void> {
    const prefix = `bonusSkillRanks.byId.${grant.id}`;
    await writer.updateValue(`${prefix}.characterId`, grant.characterId);
    await writer.updateValue(`${prefix}.skillId`, grant.skillId);
    await writer.updateValue(`${prefix}.skillSubId`, grant.skillSubId);
    await writer.updateValue(`${prefix}.customSubtype`, grant.customSubtype);
    await writer.updateValue(`${prefix}.ranks`, grant.ranks);
    await writer.updateValue(`${prefix}.description`, grant.description);
}

/**
 * Replace draft bonusSkillRanks with the current editor list.
 */
export async function syncBonusSkillRanksToDraft(
    writer: CharacterDraftWriter,
    previous: CharacterBonusSkillRankDraft[],
    next: CharacterBonusSkillRankDraft[]
): Promise<void> {
    const previousIds = new Set(previous.map((row) => row.id));
    const nextIds = new Set(next.map((row) => row.id));

    for (const grant of next) {
        await writeBonusSkillRankToDraft(writer, grant);
    }

    for (const rowId of previousIds) {
        if (!nextIds.has(rowId)) {
            await writer.updateValue(`bonusSkillRanks.byId.${rowId}`, null, DraftActionEnum.Remove);
        }
    }
}
