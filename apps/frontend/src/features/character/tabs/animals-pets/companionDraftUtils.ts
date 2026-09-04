import { createStableDraftRowId } from '@/features/character/utils/draftKeyUtils';
import type {
    CharacterCompanionDraft,
    CharacterCompanionTrickDraft,
    CharacterFeatureChoice,
    CompanionCacheEntry,
    FeatureWithRelations,
    TrickPurposeWithRelations,
} from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

const COMPANION_CHOICE_TYPES = new Set<number>([
    EntityAppliesToType.AnimalCompanion,
    EntityAppliesToType.Familiar,
]);

/**
 * Applies a Handle Animal purpose to a companion draft.
 * Combat Riding (or any purpose whose replacesPurposeId matches the current purpose)
 * wipes all tricks, then installs the package as fromPurpose.
 */
export function applyPurposeToCompanionDraft(
    companion: CharacterCompanionDraft,
    nextPurposeId: number | null,
    purposes: TrickPurposeWithRelations[]
): CharacterCompanionDraft {
    const previousPurposeId = companion.trickPurposeId ?? null;
    if (nextPurposeId === previousPurposeId) {
        return companion;
    }

    const nextPurpose = nextPurposeId === null
        ? undefined
        : purposes.find((purpose) => purpose.id === nextPurposeId);
    const wipeAll = Boolean(
        nextPurpose?.replacesPurposeId
        && nextPurpose.replacesPurposeId === previousPurposeId
    );
    const remainingTricks = wipeAll
        ? []
        : (companion.tricks ?? []).filter((trick) => !trick.fromPurpose);
    const purposeTricks: CharacterCompanionTrickDraft[] = (nextPurpose?.tricks ?? []).map((row) => ({
        id: createStableDraftRowId(`companion-trick:${companion.id}:${row.trickId}:purpose`),
        trickId: row.trickId,
        timesTrained: row.timesTrained ?? 1,
        isBonus: false,
        fromPurpose: true,
    }));

    return {
        ...companion,
        trickPurposeId: nextPurposeId,
        tricks: [...purposeTricks, ...remainingTricks],
    };
}

/**
 * Upserts class companion rows from Choices and removes class rows that are no longer chosen.
 * Pets (`companionId` null) are left untouched. Returns null when nothing changed.
 */
export function mergeClassCompanionsFromChoices(args: {
    characterId: number;
    companions: CharacterCompanionDraft[];
    featureChoices: CharacterFeatureChoice[];
    features: FeatureWithRelations[];
    companionTemplates: CompanionCacheEntry[];
}): CharacterCompanionDraft[] | null {
    const companionEntityIds = new Set<number>();
    for (const feature of args.features) {
        for (const entity of feature.entities ?? []) {
            if (entity.appliesTo !== undefined && COMPANION_CHOICE_TYPES.has(entity.appliesTo)) {
                companionEntityIds.add(entity.id);
            }
        }
    }

    const selectedCompanionIds = new Set<number>();
    for (const choice of args.featureChoices) {
        if (!companionEntityIds.has(choice.featureEntityId)) {
            continue;
        }
        if (choice.appliesToId > 0) {
            selectedCompanionIds.add(choice.appliesToId);
        }
    }

    if (selectedCompanionIds.size > 0 && args.companionTemplates.length === 0) {
        return null;
    }

    const templateById = new Map(args.companionTemplates.map((template) => [template.id, template]));
    const pets = args.companions.filter((row) => row.companionId === null || row.companionId === undefined);
    const classRows = args.companions.filter((row) => row.companionId !== null && row.companionId !== undefined);
    const existingByCompanionId = new Map(
        classRows
            .filter((row) => row.companionId !== null && row.companionId !== undefined)
            .map((row) => [row.companionId as number, row])
    );

    const nextClassRows: CharacterCompanionDraft[] = [];
    for (const companionId of selectedCompanionIds) {
        const template = templateById.get(companionId);
        if (!template) {
            continue;
        }
        const existing = existingByCompanionId.get(companionId);
        if (existing) {
            nextClassRows.push(
                existing.monsterId === template.monsterId
                    ? existing
                    : { ...existing, monsterId: template.monsterId }
            );
            continue;
        }
        const petIndex = pets.findIndex((pet) => pet.monsterId === template.monsterId);
        if (petIndex >= 0) {
            const [pet] = pets.splice(petIndex, 1);
            nextClassRows.push({
                ...pet,
                companionId,
                monsterId: template.monsterId,
            });
            continue;
        }
        nextClassRows.push({
            id: createStableDraftRowId(`companion:${args.characterId}:${companionId}`),
            characterId: args.characterId,
            monsterId: template.monsterId,
            companionId,
            trickPurposeId: null,
            name: null,
            levelAcquired: null,
            hitPoints: null,
            wounds: 0,
            maxHpAtFirstLevel: false,
            tricks: [],
            advancements: [],
        });
    }

    const next = [...nextClassRows, ...pets];
    if (companionDraftsEqual(args.companions, next)) {
        return null;
    }
    return next;
}

/**
 * Builds an empty pet draft row for the given animal monster.
 */
export function createPetDraft(
    characterId: number,
    monsterId: number
): CharacterCompanionDraft {
    return {
        id: createStableDraftRowId(`pet:${characterId}:${monsterId}:${Date.now()}`),
        characterId,
        monsterId,
        companionId: null,
        trickPurposeId: null,
        name: null,
        levelAcquired: null,
        hitPoints: null,
        wounds: 0,
        maxHpAtFirstLevel: false,
        tricks: [],
        advancements: [],
    };
}

function companionDraftsEqual(
    left: CharacterCompanionDraft[],
    right: CharacterCompanionDraft[]
): boolean {
    if (left.length !== right.length) {
        return false;
    }
    const rightById = new Map(right.map((row) => [row.id, row]));
    for (const row of left) {
        const other = rightById.get(row.id);
        if (!other) {
            return false;
        }
        if (row.companionId !== other.companionId || row.monsterId !== other.monsterId) {
            return false;
        }
    }
    return true;
}
