import { BadRequestError } from '@/errors/BadRequestError';
import { prisma } from '@/lib/prisma';
import { transformFormulaParamsFromDatabase } from '@/utils/formulaParamTransformers';
import type {
    CharacterCompanionDraft,
    CharacterCompanionFeatInput,
    CharacterCompanionSkillInput,
    CharacterCompanionTrickInput,
    CharacterWithAllDetailsResponse,
    CompanionBudgets,
    CompanionComputedStatBlock,
    FeatureEntity,
    FeatureEntityCondition,
    FeatureWithRelations,
    GetMonsterResponse,
    GetResolvedCharacterCompanionsResponse,
    ResolvedCharacterCompanion,
    ResolvedCharacterCompanionDraft,
    ResolvedCompanionProgression,
    ResolvedCompanionSpecial,
} from '@shared/schema';
import {
    AbilityId,
    CharacterCompanionRole,
    CompanionType,
    EntityAppliesToType,
    EntityType,
    FeatureBonusType,
    getBonusFeatSlots,
    getBonusHdAverageHp,
    getBonusSkillPoints,
    getDruidBabForHitDice,
    getGoodSaveForHitDice,
    getHandleAnimalTrainedSlots,
    getPoorSaveForHitDice,
    GetAbilityModifier,
    HANDLE_ANIMAL_INT2_PURPOSE_TRICK_THRESHOLD,
    isCompanionBeneficiaryEntity,
    isCompanionChassisAppliesTo,
    MonsterArmorComponentTypeId,
    MULTIATTACK_FEAT_NAME,
    SavingThrowId,
    SCENT_ABILITY_NAME,
    SIZE_MAP,
    canUseHandleAnimal,
    isFamiliarCompanionType,
    usesHandleAnimal,
} from '@shared/static-data';

import { evaluateEntityFormula } from './companionFormula';
import { monsterService } from '../monster/monsterService';

const SYNTHETIC_ID_BASE = 1_000_000;

interface CompanionChassisOverlay {
    intelligence: number | null;
    spellResistance: number | null;
    devotionWillBonus: number;
    multiattackFeatId: number | null;
}

const chassisOverlayByProgression = new WeakMap<ResolvedCompanionProgression, CompanionChassisOverlay>();

interface CompanionProgressionContext {
    classLevels: Map<number, number>;
    choiceFeatures: FeatureWithRelations[];
}

interface CharacterCompanionRow {
    id: number;
    characterId: number;
    monsterId: number;
    companionId: number | null;
    trickPurposeId: number | null;
    name: string | null;
    levelAcquired: number | null;
    hitPoints: number | null;
    wounds: number;
    companion: {
        id: number;
        type: number;
        monsterId: number;
        minLevel: number | null;
        levelAdjustment: number | null;
    } | null;
    trickPurpose: {
        id: number;
        name: string;
        description: string | null;
        dc: number;
        trainingWeeks: number;
        editionId: number;
        isVisible: boolean;
        replacesPurposeId: number | null;
    } | null;
    tricks: Array<{
        id: number;
        characterCompanionId: number;
        trickId: number;
        timesTrained: number;
        isBonus: boolean;
        fromPurpose: boolean;
        trick: {
            id: number;
            name: string;
            description: string | null;
            editionId: number;
            dc: number;
            maxTimesTrainable: number;
            isVisible: boolean;
        };
    }>;
    skills: Array<{
        id: number;
        characterCompanionId: number;
        skillId: number;
        skillSubId: number | null;
        ranks: number;
    }>;
    feats: Array<{
        id: number;
        characterCompanionId: number;
        featId: number;
        notes: string | null;
    }>;
}

/**
 * Resolves PHB animal-companion progression from shared Feature rows and overlays
 * it onto monster stat blocks. Pets skip the overlay. Missing features yield base stats only.
 */
export const companionAdvancementService = {
    /**
     * Builds resolved companions (pets, familiars, animal companions) for a character.
     */
    async getResolvedCharacterCompanions(characterId: number): Promise<GetResolvedCharacterCompanionsResponse> {
        const rows = await prisma.characterCompanion.findMany({
            where: { characterId },
            include: {
                companion: true,
                trickPurpose: true,
                tricks: { include: { trick: true } },
                skills: true,
                feats: true,
            },
            orderBy: { levelAcquired: 'asc' },
        });

        const selectedCompanionIds = await this.getSelectedCompanionIdsFromChoices(
            await prisma.characterFeatureChoice.findMany({
                where: { characterId },
                select: { featureEntityId: true, appliesToId: true },
            })
        );

        const results: ResolvedCharacterCompanion[] = [];
        for (const row of rows) {
            const inferred = row.companion ?? await this.inferCompanionTemplate(
                row.companionId,
                row.monsterId,
                selectedCompanionIds
            );
            results.push(await this.resolveCharacterCompanion({
                ...row,
                companionId: inferred?.id ?? row.companionId,
                companion: inferred,
            }));
        }

        return {
            total: results.length,
            results,
        };
    },

    /**
     * Validates trick, skill, and feat budgets before persist.
     */
    async validateCompanionWrite(args: {
        monsterId: number;
        companionId: number | null | undefined;
        characterId: number;
        trickPurposeId: number | null | undefined;
        tricks: CharacterCompanionTrickInput[] | undefined;
        skills: CharacterCompanionSkillInput[] | undefined;
        feats: CharacterCompanionFeatInput[] | undefined;
    }): Promise<void> {
        const monster = await monsterService.getMonsterById({ id: args.monsterId });
        if (!monster) {
            throw new BadRequestError('Monster not found');
        }

        const companion = args.companionId
            ? await prisma.companion.findUnique({ where: { id: args.companionId } })
            : null;

        const progression = await this.resolveProgression(args.characterId, companion);
        const budgets = this.computeBudgets({
            monster,
            progression,
            skills: args.skills ?? [],
            feats: args.feats ?? [],
            tricks: args.tricks ?? [],
            companionType: companion?.type,
        });

        const intelligence = monster.intelligence;
        if (isFamiliarCompanionType(companion?.type) && (args.trickPurposeId || (args.tricks ?? []).length > 0)) {
            throw new BadRequestError('Familiars cannot be trained with Handle Animal');
        }
        if (args.trickPurposeId && !canUseHandleAnimal(intelligence)) {
            throw new BadRequestError('Handle Animal purposes require Intelligence 1 or 2');
        }

        let purposeTrickCount = 0;
        if (args.trickPurposeId) {
            const purpose = await prisma.trickPurpose.findUnique({
                where: { id: args.trickPurposeId },
                include: { tricks: { include: { trick: true } } },
            });
            if (!purpose) {
                throw new BadRequestError('Trick purpose not found');
            }
            purposeTrickCount = purpose.tricks.reduce((sum, row) => sum + row.timesTrained, 0);
            if (
                purposeTrickCount > HANDLE_ANIMAL_INT2_PURPOSE_TRICK_THRESHOLD
                && Math.floor(intelligence ?? 0) < 2
            ) {
                throw new BadRequestError('This purpose requires Intelligence 2');
            }

            const trackRow = purpose.tricks.find((row) => row.trick.name === 'Track');
            if (trackRow && !(await this.monsterHasScent(args.monsterId))) {
                throw new BadRequestError('Track requires the Scent special ability');
            }
        }

        const trickDefs = args.tricks && args.tricks.length > 0
            ? await prisma.trick.findMany({
                where: { id: { in: args.tricks.map((t) => t.trickId) } },
            })
            : [];
        const trickById = new Map(trickDefs.map((t) => [t.id, t]));

        for (const trick of args.tricks ?? []) {
            const def = trickById.get(trick.trickId);
            if (!def) {
                throw new BadRequestError(`Unknown trick ${trick.trickId}`);
            }
            if (trick.timesTrained > def.maxTimesTrainable) {
                throw new BadRequestError(`${def.name} can be trained at most ${def.maxTimesTrainable} time(s)`);
            }
            if (def.name === 'Track' && !(await this.monsterHasScent(args.monsterId))) {
                throw new BadRequestError('Track requires the Scent special ability');
            }
        }

        const playerTrickCount = (args.tricks ?? [])
            .reduce((sum, t) => sum + t.timesTrained, 0);
        const trickSlotsMax = budgets.trainedSlotsMax + budgets.bonusSlotsMax;

        if (playerTrickCount + purposeTrickCount > trickSlotsMax) {
            throw new BadRequestError(
                `Tricks exceed the animal's known-trick limit (${trickSlotsMax})`
            );
        }
        if (budgets.skillPointsUsed > budgets.skillPointsMax) {
            throw new BadRequestError(
                `Assigned skill ranks exceed bonus HD skill points (${budgets.skillPointsMax})`
            );
        }
        if (budgets.featSlotsUsed > budgets.featSlotsMax) {
            throw new BadRequestError(
                `Assigned feats exceed bonus HD feat slots (${budgets.featSlotsMax})`
            );
        }
    },

    /**
     * Effective companion level: sum of floor(classLevel / levelDivisor) for classes
     * that have an Animal Companion (or alternative) choice, minus template levelAdjustment.
     */
    computeEffectiveCompanionLevel(
        classLevels: Map<number, number>,
        choiceFeatures: FeatureWithRelations[],
        levelAdjustment: number | null | undefined
    ): number {
        const contributingClassIds = new Set<number>();
        let stacked = 0;

        for (const feature of choiceFeatures) {
            for (const classMap of feature.classes ?? []) {
                if (contributingClassIds.has(classMap.classId)) {
                    continue;
                }
                const classLevel = classLevels.get(classMap.classId) ?? 0;
                if (classLevel <= 0) {
                    continue;
                }
                contributingClassIds.add(classMap.classId);
                const divisor = classMap.levelDivisor >= 1 ? classMap.levelDivisor : 1;
                stacked += Math.floor(classLevel / divisor);
            }
        }

        return Math.max(0, stacked - (levelAdjustment ?? 0));
    },

    async getEffectiveCompanionLevel(characterId: number, levelAdjustment: number | null | undefined): Promise<number> {
        const classLevels = await this.getClassLevels(characterId);
        const choiceFeatures = await this.loadAnimalCompanionChoiceFeatures(characterId);
        return this.computeEffectiveCompanionLevel(classLevels, choiceFeatures, levelAdjustment);
    },

    async getEffectiveFamiliarLevel(characterId: number, levelAdjustment: number | null | undefined): Promise<number> {
        const classLevels = await this.getClassLevels(characterId);
        const choiceFeatures = await this.loadFamiliarChoiceFeatures(characterId);
        return this.computeEffectiveCompanionLevel(classLevels, choiceFeatures, levelAdjustment);
    },

    async resolveProgression(
        characterId: number,
        companion: { id: number; type: number; levelAdjustment: number | null } | null,
        context?: CompanionProgressionContext
    ): Promise<ResolvedCompanionProgression | null> {
        if (!companion) {
            return null;
        }

        const isFamiliar = isFamiliarCompanionType(companion.type);
        const isAnimalCompanion = companion.type === CompanionType.AnimalCompanion
            || companion.type === CompanionType.AlternativeAnimalCompanion;
        if (!isFamiliar && !isAnimalCompanion) {
            return null;
        }

        const classLevels = context?.classLevels ?? await this.getClassLevels(characterId);
        const choiceFeatures = context?.choiceFeatures
            ?? (isFamiliar
                ? await this.loadFamiliarChoiceFeatures(characterId)
                : await this.loadAnimalCompanionChoiceFeatures(characterId));
        const effectiveLevel = this.computeEffectiveCompanionLevel(
            classLevels,
            choiceFeatures,
            companion.levelAdjustment
        );
        const contributingClassIds = this.getContributingClassIds(classLevels, choiceFeatures);
        const features = contributingClassIds.length > 0
            ? await this.loadCompanionBeneficiaryFeatures(contributingClassIds)
            : [];
        const unlocked = features.filter((feature) => feature.level <= effectiveLevel);
        const bonuses = this.evaluateCompanionChassis(unlocked, effectiveLevel);
        const specials = this.collectCompanionSpecials(unlocked);
        const progression: ResolvedCompanionProgression = {
            effectiveLevel,
            bonusHd: bonuses.bonusHd,
            naturalArmorAdj: bonuses.naturalArmorAdj,
            strAdj: bonuses.strAdj,
            dexAdj: bonuses.dexAdj,
            bonusTricks: bonuses.bonusTricks,
            specials,
        };
        chassisOverlayByProgression.set(progression, {
            intelligence: bonuses.intelligence,
            spellResistance: bonuses.spellResistance,
            devotionWillBonus: bonuses.devotionWillBonus,
            multiattackFeatId: bonuses.multiattackFeatId,
        });
        return progression;
    },

    /**
     * Class IDs that contribute to this companion’s effective level via choice features.
     */
    getContributingClassIds(
        classLevels: Map<number, number>,
        choiceFeatures: FeatureWithRelations[]
    ): number[] {
        const contributingClassIds = new Set<number>();
        for (const feature of choiceFeatures) {
            for (const classMap of feature.classes ?? []) {
                const classLevel = classLevels.get(classMap.classId) ?? 0;
                if (classLevel > 0) {
                    contributingClassIds.add(classMap.classId);
                }
            }
        }
        return [...contributingClassIds];
    },

    /**
     * Chassis numbers from Type=Companion entities (HD, NA, abilities, tricks, SR, Int).
     */
    evaluateCompanionChassis(
        features: FeatureWithRelations[],
        effectiveLevel: number
    ): {
        bonusHd: number;
        naturalArmorAdj: number;
        strAdj: number;
        dexAdj: number;
        bonusTricks: number;
        intelligence: number | null;
        spellResistance: number | null;
        devotionWillBonus: number;
        multiattackFeatId: number | null;
    } {
        const bonuses = {
            bonusHd: 0,
            naturalArmorAdj: 0,
            strAdj: 0,
            dexAdj: 0,
            bonusTricks: 0,
            intelligence: null as number | null,
            spellResistance: null as number | null,
            devotionWillBonus: 0,
            multiattackFeatId: null as number | null,
        };

        for (const feature of features) {
            for (const entity of feature.entities ?? []) {
                if (!isCompanionBeneficiaryEntity(entity)) {
                    continue;
                }
                if (
                    entity.appliesTo === EntityAppliesToType.Feat
                    && entity.appliesToId
                    && entity.appliesToId > 0
                ) {
                    bonuses.multiattackFeatId = entity.appliesToId;
                }
                const value = evaluateEntityFormula(entity, effectiveLevel, feature.level);
                if (value === null) {
                    continue;
                }
                if (entity.appliesTo === EntityAppliesToType.HitDice && value > 0) {
                    bonuses.bonusHd = value;
                } else if (
                    entity.appliesTo === EntityAppliesToType.AC
                    && entity.bonusType === FeatureBonusType.NaturalArmor
                    && value > 0
                ) {
                    bonuses.naturalArmorAdj = value;
                } else if (
                    entity.appliesTo === EntityAppliesToType.Ability
                    && entity.appliesToId === AbilityId.Strength
                    && value > 0
                ) {
                    bonuses.strAdj = value;
                } else if (
                    entity.appliesTo === EntityAppliesToType.Ability
                    && entity.appliesToId === AbilityId.Dexterity
                    && value > 0
                ) {
                    bonuses.dexAdj = value;
                } else if (
                    entity.appliesTo === EntityAppliesToType.Ability
                    && entity.appliesToId === AbilityId.Intelligence
                    && value > 0
                ) {
                    bonuses.intelligence = value;
                } else if (entity.appliesTo === EntityAppliesToType.CompanionBonusTricks && value > 0) {
                    bonuses.bonusTricks = value;
                } else if (entity.appliesTo === EntityAppliesToType.SpellResistance && value > 0) {
                    bonuses.spellResistance = value;
                } else if (
                    entity.appliesTo === EntityAppliesToType.SavingThrow
                    && entity.appliesToId === SavingThrowId.Will
                    && value > 0
                ) {
                    bonuses.devotionWillBonus = value;
                }
            }
        }

        return bonuses;
    },

    /**
     * Named creature specials: Type=Companion, displayInDetail, not chassis-only math.
     * Display string is `Name: summary`.
     */
    collectCompanionSpecials(features: FeatureWithRelations[]): ResolvedCompanionSpecial[] {
        const specials: ResolvedCompanionSpecial[] = [];
        const seen = new Set<string>();
        for (const feature of features) {
            const visible = (feature.entities ?? []).filter((entity) => (
                isCompanionBeneficiaryEntity(entity)
                && entity.displayInDetail !== false
                && !isCompanionChassisAppliesTo(entity.appliesTo)
            ));
            if (visible.length === 0) {
                continue;
            }
            if (seen.has(feature.slug)) {
                continue;
            }
            seen.add(feature.slug);
            const summary = feature.summary?.trim();
            specials.push({
                slug: feature.slug,
                name: summary ? `${feature.name}: ${summary}` : feature.name,
                description: feature.description,
            });
        }
        return specials;
    },

    computeBudgets(args: {
        monster: GetMonsterResponse;
        progression: ResolvedCompanionProgression | null;
        skills: CharacterCompanionSkillInput[];
        feats: CharacterCompanionFeatInput[];
        tricks: Array<Pick<CharacterCompanionTrickInput, 'timesTrained' | 'isBonus'>>;
        companionType?: number | null;
    }): CompanionBudgets {
        const bonusHd = args.progression?.bonusHd ?? 0;
        const baseHd = args.monster.hitDiceQty ?? 1;
        const totalHd = baseHd + bonusHd;
        const skillPointsMax = getBonusSkillPoints(bonusHd, args.monster.intelligence);
        const featSlotsMax = getBonusFeatSlots(baseHd, totalHd);
        const trainedSlotsMax = usesHandleAnimal(args.companionType)
            ? getHandleAnimalTrainedSlots(args.monster.intelligence)
            : 0;
        const bonusSlotsMax = usesHandleAnimal(args.companionType)
            ? (args.progression?.bonusTricks ?? 0)
            : 0;

        return {
            trainedSlotsUsed: args.tricks.filter((t) => !t.isBonus).reduce((sum, t) => sum + t.timesTrained, 0),
            trainedSlotsMax,
            bonusSlotsUsed: args.tricks.filter((t) => t.isBonus).reduce((sum, t) => sum + t.timesTrained, 0),
            bonusSlotsMax,
            skillPointsUsed: args.skills.reduce((sum, s) => sum + s.ranks, 0),
            skillPointsMax,
            featSlotsUsed: args.feats.length,
            featSlotsMax,
        };
    },

    /**
     * Overlays companion progression and assigned skills/feats onto a monster stat block.
     */
    applyCompanionOverlay(args: {
        monsterId: number;
        monster: GetMonsterResponse;
        hitPoints: number | null;
        progression: ResolvedCompanionProgression | null;
        assignedSkills: CharacterCompanionSkillInput[];
        assignedFeats: CharacterCompanionFeatInput[];
        multiattackFeatId: number | null;
    }): CompanionComputedStatBlock {
        const block: CompanionComputedStatBlock = {
            ...args.monster,
            id: args.monsterId,
            skills: (args.monster.skills ?? []).map((s) => ({ ...s })),
            feats: (args.monster.feats ?? []).map((f) => ({ ...f })),
            armorBreakdown: (args.monster.armorBreakdown ?? []).map((a) => ({ ...a })),
            specialAbilities: (args.monster.specialAbilities ?? []).map((sa) => ({ ...sa })),
        };

        const progression = args.progression;
        if (!progression) {
            if (args.hitPoints !== null) {
                block.averageHP = args.hitPoints;
            }
            this.mergeAssignedSkillsAndFeats(block, args.assignedSkills, args.assignedFeats);
            return block;
        }

        const oldStr = block.strength ?? 10;
        const oldDex = block.dexterity ?? 10;
        const newStr = oldStr + progression.strAdj;
        const newDex = oldDex + progression.dexAdj;
        const _strDelta = GetAbilityModifier(newStr) - GetAbilityModifier(oldStr);
        const dexDelta = GetAbilityModifier(newDex) - GetAbilityModifier(oldDex);

        block.strength = newStr;
        block.dexterity = newDex;
        block.initiative = (block.initiative ?? GetAbilityModifier(oldDex)) + dexDelta;
        block.armorClass = (block.armorClass ?? 10) + progression.naturalArmorAdj + dexDelta;
        block.touchAC = (block.touchAC ?? 10) + dexDelta;
        block.flatFootedAC = (block.flatFootedAC ?? 10) + progression.naturalArmorAdj;

        const naComponent = (block.armorBreakdown ?? []).find(
            (row) => row.componentType === MonsterArmorComponentTypeId.NaturalArmor
        );
        if (naComponent) {
            naComponent.value = (naComponent.value ?? 0) + progression.naturalArmorAdj;
        }

        const baseHd = block.hitDiceQty ?? 1;
        const totalHd = baseHd + progression.bonusHd;
        block.hitDiceQty = totalHd;
        if (progression.bonusHd > 0) {
            const extraHp = getBonusHdAverageHp(progression.bonusHd, block.constitution);
            block.averageHP = (block.averageHP ?? 0) + extraHp;
            block.bonusHP = (block.bonusHP ?? 0) + extraHp;
        }

        const conMod = GetAbilityModifier(block.constitution ?? 10);
        const dexMod = GetAbilityModifier(block.dexterity ?? 10);
        const wisMod = GetAbilityModifier(block.wisdom ?? 10);
        const strMod = GetAbilityModifier(block.strength ?? 10);
        block.baseAttack = getDruidBabForHitDice(totalHd);
        const chassisOverlay = chassisOverlayByProgression.get(progression);
        block.fortSave = getGoodSaveForHitDice(totalHd) + conMod;
        block.refSave = getGoodSaveForHitDice(totalHd) + dexMod;
        block.willSave = getPoorSaveForHitDice(totalHd) + wisMod + (chassisOverlay?.devotionWillBonus ?? 0);
        if (chassisOverlay?.spellResistance && chassisOverlay.spellResistance > 0) {
            const srLabel = `SR ${chassisOverlay.spellResistance}`;
            block.specialQualities = block.specialQualities
                ? `${block.specialQualities}; ${srLabel}`
                : srLabel;
        }

        const sizeId = block.sizeId ?? 5;
        const sizeGrapple = SIZE_MAP[sizeId]?.grappleModifier ?? 0;
        block.grapple = (block.baseAttack ?? 0) + strMod + sizeGrapple;

        this.mergeAssignedSkillsAndFeats(block, args.assignedSkills, args.assignedFeats);

        const grantedFeatId = chassisOverlay?.multiattackFeatId
            ?? (progression.specials.some((special) => (
                special.slug === 'multiattack'
                || special.name.includes(MULTIATTACK_FEAT_NAME)
            ))
                ? args.multiattackFeatId
                : null);
        if (grantedFeatId) {
            const alreadyHas = (block.feats ?? []).some((f) => f.featId === grantedFeatId);
            if (!alreadyHas) {
                block.feats = [
                    ...(block.feats ?? []),
                    {
                        id: SYNTHETIC_ID_BASE + (block.feats ?? []).length,
                        featId: grantedFeatId,
                        notes: 'Animal companion bonus feat',
                    },
                ];
            }
        }

        if (args.hitPoints !== null) {
            block.averageHP = args.hitPoints;
        }

        return block;
    },

    /**
     * Overlays familiar NA / Intelligence. Does not apply animal-companion HD, BAB, or saves.
     */
    async applyFamiliarOverlay(args: {
        monsterId: number;
        monster: GetMonsterResponse;
        hitPoints: number | null;
        progression: ResolvedCompanionProgression | null;
        assignedSkills: CharacterCompanionSkillInput[];
        assignedFeats: CharacterCompanionFeatInput[];
    }): Promise<CompanionComputedStatBlock> {
        const block: CompanionComputedStatBlock = {
            ...args.monster,
            id: args.monsterId,
            skills: (args.monster.skills ?? []).map((s) => ({ ...s })),
            feats: (args.monster.feats ?? []).map((f) => ({ ...f })),
            armorBreakdown: (args.monster.armorBreakdown ?? []).map((a) => ({ ...a })),
            specialAbilities: (args.monster.specialAbilities ?? []).map((sa) => ({ ...sa })),
        };

        const progression = args.progression;
        if (progression) {
            block.armorClass = (block.armorClass ?? 10) + progression.naturalArmorAdj;
            block.flatFootedAC = (block.flatFootedAC ?? 10) + progression.naturalArmorAdj;
            const naComponent = (block.armorBreakdown ?? []).find(
                (row) => row.componentType === MonsterArmorComponentTypeId.NaturalArmor
            );
            if (naComponent) {
                naComponent.value = (naComponent.value ?? 0) + progression.naturalArmorAdj;
            }

            const chassisOverlay = chassisOverlayByProgression.get(progression);
            const familiarIntelligence = chassisOverlay?.intelligence
                ?? await this.evaluateFamiliarIntelligence(progression.effectiveLevel);
            if (familiarIntelligence !== null && familiarIntelligence > (block.intelligence ?? 0)) {
                block.intelligence = familiarIntelligence;
            }
            if (chassisOverlay?.spellResistance && chassisOverlay.spellResistance > 0) {
                const srLabel = `SR ${chassisOverlay.spellResistance}`;
                block.specialQualities = block.specialQualities
                    ? `${block.specialQualities}; ${srLabel}`
                    : srLabel;
            }
        }

        if (args.hitPoints !== null) {
            block.averageHP = args.hitPoints;
        }
        this.mergeAssignedSkillsAndFeats(block, args.assignedSkills, args.assignedFeats);
        return block;
    },

    /**
     * Familiar Intelligence from Type=Companion Ability/INT entities, or null if unseeded.
     */
    async evaluateFamiliarIntelligence(effectiveLevel: number): Promise<number | null> {
        const features = await prisma.feature.findMany({
            where: {
                entities: {
                    some: {
                        type: EntityType.Companion,
                        appliesTo: EntityAppliesToType.Ability,
                        appliesToId: AbilityId.Intelligence,
                    },
                },
            },
            include: {
                entities: { include: { formulaParams: true, conditions: true } },
            },
        });
        const mapped = this.mapFeatureRows(features);
        return this.evaluateCompanionChassis(mapped, effectiveLevel).intelligence;
    },

    async getClassLevels(characterId: number): Promise<Map<number, number>> {
        const advancements = await prisma.characterAdvancement.findMany({
            where: { characterId },
            select: { classId: true, secondaryClassId: true },
            orderBy: { level: 'asc' },
        });
        return classLevelsFromAdvancements(advancements);
    },

    async monsterHasScent(monsterId: number): Promise<boolean> {
        const monster = await prisma.monster.findUnique({
            where: { id: monsterId },
            select: {
                specialQualities: true,
                specialAbilities: {
                    include: { ability: { select: { name: true } } },
                },
            },
        });
        if (!monster) {
            return false;
        }
        if (monster.specialQualities?.toLowerCase().includes(SCENT_ABILITY_NAME.toLowerCase())) {
            return true;
        }
        return monster.specialAbilities.some(
            (row) => row.ability?.name.toLowerCase() === SCENT_ABILITY_NAME.toLowerCase()
        );
    },

    async resolveCharacterCompanion(
        row: CharacterCompanionRow,
        context?: CompanionProgressionContext
    ): Promise<ResolvedCharacterCompanion> {
        const monster = await monsterService.getMonsterById({ id: row.monsterId });
        if (!monster) {
            throw new BadRequestError(`Monster ${row.monsterId} not found for companion ${row.id}`);
        }

        const progression = await this.resolveProgression(row.characterId, row.companion, context);
        const multiattackFeat = await prisma.feat.findFirst({
            where: { name: MULTIATTACK_FEAT_NAME },
            select: { id: true },
        });

        const assignedSkills = row.skills.map((s) => ({
            skillId: s.skillId,
            skillSubId: s.skillSubId,
            ranks: s.ranks,
        }));
        const assignedFeats = row.feats.map((f) => ({
            featId: f.featId,
            notes: f.notes,
        }));

        const computedStatBlock = isFamiliarCompanionType(row.companion?.type)
            ? await this.applyFamiliarOverlay({
                monsterId: row.monsterId,
                monster,
                hitPoints: row.hitPoints,
                progression,
                assignedSkills,
                assignedFeats,
            })
            : this.applyCompanionOverlay({
                monsterId: row.monsterId,
                monster,
                hitPoints: row.hitPoints,
                progression,
                assignedSkills,
                assignedFeats,
                multiattackFeatId: multiattackFeat?.id ?? null,
            });

        const budgets = this.computeBudgets({
            monster,
            progression,
            skills: assignedSkills,
            feats: assignedFeats,
            tricks: row.tricks,
            companionType: row.companion?.type,
        });

        const role = row.companion
            ? row.companion.type
            : CharacterCompanionRole.Pet;

        return {
            id: row.id,
            characterId: row.characterId,
            monsterId: row.monsterId,
            companionId: row.companionId,
            trickPurposeId: row.trickPurposeId,
            name: row.name,
            levelAcquired: row.levelAcquired,
            hitPoints: row.hitPoints,
            wounds: row.wounds,
            companion: row.companion ?? undefined,
            trickPurpose: row.trickPurpose ?? undefined,
            tricks: row.tricks.map((t) => ({
                id: t.id,
                characterCompanionId: t.characterCompanionId,
                trickId: t.trickId,
                timesTrained: t.timesTrained,
                isBonus: t.isBonus,
                fromPurpose: t.fromPurpose,
                trick: t.trick,
            })),
            skills: row.skills,
            feats: row.feats,
            role,
            computedStatBlock,
            progression,
            budgets,
        };
    },

    /**
     * Class features that have at least one Type=Companion entity for the given classes.
     */
    async loadCompanionBeneficiaryFeatures(classIds: number[]): Promise<FeatureWithRelations[]> {
        if (classIds.length === 0) {
            return [];
        }
        const features = await prisma.feature.findMany({
            where: {
                classes: { some: { classId: { in: classIds } } },
                entities: { some: { type: EntityType.Companion } },
            },
            include: {
                classes: true,
                entities: { include: { formulaParams: true, conditions: true } },
            },
        });
        return this.mapFeatureRows(features);
    },

    /**
     * Maps Prisma feature rows (with entities) onto FeatureWithRelations.
     */
    mapFeatureRows(
        features: Array<{
            sourceType: number;
            entities: Array<{
                type: number;
                appliesTo: number;
                bonusType: number | null;
                formulaParams: Parameters<typeof transformFormulaParamsFromDatabase>[0] | null;
                conditions: Array<{ conditionType: number }>;
            }>;
        }>
    ): FeatureWithRelations[] {
        return features.map((feature) => ({
            ...feature,
            sourceType: feature.sourceType as FeatureWithRelations['sourceType'],
            entities: feature.entities.map((entity) => ({
                ...entity,
                type: entity.type as FeatureEntity['type'],
                appliesTo: entity.appliesTo as FeatureEntity['appliesTo'],
                bonusType: entity.bonusType as FeatureEntity['bonusType'],
                formulaParams: entity.formulaParams
                    ? transformFormulaParamsFromDatabase(entity.formulaParams)
                    : null,
                conditions: entity.conditions.map((condition) => ({
                    ...condition,
                    conditionType: condition.conditionType as FeatureEntityCondition['conditionType'],
                })),
            })),
        })) as FeatureWithRelations[];
    },

    async loadAnimalCompanionChoiceFeatures(characterId: number): Promise<FeatureWithRelations[]> {
        const choices = await prisma.characterFeatureChoice.findMany({
            where: { characterId },
            select: { featureId: true, featureEntityId: true },
        });
        if (choices.length === 0) {
            return [];
        }

        const entityIds = choices.map((c) => c.featureEntityId);
        const entities = await prisma.featureEntity.findMany({
            where: {
                id: { in: entityIds },
                appliesTo: {
                    in: [EntityAppliesToType.AnimalCompanion, EntityAppliesToType.Familiar],
                },
            },
            select: { featureId: true, appliesTo: true },
        });

        const animalChoiceFeatureIds = entities
            .filter((e) => e.appliesTo === EntityAppliesToType.AnimalCompanion)
            .map((e) => e.featureId);

        if (animalChoiceFeatureIds.length === 0) {
            return [];
        }

        const features = await prisma.feature.findMany({
            where: { id: { in: animalChoiceFeatureIds } },
            include: { classes: true },
        });

        return features.map((feature) => ({
            ...feature,
            sourceType: feature.sourceType as FeatureWithRelations['sourceType'],
        }));
    },

    /**
     * Loads Animal Companion choice features from snapshot feature-choice rows.
     */
    async loadAnimalCompanionChoiceFeaturesFromChoices(
        choices: Array<{ featureId: number; featureEntityId: number }>
    ): Promise<FeatureWithRelations[]> {
        if (choices.length === 0) {
            return [];
        }
        const entities = await prisma.featureEntity.findMany({
            where: {
                id: { in: choices.map((choice) => choice.featureEntityId) },
                appliesTo: EntityAppliesToType.AnimalCompanion,
            },
            select: { featureId: true },
        });
        const featureIds = [...new Set(entities.map((entity) => entity.featureId))];
        if (featureIds.length === 0) {
            return [];
        }
        const features = await prisma.feature.findMany({
            where: { id: { in: featureIds } },
            include: { classes: true },
        });
        return features.map((feature) => ({
            ...feature,
            sourceType: feature.sourceType as FeatureWithRelations['sourceType'],
        }));
    },

    async loadFamiliarChoiceFeatures(characterId: number): Promise<FeatureWithRelations[]> {
        const choices = await prisma.characterFeatureChoice.findMany({
            where: { characterId },
            select: { featureId: true, featureEntityId: true },
        });
        return this.loadFamiliarChoiceFeaturesFromChoices(choices);
    },

    /**
     * Loads Familiar choice features from snapshot feature-choice rows.
     */
    async loadFamiliarChoiceFeaturesFromChoices(
        choices: Array<{ featureId: number; featureEntityId: number }>
    ): Promise<FeatureWithRelations[]> {
        if (choices.length === 0) {
            return [];
        }
        const entities = await prisma.featureEntity.findMany({
            where: {
                id: { in: choices.map((choice) => choice.featureEntityId) },
                appliesTo: EntityAppliesToType.Familiar,
            },
            select: { featureId: true },
        });
        const featureIds = [...new Set(entities.map((entity) => entity.featureId))];
        if (featureIds.length === 0) {
            return [];
        }
        const features = await prisma.feature.findMany({
            where: { id: { in: featureIds } },
            include: { classes: true },
        });
        return features.map((feature) => ({
            ...feature,
            sourceType: feature.sourceType as FeatureWithRelations['sourceType'],
        }));
    },

    /**
     * When companionId is missing, attach the chosen Familiar/Animal Companion template
     * that matches this monster so legacy pet rows resolve as class companions.
     */
    async inferCompanionTemplate(
        companionId: number | null,
        monsterId: number,
        selectedCompanionIds: number[]
    ): Promise<CharacterCompanionRow['companion']> {
        if (companionId && companionId > 0) {
            const explicit = await prisma.companion.findUnique({ where: { id: companionId } });
            return explicit ?? null;
        }
        if (selectedCompanionIds.length === 0) {
            return null;
        }
        const matches = await prisma.companion.findMany({
            where: {
                id: { in: selectedCompanionIds },
                monsterId,
            },
        });
        return matches[0] ?? null;
    },

    async getSelectedCompanionIdsFromChoices(
        choices: Array<{ featureEntityId: number; appliesToId?: number | null }>
    ): Promise<number[]> {
        if (choices.length === 0) {
            return [];
        }
        const entities = await prisma.featureEntity.findMany({
            where: {
                id: { in: choices.map((choice) => choice.featureEntityId) },
                appliesTo: {
                    in: [EntityAppliesToType.AnimalCompanion, EntityAppliesToType.Familiar],
                },
            },
            select: { id: true },
        });
        const companionEntityIds = new Set(entities.map((entity) => entity.id));
        return [...new Set(choices
            .filter((choice) => companionEntityIds.has(choice.featureEntityId) && (choice.appliesToId ?? 0) > 0)
            .map((choice) => choice.appliesToId as number))];
    },

    /**
     * Resolves draft or persisted companions against the character snapshot (class levels + choices).
     */
    async resolveCompanionsFromSnapshot(
        character: CharacterWithAllDetailsResponse
    ): Promise<ResolvedCharacterCompanionDraft[]> {
        const drafts = character.companions ?? [];
        if (drafts.length === 0) {
            return [];
        }

        const classLevels = classLevelsFromAdvancements(
            (character.advancements ?? []).map((adv) => ({
                classId: adv.classId,
                secondaryClassId: adv.secondaryClassId ?? null,
            }))
        );
        const snapshotChoices = (character.advancements ?? []).flatMap((adv) => adv.featureChoices ?? []);
        const selectedCompanionIds = await this.getSelectedCompanionIdsFromChoices(snapshotChoices);
        const animalContext: CompanionProgressionContext = {
            classLevels,
            choiceFeatures: await this.loadAnimalCompanionChoiceFeaturesFromChoices(snapshotChoices),
        };
        const familiarContext: CompanionProgressionContext = {
            classLevels,
            choiceFeatures: await this.loadFamiliarChoiceFeaturesFromChoices(snapshotChoices),
        };
        const rows = await this.hydrateCompanionDrafts(character.id, drafts, selectedCompanionIds);

        const results: ResolvedCharacterCompanionDraft[] = [];
        for (const row of rows) {
            let resolved: ResolvedCharacterCompanion;
            try {
                const context = isFamiliarCompanionType(row.companion?.type)
                    ? familiarContext
                    : animalContext;
                resolved = await this.resolveCharacterCompanion(row, context);
            } catch (error) {
                console.error(`Failed to resolve companion ${row.id} for character ${character.id}:`, error);
                continue;
            }
            results.push({
                id: resolved.id,
                characterId: resolved.characterId,
                monsterId: resolved.monsterId,
                companionId: resolved.companionId,
                trickPurposeId: resolved.trickPurposeId,
                name: resolved.name,
                levelAcquired: resolved.levelAcquired,
                hitPoints: resolved.hitPoints,
                wounds: resolved.wounds,
                companion: resolved.companion,
                trickPurpose: resolved.trickPurpose,
                tricks: (resolved.tricks ?? []).map((trick) => ({
                    id: trick.id,
                    trickId: trick.trickId,
                    timesTrained: trick.timesTrained,
                    isBonus: trick.isBonus,
                    fromPurpose: trick.fromPurpose,
                    trick: trick.trick,
                })),
                skills: (resolved.skills ?? []).map((skill) => ({
                    id: skill.id,
                    skillId: skill.skillId,
                    skillSubId: skill.skillSubId,
                    ranks: skill.ranks,
                })),
                feats: (resolved.feats ?? []).map((feat) => ({
                    id: feat.id,
                    featId: feat.featId,
                    notes: feat.notes,
                })),
                role: resolved.role,
                computedStatBlock: resolved.computedStatBlock,
                progression: resolved.progression,
                budgets: resolved.budgets,
            });
        }
        return results;
    },

    /**
     * Turns companion drafts into the row shape used by resolveCharacterCompanion.
     */
    async hydrateCompanionDrafts(
        characterId: number,
        drafts: CharacterCompanionDraft[],
        selectedCompanionIds: number[] = []
    ): Promise<CharacterCompanionRow[]> {
        const companionIds = [...new Set([
            ...drafts
                .map((row) => row.companionId ?? null)
                .filter((id): id is number => id !== null && id > 0),
            ...selectedCompanionIds,
        ])];
        const purposeIds = [...new Set(drafts
            .map((row) => row.trickPurposeId ?? null)
            .filter((id): id is number => id !== null && id > 0))];
        const trickIds = [...new Set(drafts.flatMap((row) => (
            (row.tricks ?? []).map((trick) => trick.trickId).filter((id) => id > 0)
        )))];

        const [companions, purposes, tricks] = await Promise.all([
            companionIds.length > 0
                ? prisma.companion.findMany({ where: { id: { in: companionIds } } })
                : Promise.resolve([]),
            purposeIds.length > 0
                ? prisma.trickPurpose.findMany({ where: { id: { in: purposeIds } } })
                : Promise.resolve([]),
            trickIds.length > 0
                ? prisma.trick.findMany({ where: { id: { in: trickIds } } })
                : Promise.resolve([]),
        ]);
        const companionById = new Map(companions.map((row) => [row.id, row]));
        const purposeById = new Map(purposes.map((row) => [row.id, row]));
        const trickById = new Map(tricks.map((row) => [row.id, row]));

        return drafts.map((row, index) => {
            const id = row.id !== 0 ? row.id : -(index + 1);
            const inferred = selectedCompanionIds.length > 0
                ? companions.find((template) => (
                    selectedCompanionIds.includes(template.id)
                    && template.monsterId === row.monsterId
                ))
                : undefined;
            const companionId = (row.companionId && row.companionId > 0)
                ? row.companionId
                : inferred?.id ?? null;
            const trickPurposeId = row.trickPurposeId ?? null;
            return {
                id,
                characterId: row.characterId !== 0 ? row.characterId : characterId,
                monsterId: row.monsterId,
                companionId,
                trickPurposeId,
                name: row.name ?? null,
                levelAcquired: row.levelAcquired ?? null,
                hitPoints: row.hitPoints ?? null,
                wounds: row.wounds ?? 0,
                companion: companionId !== null ? companionById.get(companionId) ?? null : null,
                trickPurpose: trickPurposeId !== null ? purposeById.get(trickPurposeId) ?? null : null,
                tricks: (row.tricks ?? []).map((trick, trickIndex) => {
                    const definition = trickById.get(trick.trickId);
                    return {
                        id: trick.id !== 0 ? trick.id : -(trickIndex + 1),
                        characterCompanionId: id,
                        trickId: trick.trickId,
                        timesTrained: trick.timesTrained ?? 1,
                        isBonus: trick.isBonus ?? false,
                        fromPurpose: trick.fromPurpose ?? false,
                        trick: definition ?? {
                            id: trick.trickId,
                            name: `Trick ${trick.trickId}`,
                            description: null,
                            editionId: 0,
                            dc: 0,
                            maxTimesTrainable: 1,
                            isVisible: true,
                        },
                    };
                }),
                skills: (row.skills ?? []).map((skill, skillIndex) => ({
                    id: skill.id !== 0 ? skill.id : -(skillIndex + 1),
                    characterCompanionId: id,
                    skillId: skill.skillId,
                    skillSubId: skill.skillSubId ?? null,
                    ranks: skill.ranks,
                })),
                feats: (row.feats ?? []).map((feat, featIndex) => ({
                    id: feat.id !== 0 ? feat.id : -(featIndex + 1),
                    characterCompanionId: id,
                    featId: feat.featId,
                    notes: feat.notes ?? null,
                })),
            };
        });
    },

    mergeAssignedSkillsAndFeats(
        block: CompanionComputedStatBlock,
        assignedSkills: CharacterCompanionSkillInput[],
        assignedFeats: CharacterCompanionFeatInput[]
    ): void {
        if (!block.skills) {
            block.skills = [];
        }
        if (!block.feats) {
            block.feats = [];
        }
        for (const assigned of assignedSkills) {
            const existing = block.skills.find(
                (s) => s.skillId === assigned.skillId && (s.skillSubId ?? null) === (assigned.skillSubId ?? null)
            );
            if (existing) {
                existing.ranks = (existing.ranks ?? 0) + assigned.ranks;
            } else {
                block.skills.push({
                    id: SYNTHETIC_ID_BASE + block.skills.length,
                    skillId: assigned.skillId,
                    skillSubId: assigned.skillSubId ?? null,
                    ranks: assigned.ranks,
                    notes: null,
                });
            }
        }

        for (const assigned of assignedFeats) {
            const alreadyHas = block.feats.some((f) => f.featId === assigned.featId);
            if (!alreadyHas) {
                block.feats.push({
                    id: SYNTHETIC_ID_BASE + block.feats.length,
                    featId: assigned.featId,
                    notes: assigned.notes ?? null,
                });
            }
        }
    },
};

/**
 * Sums class levels from advancement rows, including gestalt secondary classes.
 */
export function classLevelsFromAdvancements(
    advancements: Array<{ classId: number; secondaryClassId: number | null }>
): Map<number, number> {
    const classLevels = new Map<number, number>();
    for (const adv of advancements) {
        if (adv.classId) {
            classLevels.set(adv.classId, (classLevels.get(adv.classId) ?? 0) + 1);
        }
        if (adv.secondaryClassId) {
            classLevels.set(adv.secondaryClassId, (classLevels.get(adv.secondaryClassId) ?? 0) + 1);
        }
    }
    return classLevels;
}
