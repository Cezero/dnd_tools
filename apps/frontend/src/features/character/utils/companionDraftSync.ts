import type { CharacterCompanionDraft } from '@shared/schema';
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
 * Write one companion (and nested tricks/skills/feats) as sequential scalar byId updates.
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

    for (const trick of companion.tricks ?? []) {
        const trickPrefix = `${prefix}.tricks.byId.${trick.id}`;
        await writer.updateValue(`${trickPrefix}.trickId`, trick.trickId);
        await writer.updateValue(`${trickPrefix}.timesTrained`, trick.timesTrained ?? 1);
        await writer.updateValue(`${trickPrefix}.isBonus`, trick.isBonus ?? false);
        await writer.updateValue(`${trickPrefix}.fromPurpose`, trick.fromPurpose ?? false);
    }

    for (const skill of companion.skills ?? []) {
        const skillPrefix = `${prefix}.skills.byId.${skill.id}`;
        await writer.updateValue(`${skillPrefix}.skillId`, skill.skillId);
        await writer.updateValue(`${skillPrefix}.skillSubId`, skill.skillSubId ?? null);
        await writer.updateValue(`${skillPrefix}.ranks`, skill.ranks);
    }

    for (const feat of companion.feats ?? []) {
        const featPrefix = `${prefix}.feats.byId.${feat.id}`;
        await writer.updateValue(`${featPrefix}.featId`, feat.featId);
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
    const previousSkillsByCompanion = new Map(
        previous.map((row) => [row.id, new Set((row.skills ?? []).map((skill) => skill.id))])
    );
    const previousFeatsByCompanion = new Map(
        previous.map((row) => [row.id, new Set((row.feats ?? []).map((feat) => feat.id))])
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

        const nextSkillIds = new Set((companion.skills ?? []).map((skill) => skill.id));
        for (const skillId of previousSkillsByCompanion.get(companion.id) ?? []) {
            if (!nextSkillIds.has(skillId)) {
                await writer.updateValue(
                    `companions.byId.${companion.id}.skills.byId.${skillId}`,
                    null,
                    DraftActionEnum.Remove
                );
            }
        }

        const nextFeatIds = new Set((companion.feats ?? []).map((feat) => feat.id));
        for (const featId of previousFeatsByCompanion.get(companion.id) ?? []) {
            if (!nextFeatIds.has(featId)) {
                await writer.updateValue(
                    `companions.byId.${companion.id}.feats.byId.${featId}`,
                    null,
                    DraftActionEnum.Remove
                );
            }
        }
    }

    for (const rowId of previousIds) {
        if (!nextIds.has(rowId)) {
            await writer.updateValue(`companions.byId.${rowId}`, null, DraftActionEnum.Remove);
        }
    }
}
