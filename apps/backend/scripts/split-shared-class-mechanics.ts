/**
 * Split class-mechanics containers into reusable atomic features.
 *
 * - Creates shared BAB features (good/average/poor) and links all 3.5 PHB classes.
 * - Creates save / hit-die / skill-point features and links Wizard + Sorcerer.
 * - Removes BAB entities from remaining 3.5 PHB class-mechanics containers.
 * - Unlinks Wizard/Sorcerer from class-mechanics-21359 (and dummy class-mechanics).
 *
 * Does not migrate the database by itself. Run after reviewing:
 *   pnpm --filter backend exec tsx scripts/split-shared-class-mechanics.ts
 *
 * Or from apps/backend:
 *   npx tsx scripts/split-shared-class-mechanics.ts
 */

import { PrismaClient } from '@shared/prisma-client';
import {
    EntityAppliesToType,
    EntityType,
    FeatureSourceType,
    FormulaId,
    RpgDice,
    SavingThrowId,
} from '@shared/static-data';

const prisma = new PrismaClient();

const WIZARD_CLASS_ID = 27;
const SORCERER_CLASS_ID = 26;

const GOOD_BAB_CLASS_IDS = [17, 21, 23, 24];
const AVERAGE_BAB_CLASS_IDS = [18, 19, 20, 22, 25];
const POOR_BAB_CLASS_IDS = [SORCERER_CLASS_ID, WIZARD_CLASS_ID];

const MECHANICS_CONTAINERS_WITH_BAB = [21338, 21344, 21347, 21350, 21353, 21356, 21359];
const DUMMY_CLASS_MECHANICS_ID = 21329;
const WIZARD_SORCERER_CONTAINER_ID = 21359;

interface FormulaSpec {
    formulaId: number;
    divisor?: number;
    baseValue?: number;
}

interface AtomicFeatureSpec {
    slug: string;
    name: string;
    description: string;
    appliesTo: number;
    appliesToId: number | null;
    value: number | null;
    formula?: FormulaSpec;
    classIds: number[];
}

const ATOMIC_FEATURES: AtomicFeatureSpec[] = [
    {
        slug: 'good-bab',
        name: 'Good Base Attack Bonus',
        description: 'Good BAB progression: +1 per class level.',
        appliesTo: EntityAppliesToType.BaseAttackBonus,
        appliesToId: null,
        value: 1,
        formula: { formulaId: FormulaId.LINEAR_SCALING },
        classIds: GOOD_BAB_CLASS_IDS,
    },
    {
        slug: 'average-bab',
        name: 'Average Base Attack Bonus',
        description: 'Average BAB progression: floor(level × 0.75).',
        appliesTo: EntityAppliesToType.BaseAttackBonus,
        appliesToId: null,
        value: 0.75,
        formula: { formulaId: FormulaId.LEVEL_TIMES_VALUE },
        classIds: AVERAGE_BAB_CLASS_IDS,
    },
    {
        slug: 'poor-bab',
        name: 'Poor Base Attack Bonus',
        description: 'Poor BAB progression: floor(level × 0.5).',
        appliesTo: EntityAppliesToType.BaseAttackBonus,
        appliesToId: null,
        value: 0.5,
        formula: { formulaId: FormulaId.LEVEL_TIMES_VALUE },
        classIds: POOR_BAB_CLASS_IDS,
    },
    {
        slug: 'good-will-save',
        name: 'Good Will Save',
        description: 'Good Will save progression: floor(level / 2) + 2.',
        appliesTo: EntityAppliesToType.SavingThrow,
        appliesToId: SavingThrowId.Will,
        value: null,
        formula: { formulaId: FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE, divisor: 2, baseValue: 2 },
        classIds: [SORCERER_CLASS_ID, WIZARD_CLASS_ID],
    },
    {
        slug: 'bad-will-save',
        name: 'Poor Will Save',
        description: 'Poor Will save progression: floor(level / 3).',
        appliesTo: EntityAppliesToType.SavingThrow,
        appliesToId: SavingThrowId.Will,
        value: null,
        formula: { formulaId: FormulaId.LEVEL_DIVIDED_BY, divisor: 3 },
        classIds: [],
    },
    {
        slug: 'good-fort-save',
        name: 'Good Fortitude Save',
        description: 'Good Fortitude save progression: floor(level / 2) + 2.',
        appliesTo: EntityAppliesToType.SavingThrow,
        appliesToId: SavingThrowId.Fortitude,
        value: null,
        formula: { formulaId: FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE, divisor: 2, baseValue: 2 },
        classIds: [],
    },
    {
        slug: 'bad-fort-save',
        name: 'Poor Fortitude Save',
        description: 'Poor Fortitude save progression: floor(level / 3).',
        appliesTo: EntityAppliesToType.SavingThrow,
        appliesToId: SavingThrowId.Fortitude,
        value: null,
        formula: { formulaId: FormulaId.LEVEL_DIVIDED_BY, divisor: 3 },
        classIds: [SORCERER_CLASS_ID, WIZARD_CLASS_ID],
    },
    {
        slug: 'good-ref-save',
        name: 'Good Reflex Save',
        description: 'Good Reflex save progression: floor(level / 2) + 2.',
        appliesTo: EntityAppliesToType.SavingThrow,
        appliesToId: SavingThrowId.Reflex,
        value: null,
        formula: { formulaId: FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE, divisor: 2, baseValue: 2 },
        classIds: [],
    },
    {
        slug: 'bad-ref-save',
        name: 'Poor Reflex Save',
        description: 'Poor Reflex save progression: floor(level / 3).',
        appliesTo: EntityAppliesToType.SavingThrow,
        appliesToId: SavingThrowId.Reflex,
        value: null,
        formula: { formulaId: FormulaId.LEVEL_DIVIDED_BY, divisor: 3 },
        classIds: [SORCERER_CLASS_ID, WIZARD_CLASS_ID],
    },
    {
        slug: 'hit-die-d4',
        name: 'Hit Die d4',
        description: 'Class hit die of d4.',
        appliesTo: EntityAppliesToType.HitDice,
        appliesToId: RpgDice.D4,
        value: 0,
        classIds: [SORCERER_CLASS_ID, WIZARD_CLASS_ID],
    },
    {
        slug: 'skill-points-2',
        name: 'Skill Points 2',
        description: '2 skill points per class level (plus Intelligence modifier).',
        appliesTo: EntityAppliesToType.SkillPoints,
        appliesToId: null,
        value: 2,
        classIds: [SORCERER_CLASS_ID, WIZARD_CLASS_ID],
    },
];

/**
 * Create or reuse an atomic mechanics feature and ensure its entity, formula, and class links.
 */
async function upsertAtomicFeature(spec: AtomicFeatureSpec): Promise<number> {
    let feature = await prisma.feature.findUnique({ where: { slug: spec.slug } });

    if (!feature) {
        feature = await prisma.feature.create({
            data: {
                slug: spec.slug,
                name: spec.name,
                description: spec.description,
                displayInCharacterSheet: false,
                sourceType: FeatureSourceType.Class,
                level: 1,
            },
        });
        console.log(`Created feature ${spec.slug} (id ${feature.id}).`);
    } else {
        console.log(`Reusing feature ${spec.slug} (id ${feature.id}).`);
    }

    let entity = await prisma.featureEntity.findFirst({
        where: {
            featureId: feature.id,
            appliesTo: spec.appliesTo,
            appliesToId: spec.appliesToId,
        },
        include: { formulaParams: true },
    });

    let formulaParamsId: number | null = entity?.formulaParamsId ?? null;

    if (spec.formula) {
        if (formulaParamsId) {
            await prisma.featureFormulaParams.update({
                where: { id: formulaParamsId },
                data: {
                    formulaId: spec.formula.formulaId,
                    divisor: spec.formula.divisor ?? null,
                    baseValue: spec.formula.baseValue ?? null,
                    includeProgressionLevel: true,
                    featureLevelZero: false,
                },
            });
        } else {
            const createdParams = await prisma.featureFormulaParams.create({
                data: {
                    formulaId: spec.formula.formulaId,
                    divisor: spec.formula.divisor ?? null,
                    baseValue: spec.formula.baseValue ?? null,
                    includeProgressionLevel: true,
                    featureLevelZero: false,
                },
            });
            formulaParamsId = createdParams.id;
        }
    }

    if (entity) {
        await prisma.featureEntity.update({
            where: { id: entity.id },
            data: {
                type: EntityType.Base,
                appliesTo: spec.appliesTo,
                appliesToId: spec.appliesToId,
                value: spec.value,
                formulaParamsId,
                displayInDetail: false,
            },
        });
    } else {
        await prisma.featureEntity.create({
            data: {
                featureId: feature.id,
                type: EntityType.Base,
                appliesTo: spec.appliesTo,
                appliesToId: spec.appliesToId,
                value: spec.value,
                formulaParamsId,
                groupingId: 0,
                displayInDetail: false,
            },
        });
        console.log(`  Created entity for ${spec.slug}.`);
    }

    if (spec.classIds.length > 0) {
        await prisma.featureClassMap.createMany({
            data: spec.classIds.map((classId) => ({
                featureId: feature.id,
                classId,
            })),
            skipDuplicates: true,
        });
        console.log(`  Linked ${spec.slug} to class IDs: ${spec.classIds.join(', ')}.`);
    }

    return feature.id;
}

/**
 * Delete BAB entities (and unused formula params) from leftover class-mechanics containers.
 */
async function removeContainerBabEntities(): Promise<void> {
    const babEntities = await prisma.featureEntity.findMany({
        where: {
            featureId: { in: MECHANICS_CONTAINERS_WITH_BAB },
            appliesTo: EntityAppliesToType.BaseAttackBonus,
        },
    });

    for (const entity of babEntities) {
        const formulaParamsId = entity.formulaParamsId;
        await prisma.featureEntity.delete({ where: { id: entity.id } });
        console.log(`Removed BAB entity ${entity.id} from feature ${entity.featureId}.`);

        if (formulaParamsId !== null) {
            const remaining = await prisma.featureEntity.count({
                where: { formulaParamsId },
            });
            if (remaining === 0) {
                await prisma.featureFormulaParams.delete({ where: { id: formulaParamsId } });
            }
        }
    }
}

/**
 * Unlink Wizard and Sorcerer from the old mechanics containers.
 */
async function unlinkWizardSorcererContainers(): Promise<void> {
    const result = await prisma.featureClassMap.deleteMany({
        where: {
            featureId: { in: [WIZARD_SORCERER_CONTAINER_ID, DUMMY_CLASS_MECHANICS_ID] },
            classId: { in: [SORCERER_CLASS_ID, WIZARD_CLASS_ID] },
        },
    });
    console.log(`Unlinked Wizard/Sorcerer from old mechanics containers (${result.count} rows).`);
}

async function main(): Promise<void> {
    console.log('Splitting shared class mechanics into atomic features...\n');

    for (const spec of ATOMIC_FEATURES) {
        await upsertAtomicFeature(spec);
    }

    console.log('');
    await removeContainerBabEntities();
    await unlinkWizardSorcererContainers();

    console.log('\nDone. Review Wizard/Sorcerer and one class per BAB track before using in play.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
