/**
 * Delete leftover race language and ability-adjustment features that are not
 * EntityType.Base. Canonical containers (Base + AutomaticLanguage / BonusLanguage /
 * Ability) are kept. Class language features are kept.
 *
 *   pnpm --filter backend exec tsx scripts/cleanup-legacy-race-language-ability-features.ts
 */

import { PrismaClient } from '@shared/prisma-client';
import { EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

const prisma = new PrismaClient();

const LANGUAGE_APPLIES_TO = [
    EntityAppliesToType.AutomaticLanguage,
    EntityAppliesToType.BonusLanguage,
];

const ABILITY_APPLIES_TO = [EntityAppliesToType.Ability];

interface LeftoverFeature {
    id: number;
    name: string;
    slug: string;
    raceIds: number[];
}

/**
 * True when a feature's language or ability entities exist and none of them are Base.
 */
function isLeftoverByEntities(entities: Array<{ type: number; appliesTo: number }>): boolean {
    const languageEntities = entities.filter(entity => LANGUAGE_APPLIES_TO.includes(entity.appliesTo));
    const abilityEntities = entities.filter(entity => ABILITY_APPLIES_TO.includes(entity.appliesTo));
    const leftoverLanguage = languageEntities.length > 0 && languageEntities.every(entity => entity.type !== EntityType.Base);
    const leftoverAbility = abilityEntities.length > 0 && abilityEntities.every(entity => entity.type !== EntityType.Base);
    const hasCanonical = entities.some(entity =>
        entity.type === EntityType.Base &&
        [...LANGUAGE_APPLIES_TO, ...ABILITY_APPLIES_TO].includes(entity.appliesTo)
    );
    return !hasCanonical && (leftoverLanguage || leftoverAbility);
}

/**
 * Finds race-source leftover language/ability features, including unlinked orphans.
 */
async function findLeftoverFeatures(): Promise<LeftoverFeature[]> {
    const candidates = await prisma.feature.findMany({
        where: {
            sourceType: FeatureSourceType.Race,
            featId: null,
            domainId: null,
            companionId: null,
            entities: {
                some: {
                    appliesTo: { in: [...LANGUAGE_APPLIES_TO, ...ABILITY_APPLIES_TO] },
                },
            },
        },
        select: {
            id: true,
            name: true,
            slug: true,
            classes: { select: { classId: true } },
            races: { select: { raceId: true } },
            entities: { select: { type: true, appliesTo: true } },
        },
    });

    return candidates
        .filter(feature => feature.classes.length === 0 && isLeftoverByEntities(feature.entities))
        .map(feature => ({
            id: feature.id,
            name: feature.name,
            slug: feature.slug,
            raceIds: feature.races.map(race => race.raceId),
        }));
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

    const entityIds = entities.map(entity => entity.id);
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
            .map(entity => entity.formulaParamsId)
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

async function main(): Promise<void> {
    const leftovers = await findLeftoverFeatures();
    console.log(`Found ${leftovers.length} leftover race language/ability Feature rows.\n`);

    for (const leftover of leftovers) {
        const raceLabel = leftover.raceIds.length > 0 ? leftover.raceIds.join(',') : 'unlinked';
        console.log(`  ${leftover.id}  ${leftover.slug}  (${leftover.name})  races=[${raceLabel}]`);
    }

    if (leftovers.length === 0) {
        console.log('Nothing to delete.');
        return;
    }

    const leftoverIds = leftovers.map(leftover => leftover.id);

    const stillClassLinked = await prisma.featureClassMap.findMany({
        where: { featureId: { in: leftoverIds } },
        select: { featureId: true },
    });
    if (stillClassLinked.length > 0) {
        throw new Error('Refusing to delete: leftover set includes FeatureClassMap links.');
    }

    const entityCount = await deleteEntities(leftoverIds);
    console.log(`\nDeleted ${entityCount} FeatureEntity rows.`);

    await prisma.featureRaceMap.deleteMany({ where: { featureId: { in: leftoverIds } } });
    await prisma.featurePrerequisite.deleteMany({ where: { featureId: { in: leftoverIds } } });
    await prisma.featureCondition.deleteMany({ where: { featureId: { in: leftoverIds } } });
    await prisma.characterFeatureChoice.deleteMany({ where: { featureId: { in: leftoverIds } } });
    await prisma.characterFeatureUses.deleteMany({ where: { featureId: { in: leftoverIds } } });
    await prisma.transformationFormEligibility.deleteMany({ where: { featureId: { in: leftoverIds } } });

    const deleted = await prisma.feature.deleteMany({
        where: { id: { in: leftoverIds } },
    });
    console.log(`Deleted ${deleted.count} Feature rows.`);
    console.log('\nDone. Canonical Base language/ability features and class language features were kept.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
