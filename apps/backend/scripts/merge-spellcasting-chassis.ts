/**
 * Fold spellcasting-{class} ability/type entities onto the PHB "Spells" narrative
 * feature for each 3.5 PHB caster. Relinks bardspells. Unlinks the chassis from
 * every class (including variants such as Cloistered Cleric), not only the PHB id.
 *
 * Does not write the database by itself:
 *   pnpm --filter backend exec tsx scripts/merge-spellcasting-chassis.ts
 *
 * Run after split-shared-spellcasting.ts. Then run cleanup-orphan-spellcasting-features.ts.
 */

import { PrismaClient } from '@shared/prisma-client';
import { EntityAppliesToType } from '@shared/static-data';

const prisma = new PrismaClient();

interface ChassisMergeSpec {
    classId: number;
    className: string;
    narrativeSlug: string;
    chassisSlug: string;
}

const MERGES: ChassisMergeSpec[] = [
    { classId: 27, className: 'Wizard', narrativeSlug: 'wizardspells', chassisSlug: 'spellcasting-wizard' },
    { classId: 26, className: 'Sorcerer', narrativeSlug: 'sorcererspells', chassisSlug: 'spellcasting-sorcerer' },
    { classId: 19, className: 'Cleric', narrativeSlug: 'clericspells', chassisSlug: 'spellcasting-cleric' },
    { classId: 20, className: 'Druid', narrativeSlug: 'druidspells', chassisSlug: 'spellcasting-druid' },
    { classId: 23, className: 'Paladin', narrativeSlug: 'paladinspells', chassisSlug: 'spellcasting-paladin' },
    { classId: 24, className: 'Ranger', narrativeSlug: 'rangerspells', chassisSlug: 'spellcasting-ranger' },
    { classId: 18, className: 'Bard', narrativeSlug: 'bardspells', chassisSlug: 'spellcasting-bard' },
];

const CHASSIS_APPLIES_TO = [
    EntityAppliesToType.CastingAbility,
    EntityAppliesToType.CastingType,
];

/**
 * Move CastingAbility / CastingType entities onto the narrative feature and unlink the chassis.
 */
async function mergeClass(spec: ChassisMergeSpec): Promise<void> {
    const narrative = await prisma.feature.findUnique({ where: { slug: spec.narrativeSlug } });
    const chassis = await prisma.feature.findUnique({ where: { slug: spec.chassisSlug } });

    if (!narrative) {
        throw new Error(`Missing narrative feature ${spec.narrativeSlug} for ${spec.className}.`);
    }
    if (!chassis) {
        console.log(`${spec.className}: chassis ${spec.chassisSlug} already gone, ensuring ${spec.narrativeSlug} is linked.`);
        await prisma.featureClassMap.createMany({
            data: [{ featureId: narrative.id, classId: spec.classId }],
            skipDuplicates: true,
        });
        return;
    }

    await prisma.featureClassMap.createMany({
        data: [{ featureId: narrative.id, classId: spec.classId }],
        skipDuplicates: true,
    });

    const chassisEntities = await prisma.featureEntity.findMany({
        where: {
            featureId: chassis.id,
            appliesTo: { in: CHASSIS_APPLIES_TO },
        },
    });

    for (const entity of chassisEntities) {
        const existing = await prisma.featureEntity.findFirst({
            where: {
                featureId: narrative.id,
                appliesTo: entity.appliesTo,
                appliesToId: entity.appliesToId,
            },
        });

        if (existing) {
            await prisma.featureEntity.update({
                where: { id: existing.id },
                data: { displayInDetail: false },
            });
            continue;
        }

        await prisma.featureEntity.update({
            where: { id: entity.id },
            data: {
                featureId: narrative.id,
                displayInDetail: false,
            },
        });
        console.log(`  Moved appliesTo=${entity.appliesTo} appliesToId=${entity.appliesToId} onto ${spec.narrativeSlug}.`);
    }

    const unlink = await prisma.featureClassMap.deleteMany({
        where: { featureId: chassis.id },
    });
    console.log(`${spec.className}: linked ${spec.narrativeSlug}, unlinked ${spec.chassisSlug} (${unlink.count} rows).`);
}

async function main(): Promise<void> {
    console.log('Merging spellcasting chassis onto PHB Spells features...\n');

    for (const spec of MERGES) {
        await mergeClass(spec);
    }

    console.log('\nDone. Chassis Feature rows are unlinked; run cleanup-orphan-spellcasting-features.ts to delete them.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
