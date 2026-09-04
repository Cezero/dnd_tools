import type { CharacterCompanionDraft, CreatureAdvancementDraft } from '@shared/schema';
import { DraftAction as DraftActionEnum, type DraftAction } from '@shared/static-data';

/**
 * Path-based character draft writer used for companions and selected forms.
 */
export interface CharacterDraftWriter {
    updateValue: (
        path: string,
        value: unknown,
        action?: DraftAction
    ) => Promise<{ success: boolean; id?: number }>;
}

const writeChains = new Map<number, Promise<void>>();

/**
 * Run character-draft writes one at a time per character id.
 * Parallel updateValue calls race on the Redis document and drop rows.
 */
export function enqueueCharacterDraftWrite(
    characterId: number,
    work: () => Promise<void>
): Promise<void> {
    const previous = writeChains.get(characterId) ?? Promise.resolve();
    const next = previous.then(work, work);
    writeChains.set(characterId, next.catch(() => undefined));
    return next;
}

/**
 * Write one companion (tricks and HD advancements) as sequential scalar byId updates.
 */
export async function writeCompanionToDraft(
    writer: CharacterDraftWriter,
    companion: CharacterCompanionDraft
): Promise<void> {
    const prefix = `companions.byId.${companion.id}`;
    await writer.updateValue(`${prefix}.characterId`, companion.characterId);
    await writer.updateValue(`${prefix}.monsterId`, companion.monsterId);
    await writer.updateValue(`${prefix}.companionId`, companion.companionId ?? null);
    await writer.updateValue(`${prefix}.trickPurposeId`, companion.trickPurposeId ?? null);
    await writer.updateValue(`${prefix}.name`, companion.name ?? null);
    await writer.updateValue(`${prefix}.levelAcquired`, companion.levelAcquired ?? null);
    await writer.updateValue(`${prefix}.hitPoints`, companion.hitPoints ?? null);
    await writer.updateValue(`${prefix}.wounds`, companion.wounds ?? 0);
    await writer.updateValue(`${prefix}.maxHpAtFirstLevel`, companion.maxHpAtFirstLevel ?? false);

    for (const trick of companion.tricks ?? []) {
        const trickPrefix = `${prefix}.tricks.byId.${trick.id}`;
        await writer.updateValue(`${trickPrefix}.trickId`, trick.trickId);
        await writer.updateValue(`${trickPrefix}.timesTrained`, trick.timesTrained ?? 1);
        await writer.updateValue(`${trickPrefix}.isBonus`, trick.isBonus ?? false);
        await writer.updateValue(`${trickPrefix}.fromPurpose`, trick.fromPurpose ?? false);
    }

    for (const advancement of companion.advancements ?? []) {
        await writeAdvancementToDraft(writer, `${prefix}.advancements.byId.${advancement.id}`, advancement);
    }
}

/**
 * Write one HD advancement and its skill/feat children.
 */
async function writeAdvancementToDraft(
    writer: CharacterDraftWriter,
    prefix: string,
    advancement: CreatureAdvancementDraft
): Promise<void> {
    await writer.updateValue(`${prefix}.sequence`, advancement.sequence);
    await writer.updateValue(`${prefix}.hitDiceQty`, advancement.hitDiceQty);
    await writer.updateValue(`${prefix}.hitDiceType`, advancement.hitDiceType);
    await writer.updateValue(`${prefix}.hitPoints`, advancement.hitPoints);
    await writer.updateValue(`${prefix}.classId`, advancement.classId ?? null);
    await writer.updateValue(`${prefix}.notes`, advancement.notes ?? null);

    for (const skill of advancement.skills ?? []) {
        const skillPrefix = `${prefix}.skills.byId.${skill.id}`;
        await writer.updateValue(`${skillPrefix}.skillId`, skill.skillId);
        await writer.updateValue(`${skillPrefix}.skillSubId`, skill.skillSubId ?? null);
        await writer.updateValue(`${skillPrefix}.ranks`, skill.ranks);
    }

    for (const feat of advancement.feats ?? []) {
        const featPrefix = `${prefix}.feats.byId.${feat.id}`;
        await writer.updateValue(`${featPrefix}.featId`, feat.featId);
        await writer.updateValue(`${featPrefix}.featSubId`, feat.featSubId ?? null);
        await writer.updateValue(`${featPrefix}.notes`, feat.notes ?? null);
    }
}

/**
 * Replace draft companions with the current editor list (write current, remove stale).
 */
export async function syncCompanionsToDraft(
    writer: CharacterDraftWriter,
    previous: CharacterCompanionDraft[],
    next: CharacterCompanionDraft[]
): Promise<void> {
    const previousIds = new Set(previous.map((row) => row.id));
    const nextIds = new Set(next.map((row) => row.id));
    const previousTricksByCompanion = new Map(
        previous.map((row) => [row.id, new Set((row.tricks ?? []).map((trick) => trick.id))])
    );
    const previousAdvancementsByCompanion = new Map(
        previous.map((row) => [row.id, row.advancements ?? []])
    );

    for (const companion of next) {
        await writeCompanionToDraft(writer, companion);

        const nextTrickIds = new Set((companion.tricks ?? []).map((trick) => trick.id));
        for (const trickId of previousTricksByCompanion.get(companion.id) ?? []) {
            if (!nextTrickIds.has(trickId)) {
                await writer.updateValue(
                    `companions.byId.${companion.id}.tricks.byId.${trickId}`,
                    null,
                    DraftActionEnum.Remove
                );
            }
        }

        await removeStaleAdvancements(
            writer,
            companion.id,
            previousAdvancementsByCompanion.get(companion.id) ?? [],
            companion.advancements ?? []
        );
    }

    for (const rowId of previousIds) {
        if (!nextIds.has(rowId)) {
            await writer.updateValue(`companions.byId.${rowId}`, null, DraftActionEnum.Remove);
        }
    }
}

/**
 * Removes advancement rows (and nested skills/feats) that are no longer on the companion.
 */
async function removeStaleAdvancements(
    writer: CharacterDraftWriter,
    companionId: number,
    previous: CreatureAdvancementDraft[],
    next: CreatureAdvancementDraft[]
): Promise<void> {
    const nextById = new Map(next.map((row) => [row.id, row]));
    for (const previousAdv of previous) {
        const current = nextById.get(previousAdv.id);
        if (!current) {
            await writer.updateValue(
                `companions.byId.${companionId}.advancements.byId.${previousAdv.id}`,
                null,
                DraftActionEnum.Remove
            );
            continue;
        }

        const nextSkillIds = new Set((current.skills ?? []).map((skill) => skill.id));
        for (const skill of previousAdv.skills ?? []) {
            if (!nextSkillIds.has(skill.id)) {
                await writer.updateValue(
                    `companions.byId.${companionId}.advancements.byId.${previousAdv.id}.skills.byId.${skill.id}`,
                    null,
                    DraftActionEnum.Remove
                );
            }
        }

        const nextFeatIds = new Set((current.feats ?? []).map((feat) => feat.id));
        for (const feat of previousAdv.feats ?? []) {
            if (!nextFeatIds.has(feat.id)) {
                await writer.updateValue(
                    `companions.byId.${companionId}.advancements.byId.${previousAdv.id}.feats.byId.${feat.id}`,
                    null,
                    DraftActionEnum.Remove
                );
            }
        }
    }
}
