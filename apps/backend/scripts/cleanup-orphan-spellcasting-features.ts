/**
 * Delete leftover per-level spellcasting Feature copies and unlinked
 * spellcasting-{class} chassis rows after split + merge.
 *
 * Keeps:
 *   - *spells narrative features (wizardspells, clericspells, …)
 *   - shared table features (*-spells-per-day, *-spells-known, divine-*, half-caster-*)
 *
 *   pnpm --filter backend exec tsx scripts/cleanup-orphan-spellcasting-features.ts
 */

import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

const COPY_SLUG_PREFIXES = [
    'spellcasting-wizard-',
    'spellcasting-sorcerer-',
    'spellcasting-cleric-',
    'spellcasting-druid-',
    'spellcasting-paladin-',
    'spellcasting-ranger-',
    'spellcasting-bard-',
    'spellcasting-spells-known-bard',
];

const CHASSIS_SLUGS = [
    'spellcasting-wizard',
    'spellcasting-sorcerer',
    'spellcasting-cleric',
    'spellcasting-druid',
    'spellcasting-paladin',
    'spellcasting-ranger',
    'spellcasting-bard',
];

/**
 * Leftover numbered copies plus unlinked chassis stubs.
 */
async function findOrphanIds(): Promise<number[]> {
    const copies = await prisma.feature.findMany({
        where: {
            OR: [
                ...COPY_SLUG_PREFIXES.map((prefix) => ({ slug: { startsWith: prefix } })),
                { slug: { in: CHASSIS_SLUGS } },
            ],
        },
        select: { id: true, slug: true },
    });

    return copies.map((copy) => copy.id);
}

/**
 * Delete FeatureEntity rows and unused FeatureFormulaParams.
 */
async function deleteEntities(featureIds: number[]): Promise<number> {
    const entities = await prisma.featureEntity.findMany({
        where: { featureId: { in: featureIds } },
        select: { id: true, formulaParamsId: true },
    });

    if (entities.length === 0) {
        return 0;
    }

    const entityIds = entities.map((entity) => entity.id);
    await prisma.featureEntityCondition.deleteMany({
        where: { featureEntityId: { in: entityIds } },
    });
    await prisma.characterFeatureChoice.deleteMany({
        where: { featureEntityId: { in: entityIds } },
    });
    await prisma.characterFeatureUses.deleteMany({
        where: { featureEntityId: { in: entityIds } },
    });
    await prisma.featureEntity.deleteMany({
        where: { id: { in: entityIds } },
    });

    const formulaParamsIds = [...new Set(
        entities
            .map((entity) => entity.formulaParamsId)
            .filter((id): id is number => id !== null)
    )];

    for (const formulaParamsId of formulaParamsIds) {
        const remaining = await prisma.featureEntity.count({
            where: { formulaParamsId },
        });
        if (remaining === 0) {
            await prisma.featureFormulaParams.delete({ where: { id: formulaParamsId } });
        }
    }

    return entities.length;
}

/**
 * Delete SpellcastingProgression + slots still pointing at these features.
 */
async function deleteProgressions(featureIds: number[]): Promise<number> {
    const progressions = await prisma.spellcastingProgression.findMany({
        where: { featureId: { in: featureIds } },
        select: { id: true },
    });

    if (progressions.length === 0) {
        return 0;
    }

    const progressionIds = progressions.map((progression) => progression.id);
    await prisma.spellcastingLink.deleteMany({
        where: { progressionId: { in: progressionIds } },
    });
    await prisma.spellcastingSlot.deleteMany({
        where: { progressionId: { in: progressionIds } },
    });
    await prisma.spellcastingProgression.deleteMany({
        where: { id: { in: progressionIds } },
    });

    return progressions.length;
}

async function main(): Promise<void> {
    const orphanIds = await findOrphanIds();
    console.log(`Found ${orphanIds.length} leftover spellcasting Feature rows.\n`);

    if (orphanIds.length === 0) {
        console.log('Nothing to delete.');
        return;
    }

    const stillLinked = await prisma.featureClassMap.findMany({
        where: { featureId: { in: orphanIds } },
        select: { featureId: true, classId: true },
    });
    if (stillLinked.length > 0) {
        const ids = [...new Set(stillLinked.map((row) => row.featureId))];
        throw new Error(`Refusing to delete: ${ids.length} features are still linked via FeatureClassMap. Run merge-spellcasting-chassis.ts first.`);
    }

    const entityCount = await deleteEntities(orphanIds);
    console.log(`Deleted ${entityCount} FeatureEntity rows.`);

    const progressionCount = await deleteProgressions(orphanIds);
    console.log(`Deleted ${progressionCount} SpellcastingProgression rows.`);

    await prisma.spellcastingLink.deleteMany({ where: { featureId: { in: orphanIds } } });
    await prisma.featureRaceMap.deleteMany({ where: { featureId: { in: orphanIds } } });
    await prisma.featurePrerequisite.deleteMany({ where: { featureId: { in: orphanIds } } });
    await prisma.featureCondition.deleteMany({ where: { featureId: { in: orphanIds } } });
    await prisma.characterFeatureChoice.deleteMany({ where: { featureId: { in: orphanIds } } });
    await prisma.characterFeatureUses.deleteMany({ where: { featureId: { in: orphanIds } } });
    await prisma.transformationFormEligibility.deleteMany({ where: { featureId: { in: orphanIds } } });

    const deleted = await prisma.feature.deleteMany({
        where: { id: { in: orphanIds } },
    });
    console.log(`Deleted ${deleted.count} Feature rows.`);
    console.log('\nDone. Narrative *spells features and shared tables were kept.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
