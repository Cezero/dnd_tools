import { BadRequestError } from '@/errors/BadRequestError';
import { prisma } from '@/lib/prisma';
import { transformFormulaParamsFromDatabase } from '@/utils/formulaParamTransformers';
import type {
    CharacterSelectedFormIdParamRequest,
    CharacterWithAllDetailsResponse,
    CompanionComputedStatBlock,
    CreateCharacterSelectedFormRequest,
    CreateResponse,
    EligibleForm,
    FeatureEntity,
    GetAllCharacterSelectedFormsResponse,
    GetEligibleFormsResponse,
    GetMonsterResponse,
    GetResolvedSelectedFormsResponse,
    ResolvedSelectedForm,
    ResolvedSelectedFormDraft,
    UpdateCharacterSelectedFormRequest,
    UpdateResponse,
    WildShapeNotes,
} from '@shared/schema';
import {
    AbilityId,
    ELEMENTAL_WILD_SHAPE_FEATURE_SLUG,
    EntityAppliesToType,
    EntityType,
    GetAbilityModifier,
    MonsterSpecialAbilityTypeId,
    MonsterTypeId,
    SavingThrowId,
    SIZE_MAP,
    SizeId,
    WILD_SHAPE_DEFAULT_SIZE_IDS,
    WILD_SHAPE_FEATURE_SLUG,
} from '@shared/static-data';

import { classLevelsFromAdvancements } from '../companion/companionAdvancementService';
import { collectUnlockedFormulaValues, evaluateEntityFormula } from '../companion/companionFormula';
import { monsterService } from '../monster/monsterService';

const SYNTHETIC_ID_BASE = 2_000_000;
const VALID_MONSTER_TYPE_IDS = new Set<number>(Object.values(MonsterTypeId));

interface EligibilityRules {
    typeIds: Set<number>;
    sizeIds: Set<number>;
    maxHitDice: number;
    isElementalForm: boolean;
    classLevel: number;
}

/**
 * Selected wild-shape / transformation forms for a character.
 * Eligibility is derived from the feature's SizeCategory and CreatureType entities.
 */
export const selectedFormService = {
    async getSelectedForms(characterId: number): Promise<GetAllCharacterSelectedFormsResponse> {
        const [forms, total] = await Promise.all([
            prisma.characterSelectedForm.findMany({
                where: { characterId },
                orderBy: { sortOrder: 'asc' },
            }),
            prisma.characterSelectedForm.count({ where: { characterId } }),
        ]);

        return { total, results: forms };
    },

    async createSelectedForm(data: CreateCharacterSelectedFormRequest): Promise<CreateResponse> {
        const eligibility = await this.buildEligibility(data.characterId, data.featureId);
        await this.assertMonsterEligible(data.monsterId, eligibility);

        const created = await prisma.characterSelectedForm.create({
            data: {
                characterId: data.characterId,
                featureId: data.featureId,
                monsterId: data.monsterId,
                sortOrder: data.sortOrder ?? 0,
            },
        });

        return { id: created.id.toString(), message: 'Selected form created successfully' };
    },

    async updateSelectedForm(
        data: UpdateCharacterSelectedFormRequest,
        query: CharacterSelectedFormIdParamRequest
    ): Promise<UpdateResponse> {
        const existing = await prisma.characterSelectedForm.findUnique({
            where: { id: query.id },
        });
        if (!existing) {
            throw new BadRequestError('Selected form not found');
        }

        const featureId = data.featureId ?? existing.featureId;
        const monsterId = data.monsterId ?? existing.monsterId;
        if (data.featureId !== undefined || data.monsterId !== undefined) {
            const eligibility = await this.buildEligibility(existing.characterId, featureId);
            await this.assertMonsterEligible(monsterId, eligibility);
        }

        await prisma.characterSelectedForm.update({
            where: { id: query.id },
            data: {
                featureId: data.featureId,
                monsterId: data.monsterId,
                sortOrder: data.sortOrder,
            },
        });

        return { message: 'Selected form updated successfully' };
    },

    async deleteSelectedForm(query: CharacterSelectedFormIdParamRequest): Promise<UpdateResponse> {
        await prisma.characterSelectedForm.delete({
            where: { id: query.id },
        });
        return { message: 'Selected form deleted successfully' };
    },

    /**
     * Lightweight picker rows for monsters the character can assume with this feature.
     */
    async getEligibleForms(characterId: number, featureId: number): Promise<GetEligibleFormsResponse> {
        const eligibility = await this.buildEligibility(characterId, featureId);
        const explicit = await prisma.transformationFormEligibility.findMany({
            where: { featureId },
            select: { monsterId: true, minLevel: true },
        });

        const whereClause: {
            isVisible: boolean;
            id?: { in: number[] };
            types?: { some: { typeId: { in: number[] } } };
            sizeId?: { in: number[] };
            hitDiceQty?: { lte: number };
        } = {
            isVisible: true,
            types: { some: { typeId: { in: [...eligibility.typeIds] } } },
            sizeId: { in: [...eligibility.sizeIds] },
            hitDiceQty: { lte: eligibility.maxHitDice },
        };

        if (explicit.length > 0) {
            const allowedIds = explicit
                .filter((row) => row.minLevel === null || row.minLevel <= eligibility.classLevel)
                .map((row) => row.monsterId);
            whereClause.id = { in: allowedIds };
        }

        const monsters = await prisma.monster.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                sizeId: true,
                hitDiceQty: true,
                hitDiceType: true,
                types: { select: { typeId: true } },
            },
            orderBy: { name: 'asc' },
        });

        const results: EligibleForm[] = monsters.map((monster) => ({
            monsterId: monster.id,
            name: monster.name,
            sizeId: monster.sizeId,
            typeIds: monster.types.map((t) => t.typeId),
            hitDiceQty: monster.hitDiceQty,
            hitDiceType: monster.hitDiceType,
        }));

        return { total: results.length, results };
    },

    async getResolvedSelectedForms(characterId: number): Promise<GetResolvedSelectedFormsResponse> {
        const forms = await prisma.characterSelectedForm.findMany({
            where: { characterId },
            orderBy: { sortOrder: 'asc' },
        });

        const characterStats = await this.getCharacterFormBase(characterId);
        const results: ResolvedSelectedForm[] = [];

        for (const form of forms) {
            const eligibility = await this.buildEligibility(characterId, form.featureId);
            const monster = await monsterService.getMonsterById({ id: form.monsterId });
            if (!monster) {
                continue;
            }

            const computedStatBlock = this.applyAlternateForm({
                monsterId: form.monsterId,
                monster,
                character: characterStats,
                isElementalForm: eligibility.isElementalForm,
            });

            const notes: WildShapeNotes = {
                gearMelded: true,
                hpUnchangedByConstitution: true,
                spellcastingSpeechRequired: true,
                spellcastingHandsRequired: true,
                isElementalForm: eligibility.isElementalForm,
            };

            results.push({
                id: form.id,
                characterId: form.characterId,
                featureId: form.featureId,
                monsterId: form.monsterId,
                sortOrder: form.sortOrder,
                monsterName: monster.name,
                computedStatBlock,
                notes,
            });
        }

        return { total: results.length, results };
    },

    async buildEligibility(
        characterId: number,
        featureId: number,
        snapshotAdvancements?: Array<{ classId: number; secondaryClassId: number | null }>
    ): Promise<EligibilityRules> {
        const feature = await prisma.feature.findUnique({
            where: { id: featureId },
            include: {
                classes: true,
                entities: { include: { formulaParams: true } },
            },
        });
        if (!feature) {
            throw new BadRequestError('Feature not found');
        }

        const advancements = snapshotAdvancements ?? await prisma.characterAdvancement.findMany({
            where: { characterId },
            select: { classId: true, secondaryClassId: true },
        });
        const classLevels = classLevelsFromAdvancements(advancements);

        let classLevel = 0;
        for (const classMap of feature.classes) {
            classLevel = Math.max(classLevel, classLevels.get(classMap.classId) ?? 0);
        }
        if (classLevel <= 0) {
            classLevel = advancements.length;
        }

        const typeIds = new Set<number>([MonsterTypeId.Animal]);
        const sizeIds = new Set<number>(WILD_SHAPE_DEFAULT_SIZE_IDS);
        const isElementalForm = feature.slug === ELEMENTAL_WILD_SHAPE_FEATURE_SLUG
            || feature.slug.includes('elementalwildshape');

        for (const entity of feature.entities) {
            const formulaParams = entity.formulaParams
                ? transformFormulaParamsFromDatabase(entity.formulaParams)
                : null;
            const mappedEntity: FeatureEntity = {
                ...entity,
                type: entity.type as FeatureEntity['type'],
                appliesTo: entity.appliesTo as FeatureEntity['appliesTo'],
                bonusType: entity.bonusType as FeatureEntity['bonusType'],
                formulaParams,
            };

            if (entity.appliesTo === EntityAppliesToType.CreatureType) {
                if (entity.appliesToId && VALID_MONSTER_TYPE_IDS.has(entity.appliesToId)) {
                    typeIds.add(entity.appliesToId);
                }
                if (formulaParams) {
                    for (const value of collectUnlockedFormulaValues(formulaParams, classLevel)) {
                        if (VALID_MONSTER_TYPE_IDS.has(value)) {
                            typeIds.add(value);
                        } else {
                            typeIds.add(MonsterTypeId.Plant);
                        }
                    }
                }
            }

            if (entity.appliesTo === EntityAppliesToType.SizeCategory) {
                if (entity.appliesToId && SIZE_MAP[entity.appliesToId]) {
                    const sizeValue = evaluateEntityFormula(mappedEntity, classLevel, feature.level);
                    if (sizeValue === null || sizeValue > 0) {
                        sizeIds.add(entity.appliesToId);
                    }
                }
                if (formulaParams) {
                    for (const value of collectUnlockedFormulaValues(formulaParams, classLevel)) {
                        if (SIZE_MAP[value]) {
                            sizeIds.add(value);
                        }
                    }
                }
            }
        }

        if (isElementalForm) {
            typeIds.add(MonsterTypeId.Elemental);
            sizeIds.add(SizeId.Small);
            sizeIds.add(SizeId.Medium);
            sizeIds.add(SizeId.Large);
        }

        if (feature.slug === WILD_SHAPE_FEATURE_SLUG && classLevel < feature.level) {
            typeIds.clear();
            sizeIds.clear();
        }

        return {
            typeIds,
            sizeIds,
            maxHitDice: classLevel,
            isElementalForm,
            classLevel,
        };
    },

    async assertMonsterEligible(monsterId: number, eligibility: EligibilityRules): Promise<void> {
        const monster = await prisma.monster.findUnique({
            where: { id: monsterId },
            select: {
                sizeId: true,
                hitDiceQty: true,
                types: { select: { typeId: true } },
            },
        });
        if (!monster) {
            throw new BadRequestError('Monster not found');
        }
        const typeOk = monster.types.some((t) => eligibility.typeIds.has(t.typeId));
        const sizeOk = monster.sizeId !== null && eligibility.sizeIds.has(monster.sizeId);
        const hdOk = (monster.hitDiceQty ?? 0) <= eligibility.maxHitDice;
        if (!typeOk || !sizeOk || !hdOk) {
            throw new BadRequestError('This form is not eligible for the selected feature');
        }
    },

    async getCharacterFormBase(characterId: number): Promise<{
        hitDice: number;
        hitPoints: number;
        baseAttack: number;
        fortBase: number;
        refBase: number;
        willBase: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
        skills: CompanionComputedStatBlock['skills'];
        feats: CompanionComputedStatBlock['feats'];
    }> {
        const character = await prisma.character.findUnique({
            where: { id: characterId },
            include: {
                abilityScores: true,
                advancements: {
                    include: { skills: true, feats: true },
                    orderBy: { level: 'asc' },
                },
            },
        });
        if (!character) {
            throw new BadRequestError('Character not found');
        }

        const hitDice = character.advancements.length;
        const hitPoints = character.advancements.reduce((sum, adv) => sum + adv.hitPoints, 0);
        const classLevels = classLevelsFromAdvancements(character.advancements);
        const combat = await this.getClassCombatTotals(classLevels);

        const score = (abilityId: number, fallback: number): number =>
            character.abilityScores.find((row) => row.abilityId === abilityId)?.value ?? fallback;

        const skillMap = new Map<string, { skillId: number; skillSubId: number | null; ranks: number }>();
        for (const adv of character.advancements) {
            for (const skill of adv.skills) {
                const key = `${skill.skillId}:${skill.skillSubId ?? 0}`;
                const current = skillMap.get(key);
                if (current) {
                    current.ranks += skill.pointsSpent;
                } else {
                    skillMap.set(key, {
                        skillId: skill.skillId,
                        skillSubId: skill.skillSubId,
                        ranks: skill.pointsSpent,
                    });
                }
            }
        }

        const feats: CompanionComputedStatBlock['feats'] = [];
        const seenFeats = new Set<string>();
        for (const adv of character.advancements) {
            for (const feat of adv.feats) {
                const key = `${feat.featId}:${feat.featSubId ?? 0}`;
                if (seenFeats.has(key)) {
                    continue;
                }
                seenFeats.add(key);
                feats.push({
                    id: SYNTHETIC_ID_BASE + feats.length,
                    featId: feat.featId,
                    notes: null,
                });
            }
        }

        return {
            hitDice,
            hitPoints,
            baseAttack: combat.bab,
            fortBase: combat.fort,
            refBase: combat.ref,
            willBase: combat.will,
            intelligence: score(AbilityId.Intelligence, 10),
            wisdom: score(AbilityId.Wisdom, 10),
            charisma: score(AbilityId.Charisma, 10),
            skills: [...skillMap.values()].map((row, index) => ({
                id: SYNTHETIC_ID_BASE + index,
                skillId: row.skillId,
                skillSubId: row.skillSubId,
                ranks: row.ranks,
                notes: null,
            })),
            feats,
        };
    },

    /**
     * Builds Alternate Form sheets from the character snapshot (draft or persisted).
     */
    async resolveSelectedFormsFromSnapshot(
        character: CharacterWithAllDetailsResponse
    ): Promise<ResolvedSelectedFormDraft[]> {
        const forms = character.selectedForms ?? [];
        if (forms.length === 0) {
            return [];
        }

        const snapshotAdvancements = (character.advancements ?? []).map((adv) => ({
            classId: adv.classId,
            secondaryClassId: adv.secondaryClassId ?? null,
        }));
        const characterStats = await this.getCharacterFormBaseFromSnapshot(character);
        const results: ResolvedSelectedFormDraft[] = [];

        for (const form of forms) {
            let eligibility: EligibilityRules;
            try {
                eligibility = await this.buildEligibility(character.id, form.featureId, snapshotAdvancements);
            } catch (error) {
                console.error(`Failed to resolve selected form ${form.id} for character ${character.id}:`, error);
                continue;
            }
            const monster = await monsterService.getMonsterById({ id: form.monsterId });
            if (!monster) {
                continue;
            }

            results.push({
                id: form.id,
                characterId: form.characterId !== 0 ? form.characterId : character.id,
                featureId: form.featureId,
                monsterId: form.monsterId,
                sortOrder: form.sortOrder ?? 0,
                monsterName: monster.name,
                computedStatBlock: this.applyAlternateForm({
                    monsterId: form.monsterId,
                    monster,
                    character: characterStats,
                    isElementalForm: eligibility.isElementalForm,
                }),
                notes: {
                    gearMelded: true,
                    hpUnchangedByConstitution: true,
                    spellcastingSpeechRequired: true,
                    spellcastingHandsRequired: true,
                    isElementalForm: eligibility.isElementalForm,
                },
            });
        }

        return results;
    },

    /**
     * Derives wild-shape chassis stats from the overlaid character snapshot.
     */
    async getCharacterFormBaseFromSnapshot(character: CharacterWithAllDetailsResponse): Promise<{
        hitDice: number;
        hitPoints: number;
        baseAttack: number;
        fortBase: number;
        refBase: number;
        willBase: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
        skills: CompanionComputedStatBlock['skills'];
        feats: CompanionComputedStatBlock['feats'];
    }> {
        const advancements = character.advancements ?? [];
        const hitDice = advancements.length;
        const hitPoints = advancements.reduce((sum, adv) => sum + (adv.hitPoints ?? 0), 0);
        const classLevels = classLevelsFromAdvancements(
            advancements.map((adv) => ({
                classId: adv.classId,
                secondaryClassId: adv.secondaryClassId ?? null,
            }))
        );
        const combat = await this.getClassCombatTotals(classLevels);

        const score = (abilityId: number, fallback: number): number =>
            (character.abilityScores ?? []).find((row) => row.abilityId === abilityId)?.value ?? fallback;

        const skillMap = new Map<string, { skillId: number; skillSubId: number | null; ranks: number }>();
        for (const adv of advancements) {
            for (const skill of adv.skills ?? []) {
                const key = `${skill.skillId}:${skill.skillSubId ?? 0}`;
                const current = skillMap.get(key);
                if (current) {
                    current.ranks += skill.pointsSpent;
                } else {
                    skillMap.set(key, {
                        skillId: skill.skillId,
                        skillSubId: skill.skillSubId ?? null,
                        ranks: skill.pointsSpent,
                    });
                }
            }
        }

        const feats: CompanionComputedStatBlock['feats'] = [];
        const seenFeats = new Set<string>();
        for (const adv of advancements) {
            for (const feat of adv.feats ?? []) {
                const key = `${feat.featId}:${feat.featSubId ?? 0}`;
                if (seenFeats.has(key)) {
                    continue;
                }
                seenFeats.add(key);
                feats.push({
                    id: SYNTHETIC_ID_BASE + feats.length,
                    featId: feat.featId,
                    notes: null,
                });
            }
        }

        return {
            hitDice,
            hitPoints,
            baseAttack: combat.bab,
            fortBase: combat.fort,
            refBase: combat.ref,
            willBase: combat.will,
            intelligence: score(AbilityId.Intelligence, 10),
            wisdom: score(AbilityId.Wisdom, 10),
            charisma: score(AbilityId.Charisma, 10),
            skills: [...skillMap.values()].map((row, index) => ({
                id: SYNTHETIC_ID_BASE + index,
                skillId: row.skillId,
                skillSubId: row.skillSubId,
                ranks: row.ranks,
                notes: null,
            })),
            feats,
        };
    },

    async getClassCombatTotals(classLevels: Map<number, number>): Promise<{
        bab: number;
        fort: number;
        ref: number;
        will: number;
    }> {
        const classIds = [...classLevels.keys()];
        if (classIds.length === 0) {
            return { bab: 0, fort: 0, ref: 0, will: 0 };
        }

        const features = await prisma.feature.findMany({
            where: {
                classes: { some: { classId: { in: classIds } } },
                entities: {
                    some: {
                        type: EntityType.Base,
                        appliesTo: {
                            in: [EntityAppliesToType.BaseAttackBonus, EntityAppliesToType.SavingThrow],
                        },
                    },
                },
            },
            include: {
                classes: true,
                entities: { include: { formulaParams: true } },
            },
        });

        let bab = 0;
        let fort = 0;
        let ref = 0;
        let will = 0;

        for (const feature of features) {
            for (const classMap of feature.classes) {
                const classLevel = classLevels.get(classMap.classId);
                if (!classLevel) {
                    continue;
                }
                for (const entity of feature.entities) {
                    const mapped: FeatureEntity = {
                        ...entity,
                        type: entity.type as FeatureEntity['type'],
                        appliesTo: entity.appliesTo as FeatureEntity['appliesTo'],
                        bonusType: entity.bonusType as FeatureEntity['bonusType'],
                        formulaParams: entity.formulaParams
                            ? transformFormulaParamsFromDatabase(entity.formulaParams)
                            : null,
                    };
                    if (
                        mapped.type !== EntityType.Base
                        || (
                            entity.appliesTo !== EntityAppliesToType.BaseAttackBonus
                            && entity.appliesTo !== EntityAppliesToType.SavingThrow
                        )
                    ) {
                        continue;
                    }
                    const value = evaluateEntityFormula(mapped, classLevel, feature.level) ?? 0;
                    if (entity.appliesTo === EntityAppliesToType.BaseAttackBonus) {
                        bab += value;
                    } else if (entity.appliesToId === SavingThrowId.Fortitude) {
                        fort += value;
                    } else if (entity.appliesToId === SavingThrowId.Reflex) {
                        ref += value;
                    } else if (entity.appliesToId === SavingThrowId.Will) {
                        will += value;
                    }
                }
            }
        }

        return { bab, fort, ref, will };
    },

    /**
     * Alternate Form: keep character HD/hp/BAB/base saves/mental stats/skills/feats;
     * take form size, Str/Dex/Con, natural armor, movement, and natural attacks.
     * Non-elemental forms keep only Extraordinary special abilities.
     */
    applyAlternateForm(args: {
        monsterId: number;
        monster: GetMonsterResponse;
        isElementalForm: boolean;
        character: {
            hitDice: number;
            hitPoints: number;
            baseAttack: number;
            fortBase: number;
            refBase: number;
            willBase: number;
            intelligence: number;
            wisdom: number;
            charisma: number;
            skills: CompanionComputedStatBlock['skills'];
            feats: CompanionComputedStatBlock['feats'];
        };
    }): CompanionComputedStatBlock {
        const { monster, character } = args;
        const conMod = GetAbilityModifier(monster.constitution ?? 10);
        const dexMod = GetAbilityModifier(monster.dexterity ?? 10);
        const wisMod = GetAbilityModifier(character.wisdom);
        const strMod = GetAbilityModifier(monster.strength ?? 10);
        const sizeId = monster.sizeId ?? SizeId.Medium;
        const sizeGrapple = SIZE_MAP[sizeId]?.grappleModifier ?? 0;

        const specialAbilities = args.isElementalForm
            ? (monster.specialAbilities ?? [])
            : (monster.specialAbilities ?? []).filter(
                (sa) => sa.ability?.abilityType === MonsterSpecialAbilityTypeId.Extraordinary
            );

        const feats = args.isElementalForm ? (monster.feats ?? []) : character.feats;

        const block: CompanionComputedStatBlock = {
            ...monster,
            id: args.monsterId,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            charisma: character.charisma,
            hitDiceQty: character.hitDice,
            averageHP: character.hitPoints,
            bonusHP: character.hitPoints,
            baseAttack: character.baseAttack,
            fortSave: character.fortBase + conMod,
            refSave: character.refBase + dexMod,
            willSave: character.willBase + wisMod,
            grapple: character.baseAttack + strMod + sizeGrapple,
            initiative: dexMod,
            skills: character.skills,
            feats,
            specialAbilities,
            equipment: [],
        };

        return block;
    },
};
