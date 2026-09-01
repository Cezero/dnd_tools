/**
 * Migrate Wizard (classId 27) spell slots to FeatureEntity + FeatureFormulaParams model.
 *
 * Creates or updates a spellcasting feature for Wizard with one entity per spell level 1–9
 * using SPELL_SLOTS_TRIANGULAR (Wizard progression: 1,2,2,3,3,3,4,... with cap 5 for 1st–8th, 2 for 9th).
 *
 * Usage (from repo root):
 *   pnpm --filter backend exec tsx scripts/migrate-wizard-spellcasting-formulas.ts
 *
 * Or from apps/backend:
 *   npx tsx scripts/migrate-wizard-spellcasting-formulas.ts
 */

import { PrismaClient } from '@shared/prisma-client';
import { EntityType, EntityAppliesToType, FeatureSourceType } from '@shared/static-data';
import { FormulaId } from '@shared/static-data';

const WIZARD_CLASS_ID = 27;

/** D&D 3.5 Wizard: class level when each spell level is first gained (1st at 1, 2nd at 3, ..., 9th at 17). */
const SPELL_LEVEL_TO_START_LEVEL: Record<number, number> = {
    1: 1,
    2: 3,
    3: 5,
    4: 7,
    5: 9,
    6: 11,
    7: 13,
    8: 15,
    9: 17,
};

/** Max slots per day per spell level (PHB wizard table). */
const SPELL_LEVEL_TO_CAP: Record<number, number> = {
    1: 5,
    2: 5,
    3: 5,
    4: 5,
    5: 5,
    6: 5,
    7: 5,
    8: 5,
    9: 2,
};

const prisma = new PrismaClient();

async function main(): Promise<void> {
    console.log(`Migrating Wizard (classId ${WIZARD_CLASS_ID}) spell slots to formula-based FeatureEntities...\n`);

    const featureId = await resolveOrCreateWizardSpellcastingFeature();
    console.log(`Using feature id ${featureId} for Wizard spellcasting.\n`);

    for (let spellLevel = 1; spellLevel <= 9; spellLevel++) {
        const startLevel = SPELL_LEVEL_TO_START_LEVEL[spellLevel];
        const cap = SPELL_LEVEL_TO_CAP[spellLevel];

        const existing = await prisma.featureEntity.findFirst({
            where: {
                featureId,
                appliesTo: EntityAppliesToType.SpellcastingProgression,
                appliesToId: spellLevel,
            },
            include: { formulaParams: true },
        });

        if (existing?.formulaParams?.formulaId === FormulaId.SPELL_SLOTS_TRIANGULAR) {
            const fp = existing.formulaParams;
            if (
                fp.formulaStartLevel === startLevel &&
                fp.baseValue === 1 &&
                existing.value === cap
            ) {
                console.log(`  Spell level ${spellLevel}: already configured (start=${startLevel}, cap=${cap}), skipping.`);
                continue;
            }
        }

        let formulaParamsId: number;
        if (existing?.formulaParamsId) {
            await prisma.featureFormulaParams.update({
                where: { id: existing.formulaParamsId },
                data: {
                    formulaId: FormulaId.SPELL_SLOTS_TRIANGULAR,
                    formulaStartLevel: startLevel,
                    baseValue: 1,
                },
            });
            formulaParamsId = existing.formulaParamsId;
            console.log(`  Spell level ${spellLevel}: updated formula params id ${formulaParamsId} (start=${startLevel}, cap=${cap}).`);
        } else {
            const created = await prisma.featureFormulaParams.create({
                data: {
                    formulaId: FormulaId.SPELL_SLOTS_TRIANGULAR,
                    formulaStartLevel: startLevel,
                    baseValue: 1,
                },
            });
            formulaParamsId = created.id;
            console.log(`  Spell level ${spellLevel}: created formula params id ${formulaParamsId} (start=${startLevel}, cap=${cap}).`);
        }

        if (existing) {
            await prisma.featureEntity.update({
                where: { id: existing.id },
                data: {
                    formulaParamsId,
                    value: cap,
                    type: EntityType.Base,
                    appliesTo: EntityAppliesToType.SpellcastingProgression,
                    appliesToId: spellLevel,
                },
            });
            console.log(`    Updated entity id ${existing.id}.`);
        } else {
            const entity = await prisma.featureEntity.create({
                data: {
                    featureId,
                    appliesTo: EntityAppliesToType.SpellcastingProgression,
                    appliesToId: spellLevel,
                    formulaParamsId,
                    groupingId: 0,
                    type: EntityType.Base,
                    value: cap,
                    displayInDetail: true,
                },
            });
            console.log(`    Created entity id ${entity.id}.`);
        }
    }

    console.log('\nDone. Wizard spell slots are now driven by FeatureEntity + SPELL_SLOTS_TRIANGULAR.');
}

/**
 * Find a feature linked to Wizard that represents spellcasting (has SpellcastingLink or spell-slot entities),
 * or create a new one and link it to the class.
 */
async function resolveOrCreateWizardSpellcastingFeature(): Promise<number> {
    const classFeatures = await prisma.featureClassMap.findMany({
        where: { classId: WIZARD_CLASS_ID },
        select: { featureId: true },
    });
    const featureIds = classFeatures.map((c) => c.featureId);

    if (featureIds.length === 0) {
        return await createWizardSpellcastingFeature();
    }

    const featuresWithEntities = await prisma.feature.findMany({
        where: { id: { in: featureIds } },
        include: {
            spellcasting: true,
            entities: {
                where: {
                    appliesTo: EntityAppliesToType.SpellcastingProgression,
                    appliesToId: { not: null },
                },
            },
        },
    });

    const withSpellcasting = featuresWithEntities.find(
        (f) => f.spellcasting != null || (f.entities && f.entities.length > 0)
    );
    if (withSpellcasting) {
        return withSpellcasting.id;
    }

    return await createWizardSpellcastingFeature();
}

async function createWizardSpellcastingFeature(): Promise<number> {
    const slugBase = 'wizard-spellcasting';
    let slug = slugBase;
    let n = 0;
    while (await prisma.feature.findUnique({ where: { slug } })) {
        n += 1;
        slug = `${slugBase}-${n}`;
    }

    const feature = await prisma.feature.create({
        data: {
            slug,
            name: 'Wizard Spellcasting',
            description: 'Spell slots per day for the Wizard class (formula-based).',
            sourceType: FeatureSourceType.Class,
            level: 1,
            displayInCharacterSheet: true,
        },
    });

    await prisma.featureClassMap.create({
        data: { featureId: feature.id, classId: WIZARD_CLASS_ID },
    });

    console.log(`Created new spellcasting feature: id=${feature.id}, slug=${slug}.`);
    return feature.id;
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
