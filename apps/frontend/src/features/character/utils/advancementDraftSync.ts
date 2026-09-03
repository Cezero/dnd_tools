import type { CharacterFeatureChoice } from '@shared/schema';
import { DraftAction as DraftActionEnum, type DraftAction } from '@shared/static-data';

import type { SkillRank } from '../types';

import { createStableDraftRowId } from './draftKeyUtils';

/**
 * Path-based advancement draft writer used by CharacterEdit.
 */
export interface AdvancementDraftWriter {
    updateValue: (
        path: string,
        value: unknown,
        action?: DraftAction
    ) => Promise<{ success: boolean; id?: number }>;
}

const writeChains = new Map<number, Promise<void>>();

/**
 * Run advancement draft writes one at a time per draft id.
 *
 * `updateValue` reads and writes the whole Redis document. Parallel calls lose
 * all but the last write, which is why feature choices never persisted.
 */
export function enqueueAdvancementDraftWrite(
    draftId: number,
    work: () => Promise<void>
): Promise<void> {
    const previous = writeChains.get(draftId) ?? Promise.resolve();
    const next = previous.then(work, work);
    writeChains.set(draftId, next.catch(() => undefined));
    return next;
}

/**
 * Write one feature choice as sequential scalar byId updates.
 */
export async function writeFeatureChoiceToDraft(
    writer: AdvancementDraftWriter,
    choice: CharacterFeatureChoice,
    characterId: number,
    advancementId: number
): Promise<void> {
    const rowId = createStableDraftRowId(`choice:${choice.featureId}:${choice.featureEntityId}`);
    await writer.updateValue(`featureChoices.byId.${rowId}.characterId`, characterId);
    await writer.updateValue(`featureChoices.byId.${rowId}.advancementId`, advancementId);
    await writer.updateValue(`featureChoices.byId.${rowId}.featureId`, choice.featureId);
    await writer.updateValue(`featureChoices.byId.${rowId}.featureEntityId`, choice.featureEntityId);
    await writer.updateValue(`featureChoices.byId.${rowId}.appliesToId`, choice.appliesToId);
    await writer.updateValue(`featureChoices.byId.${rowId}.appliesToSubId`, choice.appliesToSubId ?? null);
    await writer.updateValue(`featureChoices.byId.${rowId}.choiceIndex`, choice.choiceIndex ?? null);
}

/**
 * Replace draft feature choices with the current editor list (write current, remove stale).
 */
export async function syncFeatureChoicesToDraft(
    writer: AdvancementDraftWriter,
    previous: CharacterFeatureChoice[],
    next: CharacterFeatureChoice[],
    characterId: number,
    advancementId: number
): Promise<void> {
    const previousIds = new Set(
        previous.map((choice) => createStableDraftRowId(`choice:${choice.featureId}:${choice.featureEntityId}`))
    );
    const nextIds = new Set(
        next.map((choice) => createStableDraftRowId(`choice:${choice.featureId}:${choice.featureEntityId}`))
    );

    for (const choice of next) {
        await writeFeatureChoiceToDraft(writer, choice, characterId, advancementId);
    }

    for (const rowId of previousIds) {
        if (!nextIds.has(rowId)) {
            await writer.updateValue(`featureChoices.byId.${rowId}`, null, DraftActionEnum.Remove);
        }
    }
}

/**
 * Write current skill ranks as sequential scalar byId updates.
 */
export async function writeSkillRanksToDraft(
    writer: AdvancementDraftWriter,
    skillRanks: SkillRank[]
): Promise<void> {
    for (const skillRank of skillRanks) {
        const rowId = createStableDraftRowId(
            `skill:${skillRank.skillId}:${skillRank.skillSubId ?? 0}:${skillRank.customSubtype ?? ''}`
        );
        await writer.updateValue(`skills.byId.${rowId}.skillId`, skillRank.skillId);
        await writer.updateValue(`skills.byId.${rowId}.skillSubId`, skillRank.skillSubId ?? null);
        await writer.updateValue(`skills.byId.${rowId}.customSubtype`, skillRank.customSubtype ?? null);
        await writer.updateValue(`skills.byId.${rowId}.pointsSpent`, skillRank.pointsSpent);
    }
}

/**
 * Write current feat selections as sequential scalar byId updates.
 */
export async function writeFeatsToDraft(
    writer: AdvancementDraftWriter,
    selectedFeats: number[],
    featSubIds: Record<number, number | null>
): Promise<void> {
    for (const featId of selectedFeats) {
        const featSubId = featSubIds[featId] ?? null;
        const rowId = createStableDraftRowId(`feat:${featId}:${featSubId ?? 0}`);
        await writer.updateValue(`feats.byId.${rowId}.featId`, featId);
        await writer.updateValue(`feats.byId.${rowId}.featSubId`, featSubId);
    }
}

/**
 * Write current spells known as sequential scalar byId updates.
 */
export async function writeSpellsKnownToDraft(
    writer: AdvancementDraftWriter,
    spellsKnown: Array<{ spellId: number; isFreeGrant: boolean }>
): Promise<void> {
    for (const spell of spellsKnown) {
        const rowId = createStableDraftRowId(`spell:${spell.spellId}:${spell.isFreeGrant ? 1 : 0}`);
        await writer.updateValue(`spellsKnown.byId.${rowId}.spellId`, spell.spellId);
        await writer.updateValue(`spellsKnown.byId.${rowId}.isFreeGrant`, spell.isFreeGrant === true);
    }
}

/**
 * Flush editor advancement collections into Redis before save.
 *
 * This is still the editor → Redis path (scalar `updateValue` writes), not a
 * save-time bypass. Save then persists Redis to MySQL.
 */
export async function flushAdvancementCollectionsToDraft(params: {
    writer: AdvancementDraftWriter;
    draftId: number;
    characterId: number;
    featureChoices: CharacterFeatureChoice[];
    previousFeatureChoices: CharacterFeatureChoice[];
    skillRanks: SkillRank[];
    selectedFeats: number[];
    featSubIds: Record<number, number | null>;
    spellsKnown: Array<{ spellId: number; isFreeGrant: boolean }>;
}): Promise<void> {
    const { writer, draftId, characterId } = params;
    await enqueueAdvancementDraftWrite(draftId, async () => {
        await syncFeatureChoicesToDraft(
            writer,
            params.previousFeatureChoices,
            params.featureChoices,
            characterId,
            draftId
        );
        await writeSkillRanksToDraft(writer, params.skillRanks);
        await writeFeatsToDraft(writer, params.selectedFeats, params.featSubIds);
        await writeSpellsKnownToDraft(writer, params.spellsKnown);
    });
}
