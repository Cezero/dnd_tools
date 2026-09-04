import { prisma } from '@/lib/prisma';
import type {
    AdvancementEditState,
    CharacterEditState,
    CharacterIdParamRequest,
    Character,
    CreateCharacterRequest,
    SaveCharacterRequest,
    GetAllCharactersResponse,
    GetAllCharactersAdminResponse,
    CharacterWithAllDetailsResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';
import { AlignmentId, CurrencyId, DraftType, EditionId, SpellSlotType } from '@shared/static-data';
import type { AlignmentId as AlignmentIdType } from '@shared/static-data'; // TODO don't import with a type alias
import type { CurrencyId as CurrencyIdType } from '@shared/static-data'; // TODO don't import with a type alias

import { characterResolutionProjectionService } from '../../characterResolution/characterResolutionProjectionService';
import { companionSyncService } from '../../companion/companionSyncService';
import { DraftLockService } from '../../shared/draftState/DraftLockService';
import { DraftStateService } from '../../shared/draftState/DraftStateService';
import { UserSessionService } from '../../shared/session/UserSessionService';


/**
 * TODO
 * Why does this file exist at all? in fact, why is there a "services" folder under character?
 * that isn't how other features work.
 */

/**
 * Helper function to calculate class/level string from advancements.
 * 
 * @param advancements - Array of advancements with class abbreviations
 * @returns Class/level string (e.g., "Ftr 1/Clr 1" or "Ftr/Clr 1")
 */
function calculateClassLevelString(advancements: Array<{
    level: number;
    class?: { abbreviation: string | null } | null;
    secondaryClass?: { abbreviation: string | null } | null;
}>): string {
    if (advancements.length === 0) {
        return '';
    }

    // Sort advancements by level
    const sortedAdvancements = [...advancements].sort((a, b) => a.level - b.level);

    const parts: string[] = [];

    sortedAdvancements.forEach(adv => {
        const primaryAbbr = adv.class?.abbreviation || '?';
        const secondaryAbbr = adv.secondaryClass?.abbreviation || null;

        if (secondaryAbbr) {
            // Gestalt: "Ftr/Clr 1" (both classes at same level)
            parts.push(`${primaryAbbr}/${secondaryAbbr} ${adv.level}`);
        } else {
            // Single class: "Ftr 1"
            parts.push(`${primaryAbbr} ${adv.level}`);
        }
    });

    // Join with "/" for multiclass: "Ftr 1/Clr 1"
    return parts.join('/');
}

function coerceAlignmentId(value: number | null): AlignmentIdType | null {
    if (value === null) {
        return null;
    }
    return (Object.values(AlignmentId) as number[]).includes(value) ? (value as AlignmentIdType) : null;
}

function coerceCurrencyId(value: number): CurrencyIdType {
    return (Object.values(CurrencyId) as number[]).includes(value) ? (value as CurrencyIdType) : CurrencyId.Gold;
}

const draftLockService = new DraftLockService();
const draftStateService = new DraftStateService();
const userSessionService = new UserSessionService();

interface DraftCharacterState {
    characterId: number;
    name?: unknown;
    raceId?: unknown;
    alignmentId?: unknown;
    deityId?: unknown;
    age?: unknown;
    height?: unknown;
    weight?: unknown;
    eyes?: unknown;
    hair?: unknown;
    gender?: unknown;
    notes?: unknown;
    editionId?: unknown;
    allowVariantClasses?: unknown;
    isGestalt?: unknown;
    ignoreLevelAdjustment?: unknown;
    maxHpAtFirstLevel?: unknown;
    abilityScores?: unknown;
    wealth?: unknown;
    disallowedSources?: unknown;
    characterLanguages?: unknown;
    bonusSkillRanks?: unknown;
    characterItems?: unknown;
    attackDefinitions?: unknown;
    companions?: unknown;
    selectedForms?: unknown;
}

interface DraftAdvancementState {
    advancementId: number;
    characterId: number;
    level?: unknown;
    version?: unknown;
    classId?: unknown;
    secondaryClassId?: unknown;
    hitPoints?: unknown;
    abilityId?: unknown;
    notes?: unknown;
    skills?: unknown;
    feats?: unknown;
    spellsKnown?: unknown;
    featureChoices?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function asInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) {
        return value;
    }
    return null;
}

function asBool(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
}

function asStringOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

function asIntOrNull(value: unknown): number | null {
    return value === null ? null : asInt(value);
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

/**
 * Map a Redis advancement draft's collections onto the API row shape.
 *
 * Used for draft-only characters and for overlaying a locked edit session
 * onto a persisted character so reload restores Redis, not MySQL.
 */
function mapDraftAdvancementCollections(
    draft: DraftAdvancementState,
    characterId: number,
    advancementId: number
): {
    skills: Array<{
        advancementId: number;
        skillId: number;
        skillSubId: number | null;
        pointsSpent: number;
        customSubtype: string | null;
    }>;
    feats: Array<{
        advancementId: number;
        featId: number;
        featSubId: number | null;
    }>;
    spellsKnown: Array<{
        advancementId: number;
        spellId: number;
        isFreeGrant: boolean;
    }>;
    featureChoices: Array<{
        id: number;
        characterId: number;
        featureId: number;
        advancementId: number;
        featureEntityId: number;
        appliesToId: number;
        appliesToSubId: number | null;
        choiceIndex: number | null;
        choiceGroupId: string | null;
        choiceData: unknown;
        linkedChoiceGroupId: string | null;
    }>;
} {
    return {
        skills: asArray(draft.skills).filter(isRecord).map((s) => ({
            advancementId,
            skillId: asInt(s.skillId) ?? 0,
            skillSubId: asIntOrNull(s.skillSubId),
            pointsSpent: asInt(s.pointsSpent) ?? 0,
            customSubtype: asStringOrNull(s.customSubtype),
        })),
        feats: asArray(draft.feats).filter(isRecord).map((f) => ({
            advancementId,
            featId: asInt(f.featId) ?? 0,
            featSubId: asIntOrNull(f.featSubId),
        })),
        spellsKnown: asArray(draft.spellsKnown).filter(isRecord).map((sp) => ({
            advancementId,
            spellId: asInt(sp.spellId) ?? 0,
            isFreeGrant: asBool(sp.isFreeGrant) ?? false,
        })),
        featureChoices: asArray(draft.featureChoices).filter(isRecord).map((c) => ({
            id: asInt(c.id) ?? 0,
            characterId,
            featureId: asInt(c.featureId) ?? 0,
            advancementId,
            featureEntityId: asInt(c.featureEntityId) ?? 0,
            appliesToId: asInt(c.appliesToId) ?? 0,
            appliesToSubId: asIntOrNull(c.appliesToSubId),
            choiceIndex: asIntOrNull(c.choiceIndex),
            choiceGroupId: asStringOrNull(c.choiceGroupId),
            choiceData: c.choiceData ?? null,
            linkedChoiceGroupId: asStringOrNull(c.linkedChoiceGroupId),
        })),
    };
}

function hasOwn(obj: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Maps persisted or draft companion rows onto the character-edit draft shape.
 */
function mapDraftCompanions(value: unknown, characterId: number): CharacterWithAllDetailsResponse['companions'] {
    return asArray(value).filter(isRecord).map((row) => ({
        id: asInt(row.id) ?? 0,
        characterId: asInt(row.characterId) ?? characterId,
        monsterId: asInt(row.monsterId) ?? 0,
        companionId: asIntOrNull(row.companionId),
        trickPurposeId: asIntOrNull(row.trickPurposeId),
        name: asStringOrNull(row.name),
        levelAcquired: asIntOrNull(row.levelAcquired),
        hitPoints: asIntOrNull(row.hitPoints),
        wounds: asInt(row.wounds) ?? 0,
        tricks: asArray(row.tricks).filter(isRecord).map((trick) => ({
            id: asInt(trick.id) ?? 0,
            trickId: asInt(trick.trickId) ?? 0,
            timesTrained: asInt(trick.timesTrained) ?? 1,
            isBonus: asBool(trick.isBonus) ?? false,
            fromPurpose: asBool(trick.fromPurpose) ?? false,
        })),
        skills: asArray(row.skills).filter(isRecord).map((skill) => ({
            id: asInt(skill.id) ?? 0,
            skillId: asInt(skill.skillId) ?? 0,
            skillSubId: asIntOrNull(skill.skillSubId),
            ranks: asInt(skill.ranks) ?? 0,
        })),
        feats: asArray(row.feats).filter(isRecord).map((feat) => ({
            id: asInt(feat.id) ?? 0,
            featId: asInt(feat.featId) ?? 0,
            notes: asStringOrNull(feat.notes),
        })),
    }));
}

/**
 * Maps persisted or draft selected-form rows onto the character-edit draft shape.
 */
/**
 * Maps persisted or draft bonus-rank rows onto the character-edit draft shape.
 */
function mapDraftBonusSkillRanks(value: unknown, characterId: number): NonNullable<CharacterWithAllDetailsResponse['bonusSkillRanks']> {
    return asArray(value).filter(isRecord).map((row) => ({
        id: asInt(row.id) ?? 0,
        characterId: asInt(row.characterId) ?? characterId,
        skillId: asInt(row.skillId) ?? 0,
        skillSubId: asIntOrNull(row.skillSubId),
        customSubtype: asStringOrNull(row.customSubtype),
        ranks: asInt(row.ranks) ?? 0,
        description: typeof row.description === 'string' ? row.description : '',
    })).filter((row) => row.skillId > 0 && row.ranks > 0);
}

function mapDraftSelectedForms(value: unknown, characterId: number): CharacterWithAllDetailsResponse['selectedForms'] {
    return asArray(value).filter(isRecord).map((row) => ({
        id: asInt(row.id) ?? 0,
        characterId: asInt(row.characterId) ?? characterId,
        featureId: asInt(row.featureId) ?? 0,
        monsterId: asInt(row.monsterId) ?? 0,
        sortOrder: asInt(row.sortOrder) ?? 0,
    }));
}

/**
 * Overlay Redis drafts onto a persisted character when this user holds the edit locks.
 *
 * View-mode (no lock) stays MySQL. Edit-mode reload must restore the session draft.
 */
async function overlayLockedDraftsOnCharacter(
    character: CharacterWithAllDetailsResponse,
    userId: number
): Promise<CharacterWithAllDetailsResponse> {
    const characterLockedBy = await draftLockService.checkLock(DraftType.Character, character.id);
    let next: CharacterWithAllDetailsResponse = character;

    if (characterLockedBy === userId) {
        const rawCharacterDraft = await draftStateService.getState<unknown>(DraftType.Character, character.id);
        if (rawCharacterDraft && isRecord(rawCharacterDraft)) {
            const draft = rawCharacterDraft as unknown as DraftCharacterState;
            next = {
                ...next,
                name: typeof draft.name === 'string' ? draft.name : next.name,
                raceId: asIntOrNull(draft.raceId) ?? next.raceId,
                alignmentId: coerceAlignmentId(asIntOrNull(draft.alignmentId)) ?? next.alignmentId,
                deityId: asIntOrNull(draft.deityId) ?? next.deityId,
                age: asIntOrNull(draft.age) ?? next.age,
                height: asIntOrNull(draft.height) ?? next.height,
                weight: asIntOrNull(draft.weight) ?? next.weight,
                eyes: asStringOrNull(draft.eyes) ?? next.eyes,
                hair: asStringOrNull(draft.hair) ?? next.hair,
                gender: asStringOrNull(draft.gender) ?? next.gender,
                notes: asStringOrNull(draft.notes) ?? next.notes,
                editionId: asInt(draft.editionId) ?? next.editionId,
                wealth: asArray(draft.wealth).length > 0
                    ? asArray(draft.wealth).filter(isRecord).map((w) => ({
                        id: asInt(w.id) ?? 0,
                        characterId: character.id,
                        currencyId: coerceCurrencyId(asInt(w.currencyId) ?? CurrencyId.Gold),
                        quantity: asInt(w.quantity) ?? 0,
                        value: asIntOrNull(w.value),
                        description: asStringOrNull(w.description),
                    }))
                    : next.wealth,
                config: next.config
                    ? {
                        ...next.config,
                        allowVariantClasses: asBool(draft.allowVariantClasses) ?? next.config.allowVariantClasses,
                        isGestalt: asBool(draft.isGestalt) ?? next.config.isGestalt,
                        ignoreLevelAdjustment: asBool(draft.ignoreLevelAdjustment) ?? next.config.ignoreLevelAdjustment,
                        maxHpAtFirstLevel: asBool(draft.maxHpAtFirstLevel) ?? next.config.maxHpAtFirstLevel,
                    }
                    : next.config,
                companions: hasOwn(draft, 'companions')
                    ? mapDraftCompanions(draft.companions, character.id)
                    : next.companions,
                selectedForms: hasOwn(draft, 'selectedForms')
                    ? mapDraftSelectedForms(draft.selectedForms, character.id)
                    : next.selectedForms,
                characterItems: hasOwn(draft, 'characterItems')
                    ? asArray(draft.characterItems).filter(isRecord).map((item) => ({
                        id: asInt(item.id) ?? 0,
                        name: typeof item.name === 'string' ? item.name : '',
                        quantity: asIntOrNull(item.quantity),
                        location: asIntOrNull(item.location),
                        characterId: character.id,
                        baseItemId: asInt(item.baseItemId) ?? 0,
                    }))
                    : next.characterItems,
                attackDefinitions: hasOwn(draft, 'attackDefinitions')
                    ? asArray(draft.attackDefinitions).filter(isRecord).map((def) => ({
                        id: asInt(def.id) ?? 0,
                        characterId: character.id,
                        attackSlot: asIntOrNull(def.attackSlot),
                        mainHandCharacterItemId: asIntOrNull(def.mainHandCharacterItemId),
                        offHandCharacterItemId: asIntOrNull(def.offHandCharacterItemId),
                        wieldTwoHanded: asBool(def.wieldTwoHanded) ?? false,
                    }))
                    : next.attackDefinitions,
                bonusSkillRanks: hasOwn(draft, 'bonusSkillRanks')
                    ? mapDraftBonusSkillRanks(draft.bonusSkillRanks, character.id)
                    : next.bonusSkillRanks,
            };
        }
    }

    const advancements = await Promise.all(next.advancements.map(async (adv) => {
        const lockedBy = await draftLockService.checkLock(DraftType.Advancement, adv.id);
        if (lockedBy !== userId) {
            return adv;
        }
        const rawAdvDraft = await draftStateService.getState<unknown>(DraftType.Advancement, adv.id);
        if (!rawAdvDraft || !isRecord(rawAdvDraft)) {
            return adv;
        }
        const draft = rawAdvDraft as unknown as DraftAdvancementState;
        const collections = mapDraftAdvancementCollections(draft, character.id, adv.id);
        return {
            ...adv,
            classId: asInt(draft.classId) ?? adv.classId,
            secondaryClassId: Object.prototype.hasOwnProperty.call(draft, 'secondaryClassId')
                ? asIntOrNull(draft.secondaryClassId)
                : adv.secondaryClassId,
            hitPoints: asInt(draft.hitPoints) ?? adv.hitPoints,
            ...collections,
        };
    }));

    return {
        ...next,
        advancements,
    };
}

async function getDraftCharacterWithAllDetails(args: {
    draftCharacterId: number;
    userId: number;
}): Promise<CharacterWithAllDetailsResponse | null> {
    const { draftCharacterId, userId } = args;

    // Enforce lock ownership for draft-only loads.
    // Handle stale locks: if lock exists but session doesn't (or session doesn't have this draft in editing), clear it
    const lockedBy = await draftLockService.checkLock(DraftType.Character, draftCharacterId);
    if (lockedBy !== null && lockedBy !== userId) {
        // Lock exists but is held by a different user - check if it's stale
        const lockOwnerSession = await userSessionService.getUserSession(lockedBy);
        const isStaleLock = !lockOwnerSession || 
            !lockOwnerSession.editing.some(ref => ref.draftType === DraftType.Character && ref.id === draftCharacterId);
        
        if (isStaleLock) {
            // Stale lock: session expired or doesn't reference this draft - clear it
            await draftLockService.forceReleaseLock(DraftType.Character, draftCharacterId, userId);
        } else {
            // Lock is valid and held by another user
            throw new Error(`Draft type ${DraftType.Character} is locked by another user`);
        }
    }

    const rawCharacterState = await draftStateService.getState<unknown>(DraftType.Character, draftCharacterId);
    if (!rawCharacterState || !isRecord(rawCharacterState)) {
        return null;
    }

    const characterState = rawCharacterState as unknown as DraftCharacterState;

    // Find the advancement draft in the user's editing session that belongs to this draft character.
    const session = await userSessionService.getUserSession(userId);
    const editing = session?.editing ?? [];

    const advancementCandidates = editing.filter((ref) => ref.draftType === DraftType.Advancement && typeof ref.id === 'number');

    let bestAdvancement: DraftAdvancementState | null = null;
    for (const ref of advancementCandidates) {
        const advId = ref.id;
        const rawAdvState = await draftStateService.getState<unknown>(DraftType.Advancement, advId);
        if (!rawAdvState || !isRecord(rawAdvState)) {
            continue;
        }
        const adv = rawAdvState as unknown as DraftAdvancementState;
        if (asInt((adv as unknown as { characterId?: unknown }).characterId) !== draftCharacterId) {
            continue;
        }

        if (!bestAdvancement) {
            bestAdvancement = adv;
            continue;
        }

        const bestLevel = asInt((bestAdvancement as unknown as { level?: unknown }).level) ?? 0;
        const nextLevel = asInt((adv as unknown as { level?: unknown }).level) ?? 0;
        if (nextLevel !== bestLevel) {
            if (nextLevel > bestLevel) {
                bestAdvancement = adv;
            }
            continue;
        }

        const bestVersion = asInt((bestAdvancement as unknown as { version?: unknown }).version) ?? 0;
        const nextVersion = asInt((adv as unknown as { version?: unknown }).version) ?? 0;
        if (nextVersion >= bestVersion) {
            bestAdvancement = adv;
        }
    }

    const draftName = typeof characterState.name === 'string' ? characterState.name : '';
    const raceId = asIntOrNull(characterState.raceId);

    const editionId = asInt(characterState.editionId) ?? EditionId.DND_3_5E;
    const allowVariantClasses = asBool(characterState.allowVariantClasses) ?? false;
    const isGestalt = asBool(characterState.isGestalt) ?? false;
    const ignoreLevelAdjustment = asBool(characterState.ignoreLevelAdjustment) ?? false;
    const maxHpAtFirstLevel = asBool(characterState.maxHpAtFirstLevel) ?? false;

    const abilityScores = asArray(characterState.abilityScores)
        .map((row): { id: number; characterId: number; abilityId: number; value: number } | null => {
            if (!isRecord(row)) {
                return null;
            }
            const abilityId = asInt(row.abilityId);
            const value = asInt(row.value);
            if (abilityId === null || value === null) {
                return null;
            }
            return {
                id: -Math.abs(abilityId),
                characterId: draftCharacterId,
                abilityId,
                value,
            };
        })
        .filter((x): x is { id: number; characterId: number; abilityId: number; value: number } => x !== null);

    const wealth = asArray(characterState.wealth).filter(isRecord).map((w) => ({
        id: asInt(w.id) ?? 0,
        characterId: draftCharacterId,
        currencyId: coerceCurrencyId(asInt(w.currencyId) ?? CurrencyId.Gold),
        quantity: asInt(w.quantity) ?? 0,
        value: asIntOrNull(w.value),
        description: asStringOrNull(w.description),
    }));

    const disallowedSources = asArray(characterState.disallowedSources)
        .map((row): { id: number; characterId: number; sourceBookId: number } | null => {
            if (!isRecord(row)) {
                return null;
            }
            const sourceBookId = asInt(row.sourceBookId);
            if (sourceBookId === null) {
                return null;
            }
            return {
                id: -Math.abs(sourceBookId),
                characterId: draftCharacterId,
                sourceBookId,
            };
        })
        .filter((x): x is { id: number; characterId: number; sourceBookId: number } => x !== null);

    const characterLanguages = asArray(characterState.characterLanguages)
        .map((row): { characterId: number; languageId: number } | null => {
            if (!isRecord(row)) {
                return null;
            }
            const languageId = asInt(row.languageId);
            if (languageId === null) {
                return null;
            }
            return { characterId: draftCharacterId, languageId };
        })
        .filter((x): x is { characterId: number; languageId: number } => x !== null);

    const characterItems = asArray(characterState.characterItems).filter(isRecord).map((item) => ({
        id: asInt(item.id) ?? 0,
        name: typeof item.name === 'string' ? item.name : '',
        quantity: asIntOrNull(item.quantity),
        location: asIntOrNull(item.location),
        characterId: draftCharacterId,
        baseItemId: asInt(item.baseItemId) ?? 0,
    }));

    const attackDefinitions = asArray(characterState.attackDefinitions).filter(isRecord).map((def) => ({
        id: asInt(def.id) ?? 0,
        characterId: draftCharacterId,
        attackSlot: asIntOrNull(def.attackSlot),
        mainHandCharacterItemId: asIntOrNull(def.mainHandCharacterItemId),
        offHandCharacterItemId: asIntOrNull(def.offHandCharacterItemId),
        wieldTwoHanded: asBool(def.wieldTwoHanded) ?? false,
    }));

    const createdAt = new Date();

    const advancements = bestAdvancement
        ? [
            {
                id: asInt(bestAdvancement.advancementId) ?? 0,
                characterId: draftCharacterId,
                level: asInt(bestAdvancement.level) ?? 1,
                version: asInt(bestAdvancement.version) ?? 1,
                classId: asInt(bestAdvancement.classId) ?? 0,
                secondaryClassId: asIntOrNull(bestAdvancement.secondaryClassId),
                hitPoints: asInt(bestAdvancement.hitPoints) ?? 0,
                abilityId: asIntOrNull(bestAdvancement.abilityId),
                notes: asStringOrNull(bestAdvancement.notes),
                createdAt,
                ...mapDraftAdvancementCollections(
                    bestAdvancement,
                    draftCharacterId,
                    asInt(bestAdvancement.advancementId) ?? 0
                ),
            },
        ]
        : [];

    const characterLevel = advancements.length > 0 ? (advancements[0]?.level ?? 0) : 0;

    const result: CharacterWithAllDetailsResponse = {
        id: draftCharacterId,
        userId,
        name: draftName,
        raceId,
        alignmentId: coerceAlignmentId(asIntOrNull(characterState.alignmentId)),
        deityId: asIntOrNull(characterState.deityId),
        xp: 0,
        age: asIntOrNull(characterState.age),
        height: asIntOrNull(characterState.height),
        weight: asIntOrNull(characterState.weight),
        eyes: asStringOrNull(characterState.eyes),
        hair: asStringOrNull(characterState.hair),
        gender: asStringOrNull(characterState.gender),
        notes: asStringOrNull(characterState.notes),
        editionId: editionId,
        abilityScores,
        advancements,
        preparedSpells: [],
        config: {
            characterId: draftCharacterId,
            allowVariantClasses,
            isGestalt,
            ignoreLevelAdjustment,
            maxHpAtFirstLevel,
        },
        wealth,
        disallowedSources,
        characterLanguages,
        bonusSkillRanks: mapDraftBonusSkillRanks(characterState.bonusSkillRanks, draftCharacterId),
        characterItems,
        attackDefinitions,
        companions: mapDraftCompanions(characterState.companions, draftCharacterId),
        selectedForms: mapDraftSelectedForms(characterState.selectedForms, draftCharacterId),
        characterLevel,
        classLevelString: '',
    };

    // Trigger resolution for draft-only characters when loading from draft
    // This ensures resolved character data is available after page refresh/session restore
    // Set advancement state first (if present), then character state, so both are available when resolution runs
    if (draftCharacterId < 0) {
        if (bestAdvancement) {
            characterResolutionProjectionService.scheduleFromAdvancementDraft(
                bestAdvancement as unknown as AdvancementEditState,
                userId
            );
        }
        characterResolutionProjectionService.scheduleFromCharacterDraft(
            draftCharacterId,
            characterState as unknown as CharacterEditState,
            userId
        );
    }

    return result;
}

/**
 * Service for basic character CRUD operations.
 * 
 * Handles character creation, retrieval, updates, and deletion including
 * the complex saveCharacter operation that handles nested data.
 */
export const characterCrudService = {
    async getAllCharacters(userId: number): Promise<GetAllCharactersResponse> {
        const [characters, total] = await Promise.all([
            prisma.character.findMany({
                where: { userId },
                include: {
                    advancements: {
                        include: {
                            class: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                            secondaryClass: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                        },
                        orderBy: { level: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.character.count({
                where: { userId },
            }),
        ]);

        // Calculate class/level string and character level for each character
        const charactersWithClassInfo = characters.map(character => {
            const advancements = character.advancements || [];

            // Calculate character level (max level from advancements)
            const characterLevel = advancements.length > 0
                ? Math.max(...advancements.map(a => a.level))
                : 0;

            // Build class/level string
            const classLevelString = calculateClassLevelString(advancements);

            // Remove nested objects from response (class abbreviations used only for calculation)
            const advancementsWithoutNested = advancements.map(adv => {
                const { class: _class, secondaryClass: _secondaryClass, ...advWithoutNested } = adv;
                return advWithoutNested;
            });

            return {
                ...character,
                alignmentId: coerceAlignmentId(character.alignmentId),
                advancements: advancementsWithoutNested,
                characterLevel,
                classLevelString,
            };
        });

        return {
            total,
            results: charactersWithClassInfo,
        };
    },

    async getAllCharactersAdmin(): Promise<GetAllCharactersAdminResponse> {
        const [characters, total] = await Promise.all([
            prisma.character.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    advancements: {
                        include: {
                            class: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                            secondaryClass: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                        },
                        orderBy: { level: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.character.count(),
        ]);

        // Calculate class/level string and character level for each character
        const charactersWithClassInfo = characters.map(character => {
            const advancements = character.advancements || [];

            // Calculate character level (max level from advancements)
            const characterLevel = advancements.length > 0
                ? Math.max(...advancements.map(a => a.level))
                : 0;

            // Build class/level string
            const classLevelString = calculateClassLevelString(advancements);

            // Exclude advancements from response (not in schema)
            const { advancements: _advancements, ...characterBase } = character;

            return {
                ...characterBase,
                alignmentId: coerceAlignmentId(characterBase.alignmentId),
                characterLevel,
                classLevelString,
            };
        });

        return {
            total,
            results: charactersWithClassInfo,
        };
    },

    async getCharacterById(query: CharacterIdParamRequest): Promise<Character | null> {
        const character = await prisma.character.findUnique({
            where: { id: query.id },
            include: {
                race: {
                    select: {
                        name: true,
                    },
                },
                deity: {
                    select: {
                        id: true,
                        name: true,
                        alignmentId: true,
                    },
                },
            },
        });

        return character as Character;
    },

    async getCharacterWithAllDetails(query: CharacterIdParamRequest, userId?: number): Promise<CharacterWithAllDetailsResponse | null> {
        if (query.id < 0) {
            if (typeof userId !== 'number') {
                throw new Error('User not authenticated');
            }
            return await getDraftCharacterWithAllDetails({ draftCharacterId: query.id, userId });
        }

        const character = await prisma.character.findUnique({
            where: { id: query.id },
            include: {
                advancements: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                abbreviation: true,
                            },
                        },
                        secondaryClass: {
                            select: {
                                id: true,
                                abbreviation: true,
                            },
                        },
                        skills: true,
                        feats: true,
                        spellsKnown: true,
                        featureChoices: true,
                    },
                    orderBy: { level: 'asc' },
                },
                abilityScores: true,
                config: true,
                wealth: true,
                preparedSpells: true,
                disallowedSources: true,
                characterItems: true,
                attackDefinitions: true,
                characterLanguages: true,
                bonusSkillRanks: true,
                companions: {
                    include: {
                        tricks: true,
                        skills: true,
                        feats: true,
                    },
                },
                selectedForms: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!character) {
            return null;
        }

        const advancements = character.advancements || [];

        // Calculate character level (max level from advancements)
        const characterLevel = advancements.length > 0
            ? Math.max(...advancements.map(a => a.level))
            : 0;

        // Build class/level string
        const classLevelString = calculateClassLevelString(advancements);

        // Remove nested objects from response (class abbreviations used only for calculation)
        const advancementsWithoutNested = advancements.map(adv => {
            const { class: _class, secondaryClass: _secondaryClass, ...advWithoutNested } = adv;
            return advWithoutNested;
        });

        // Cast preparedSpells slotType to match schema type
        const preparedSpells = character.preparedSpells.map(prep => ({
            ...prep,
            slotType: prep.slotType as SpellSlotType,
        }));

        const response: CharacterWithAllDetailsResponse = {
            ...character,
            alignmentId: coerceAlignmentId(character.alignmentId),
            wealth: character.wealth.map((w) => ({ ...w, currencyId: coerceCurrencyId(w.currencyId) })),
            advancements: advancementsWithoutNested,
            preparedSpells,
            companions: mapDraftCompanions(character.companions, character.id),
            selectedForms: mapDraftSelectedForms(character.selectedForms, character.id),
            characterLevel,
            classLevelString,
        };

        if (typeof userId === 'number') {
            return overlayLockedDraftsOnCharacter(response, userId);
        }

        return response;
    },

    async createCharacter(data: CreateCharacterRequest): Promise<CreateResponse> {
        const result = await prisma.character.create({
            data: {
                ...data,
                editionId: data.editionId ?? EditionId.DND_3_5E, // Default to D&D 3.5 Edition if not provided
                config: { create: {} },
            },
        });

        return { id: result.id.toString(), message: 'Character created successfully' };
    },

    async saveCharacter(characterId: number | null, data: SaveCharacterRequest): Promise<CreateResponse | UpdateResponse> {
        // Extract nested data
        const { abilityScores, advancement, equipment, attackDefinitions, characterLanguages, bonusSkillRanks, ...characterData } = data;

        let finalCharacterId = characterId;

        const result = await prisma.$transaction(async (tx) => {
            // Create or update character
            if (!finalCharacterId) {
                // Create new character - ensure required fields are present
                if (!characterData.userId || !characterData.name || !characterData.raceId) {
                    throw new Error('Missing required fields: userId, name, and raceId are required for character creation');
                }
                const character = await tx.character.create({
                    data: {
                        userId: characterData.userId,
                        name: characterData.name,
                        raceId: characterData.raceId,
                        alignmentId: characterData.alignmentId ?? null,
                        deityId: characterData.deityId ?? null,
                        age: characterData.age ?? null,
                        height: characterData.height ?? null,
                        weight: characterData.weight ?? null,
                        eyes: characterData.eyes ?? null,
                        hair: characterData.hair ?? null,
                        gender: characterData.gender ?? null,
                        notes: characterData.notes ?? null,
                        editionId: characterData.editionId != null ? characterData.editionId : EditionId.DND_3_5E, // Default to D&D 3.5 Edition if not provided or null
                        config: { create: {} },
                    },
                });
                finalCharacterId = character.id;
            } else {
                // Update existing character - exclude userId as it shouldn't be updated
                const { userId: _userId, ...updateData } = characterData;
                await tx.character.update({
                    where: { id: finalCharacterId },
                    data: updateData as typeof updateData & { editionId?: number },
                });
            }

            if (finalCharacterId === null) {
                throw new Error('Character ID is required after create or update');
            }
            const persistedCharacterId = finalCharacterId;

            // Handle ability scores if provided
            if (abilityScores !== undefined) {
                // Get existing ability scores
                const existingScores = await tx.characterAbilityScore.findMany({
                    where: { characterId: persistedCharacterId },
                });

                const existingMap = new Map(existingScores.map(score => [score.abilityId, score]));
                const requestedAbilityIds = new Set(abilityScores.map(score => score.abilityId));

                // Create or update ability scores
                for (const abilityScore of abilityScores) {
                    const existing = existingMap.get(abilityScore.abilityId);
                    if (existing) {
                        if (existing.value !== abilityScore.value) {
                            await tx.characterAbilityScore.update({
                                where: { id: existing.id },
                                data: { value: abilityScore.value },
                            });
                        }
                    } else {
                        await tx.characterAbilityScore.create({
                            data: {
                                characterId: persistedCharacterId,
                                abilityId: abilityScore.abilityId,
                                value: abilityScore.value,
                            },
                        });
                    }
                }

                // Delete scores that are no longer in the request
                const toDelete = existingScores.filter(score => !requestedAbilityIds.has(score.abilityId));
                if (toDelete.length > 0) {
                    await tx.characterAbilityScore.deleteMany({
                        where: {
                            id: { in: toDelete.map(score => score.id) },
                        },
                    });
                }
            }

            // Handle advancement if provided
            if (advancement) {
                // Check if advancement exists for this character and level
                const existingAdvancement = await tx.characterAdvancement.findFirst({
                    where: {
                        characterId: persistedCharacterId,
                        level: advancement.level,
                    },
                });

                const { skills, feats, featureChoices, ...advancementData } = advancement;

                if (existingAdvancement) {
                    // Update existing advancement
                    await tx.characterAdvancement.update({
                        where: { id: existingAdvancement.id },
                        data: {
                            ...advancementData,
                            characterId: persistedCharacterId,
                        },
                    });

                    // Handle skills: delete existing and create new if provided
                    if (skills !== undefined) {
                        await tx.advancementSkill.deleteMany({
                            where: { advancementId: existingAdvancement.id },
                        });
                        if (skills.length > 0) {
                            await tx.advancementSkill.createMany({
                                data: skills.map(skill => ({
                                    ...skill,
                                    advancementId: existingAdvancement.id,
                                })),
                            });
                        }
                    }

                    // Handle feats: delete existing and create new if provided
                    if (feats !== undefined) {
                        await tx.advancementFeat.deleteMany({
                            where: { advancementId: existingAdvancement.id },
                        });
                        if (feats.length > 0) {
                            await tx.advancementFeat.createMany({
                                data: feats.map(feat => ({
                                    ...feat,
                                    advancementId: existingAdvancement.id,
                                })),
                            });
                        }
                    }

                    // Handle featureChoices: delete existing and create new if provided
                    if (featureChoices !== undefined) {
                        await tx.characterFeatureChoice.deleteMany({
                            where: { advancementId: existingAdvancement.id },
                        });
                        if (featureChoices.length > 0) {
                            await tx.characterFeatureChoice.createMany({
                                data: featureChoices.map(choice => ({
                                    ...choice,
                                    characterId: persistedCharacterId,
                                    advancementId: existingAdvancement.id,
                                })),
                            });
                        }
                    }
                } else {
                    // Create new advancement
                    // Note: When using nested creates, Prisma automatically sets advancementId
                    // so we should NOT include it in the create data
                    const newAdvancement = await tx.characterAdvancement.create({
                        data: {
                            ...advancementData,
                            characterId: persistedCharacterId,
                            version: 1,
                            skills: skills ? {
                                create: skills
                            } : undefined,
                            feats: feats ? {
                                create: feats
                            } : undefined,
                            featureChoices: featureChoices ? {
                                create: featureChoices.map(choice => {
                                    // advancementId is not in the choice type - Prisma sets it automatically via the relationship
                                    return {
                                        ...choice,
                                        characterId: persistedCharacterId,
                                    };
                                })
                            } : undefined,
                        },
                    });

                }
            }

            // Handle equipment if provided
            // We need to track item ID mappings for attack definitions
            const itemIdMap = new Map<number, number>(); // old item ID -> new item ID

            if (equipment !== undefined) {
                // Get existing equipment
                const existingEquipment = await tx.characterItem.findMany({
                    where: { characterId: persistedCharacterId },
                });

                // Create multiple maps for flexible matching:
                // 1. Exact match: baseItemId|location|name -> old item ID
                const exactMatchMap = new Map<string, number>();
                // 2. Location match: baseItemId|location -> array of old item IDs
                const locationMatchMap = new Map<string, number[]>();
                // 3. BaseItemId match: baseItemId -> array of old item IDs
                const baseItemMatchMap = new Map<number, number[]>();

                for (const existingItem of existingEquipment) {
                    const exactKey = `${existingItem.baseItemId}|${existingItem.location ?? 'null'}|${existingItem.name}`;
                    exactMatchMap.set(exactKey, existingItem.id);

                    const locationKey = `${existingItem.baseItemId}|${existingItem.location ?? 'null'}`;
                    if (!locationMatchMap.has(locationKey)) {
                        locationMatchMap.set(locationKey, []);
                    }
                    locationMatchMap.get(locationKey)!.push(existingItem.id);

                    if (!baseItemMatchMap.has(existingItem.baseItemId)) {
                        baseItemMatchMap.set(existingItem.baseItemId, []);
                    }
                    baseItemMatchMap.get(existingItem.baseItemId)!.push(existingItem.id);
                }

                // Track which old IDs have been matched to avoid duplicate mappings
                const matchedOldIds = new Set<number>();

                // Delete all existing equipment
                if (existingEquipment.length > 0) {
                    await tx.characterItem.deleteMany({
                        where: { characterId: persistedCharacterId },
                    });
                }

                // Create new equipment items and build ID mapping
                if (equipment.length > 0) {
                    const createdItems = await Promise.all(
                        equipment.map(async (item) => {
                            const created = await tx.characterItem.create({
                                data: {
                                    characterId: persistedCharacterId,
                                    name: item.name,
                                    quantity: item.quantity ?? null,
                                    location: item.location ?? null,
                                    baseItemId: item.baseItemId,
                                },
                            });

                            // Try multiple matching strategies in order of preference
                            let oldId: number | undefined;

                            // Strategy 1: Exact match (baseItemId|location|name)
                            const exactKey = `${item.baseItemId}|${item.location ?? 'null'}|${item.name}`;
                            const exactMatch = exactMatchMap.get(exactKey);
                            if (exactMatch && !matchedOldIds.has(exactMatch)) {
                                oldId = exactMatch;
                            } else {
                                // Strategy 2: Location match (baseItemId|location) - only if exactly one match
                                const locationKey = `${item.baseItemId}|${item.location ?? 'null'}`;
                                const locationMatches = locationMatchMap.get(locationKey);
                                if (locationMatches && locationMatches.length === 1 && !matchedOldIds.has(locationMatches[0])) {
                                    oldId = locationMatches[0];
                                } else {
                                    // Strategy 3: BaseItemId match - only if exactly one match
                                    const baseItemMatches = baseItemMatchMap.get(item.baseItemId);
                                    if (baseItemMatches && baseItemMatches.length === 1 && !matchedOldIds.has(baseItemMatches[0])) {
                                        oldId = baseItemMatches[0];
                                    }
                                }
                            }

                            if (oldId) {
                                itemIdMap.set(oldId, created.id);
                                matchedOldIds.add(oldId);
                            }

                            return created;
                        })
                    );
                }
            }

            // Handle attack definitions if provided
            if (attackDefinitions !== undefined) {
                // Get existing attack definitions
                const existingAttackDefinitions = await tx.characterAttackDefinition.findMany({
                    where: { characterId: persistedCharacterId },
                });

                // Delete all existing attack definitions
                if (existingAttackDefinitions.length > 0) {
                    await tx.characterAttackDefinition.deleteMany({
                        where: { characterId: persistedCharacterId },
                    });
                }

                // Create new attack definitions with mapped item IDs
                if (attackDefinitions.length > 0) {
                    // Get all current character items to validate references
                    const currentItems = await tx.characterItem.findMany({
                        where: { characterId: persistedCharacterId },
                    });
                    const validItemIds = new Set(currentItems.map(item => item.id));

                    await tx.characterAttackDefinition.createMany({
                        data: attackDefinitions.map(def => {
                            // Map old item IDs to new ones if equipment was recreated
                            let mainHandItemId = def.mainHandCharacterItemId
                                ? (itemIdMap.get(def.mainHandCharacterItemId) ?? def.mainHandCharacterItemId)
                                : null;
                            let offHandItemId = def.offHandCharacterItemId
                                ? (itemIdMap.get(def.offHandCharacterItemId) ?? def.offHandCharacterItemId)
                                : null;

                            // Validate that the item IDs exist (after mapping)
                            if (mainHandItemId && !validItemIds.has(mainHandItemId)) {
                                mainHandItemId = null; // Clear invalid reference
                            }
                            if (offHandItemId && !validItemIds.has(offHandItemId)) {
                                offHandItemId = null; // Clear invalid reference
                            }

                            return {
                                characterId: persistedCharacterId,
                                attackSlot: def.attackSlot ?? null,
                                mainHandCharacterItemId: mainHandItemId,
                                offHandCharacterItemId: offHandItemId,
                                wieldTwoHanded: def.wieldTwoHanded ?? false,
                            };
                        }),
                    });
                }
            }

            // Handle character languages if provided
            if (characterLanguages !== undefined) {
                // Delete existing languages
                await tx.characterLanguageMap.deleteMany({
                    where: { characterId: persistedCharacterId },
                });
                // Create new languages
                if (characterLanguages.length > 0) {
                    await tx.characterLanguageMap.createMany({
                        data: characterLanguages.map(lang => ({
                            characterId: persistedCharacterId,
                            languageId: lang.languageId,
                        })),
                    });
                }
            }

            if (bonusSkillRanks !== undefined) {
                await tx.characterBonusSkillRank.deleteMany({
                    where: { characterId: persistedCharacterId },
                });
                if (bonusSkillRanks.length > 0) {
                    await tx.characterBonusSkillRank.createMany({
                        data: bonusSkillRanks.map((row) => ({
                            characterId: persistedCharacterId,
                            skillId: row.skillId,
                            skillSubId: row.skillSubId ?? null,
                            customSubtype: row.customSubtype ?? null,
                            ranks: row.ranks,
                            description: row.description,
                        })),
                    });
                }
            }

            if (characterId) {
                return { message: 'Character saved successfully' };
            } else {
                return { id: persistedCharacterId.toString(), message: 'Character created successfully' };
            }
        });

        if (finalCharacterId !== null) {
            await companionSyncService.syncFromFeatureChoices(finalCharacterId);
        }
        return result;
    },

    async deleteCharacter(query: CharacterIdParamRequest): Promise<UpdateResponse> {
        /**
         * Delete a character and all dependent rows.
         *
         * Some character-owned tables do not use `onDelete: Cascade` in the DB schema
         * (e.g. `CharacterItem`, `CharacterAbilityScore`, `CharacterAdvancement`, etc),
         * so we must delete dependents explicitly before deleting the `Character` row.
         */
        await prisma.$transaction(async (tx) => {
            // Advancement children (must be deleted before advancements)
            await tx.characterFeatureChoice.deleteMany({
                where: { advancement: { characterId: query.id } },
            });
            await tx.advancementSkill.deleteMany({
                where: { advancement: { characterId: query.id } },
            });
            await tx.advancementFeat.deleteMany({
                where: { advancement: { characterId: query.id } },
            });
            await tx.advancementSpell.deleteMany({
                where: { advancement: { characterId: query.id } },
            });

            // Character-owned collections
            await tx.characterSpellPreparation.deleteMany({ where: { characterId: query.id } });
            await tx.characterFeatureUses.deleteMany({ where: { characterId: query.id } });
            await tx.characterCompanion.deleteMany({ where: { characterId: query.id } });
            await tx.characterDisallowedSource.deleteMany({ where: { characterId: query.id } });
            await tx.characterLanguageMap.deleteMany({ where: { characterId: query.id } });
            await tx.characterWealth.deleteMany({ where: { characterId: query.id } });

            // Items must be deleted after item-properties and attack definitions
            await tx.characterItemProperty.deleteMany({
                where: { characterItem: { characterId: query.id } },
            });
            await tx.characterAttackDefinition.deleteMany({ where: { characterId: query.id } });
            await tx.characterItem.deleteMany({ where: { characterId: query.id } });

            // Core character sub-tables
            await tx.characterAbilityScore.deleteMany({ where: { characterId: query.id } });
            await tx.characterConfig.deleteMany({ where: { characterId: query.id } });

            // Advancements (after children)
            await tx.characterAdvancement.deleteMany({ where: { characterId: query.id } });

            // Finally, the character row
            await tx.character.delete({ where: { id: query.id } });
        });

        return { message: 'Character deleted successfully' };
    },
};
