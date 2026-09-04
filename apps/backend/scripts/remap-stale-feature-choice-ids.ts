/**
 * Recreate missing Feature-choice targets and remap FeatureEntity.appliesToId
 * values left behind when those features were remapped or deleted.
 *
 * Covers:
 * - Ranger Combat Style: Archery / Two-Weapon Combat (already remapped; idempotent)
 * - Rogue Special Abilities: Crippling Strike, Defensive Roll, Improved Evasion,
 *   Opportunist, Skill Mastery, Slippery Mind (targets are missing and must be created)
 *
 *   pnpm --filter backend exec tsx scripts/remap-stale-feature-choice-ids.ts
 */

import { PrismaClient } from '@shared/prisma-client';
import { EntityAppliesToType, FeaturePrerequisiteType, FeatureSourceType } from '@shared/static-data';

const prisma = new PrismaClient();

interface ChoiceRemap {
    oldId: number;
    slug: string;
    name: string;
    description: string;
    level: number;
}

/**
 * Known stale Feature-choice IDs and the current slug/name they should resolve to.
 * Slug `improved-evasion` is already used by the animal-companion feature, so the
 * rogue option uses `rogue-improved-evasion`.
 */
const REMAPS: ChoiceRemap[] = [
    {
        oldId: 1419,
        slug: 'archery',
        name: 'Archery',
        description: 'Ranger feature for weapon style selection. This description should never be displayed as this feature is simply to provide a progression.',
        level: 2,
    },
    {
        oldId: 1422,
        slug: 'two-weapon-combat',
        name: 'Two-Weapon Combat',
        description: 'Two-Weapon combat Ranger fighting style feature. This description should never be displayed as this feature is simply to hold the feat grant progressions.',
        level: 2,
    },
    {
        oldId: 1425,
        slug: 'crippling-strike',
        name: 'Crippling Strike',
        description: '*Crippling Strike (Ex):* A rogue with this ability can sneak attack opponents with such precision that her blows weaken and hamper them. An opponent damaged by one of her sneak attacks also takes 2 points of Strength damage. Ability points lost to damage return on their own at the rate of 1 point per day for each damaged ability.',
        level: 10,
    },
    {
        oldId: 1428,
        slug: 'defensive-roll',
        name: 'Defensive Roll',
        description: '*Defensive Roll (Ex):* The rogue can roll with a potentially lethal blow to take less damage from it than she otherwise would. Once per day, when she would be reduced to 0 or fewer hit points by damage in combat (from a weapon or other blow, not a spell or special ability), the rogue can attempt to roll with the damage. To use this ability, the rogue must attempt a Reflex saving throw (DC = damage dealt). If the save succeeds, she takes only half damage from the blow; if it fails, she takes full damage. She must be aware of the attack and able to react to it in order to execute her defensive roll — if she is denied her Dexterity bonus to AC, she can’t use this ability. Since this effect would not normally allow a character to make a Reflex save for half damage, the rogue’s evasion ability does not apply to the defensive roll.',
        level: 10,
    },
    {
        oldId: 1431,
        slug: 'rogue-improved-evasion',
        name: 'Improved Evasion',
        description: '*Improved Evasion (Ex):* This ability works like evasion, except that while the rogue still takes no damage on a successful Reflex saving throw against attacks such as a dragon’s breath weapon or a fireball, henceforth she takes only half damage on a failed save. A helpless rogue (such as one who is unconscious or paralysed) does not gain the benefit of improved evasion.',
        level: 10,
    },
    {
        oldId: 1434,
        slug: 'opportunist',
        name: 'Opportunist',
        description: '*Opportunist (Ex):* Once per round, the rogue can make an attack of opportunity against an opponent who has just been struck for damage in melee by another character. This attack counts as the rogue’s attack of opportunity for that round. Even a rogue with the Combat Reflexes feat can’t use the opportunist ability more than once per round.',
        level: 10,
    },
    {
        oldId: 1437,
        slug: 'skill-mastery',
        name: 'Skill Mastery',
        description: '*Skill Mastery:* The rogue becomes so certain in the use of certain skills that she can use them reliably even under adverse conditions. Upon gaining this ability, she selects a number of skills equal to 3 + her Intelligence modifier. When making a skill check with one of these skills, she may take 10 even if stress and distractions would normally prevent her from doing so. A rogue may gain this special ability multiple times, selecting additional skills for it to apply to each time.',
        level: 10,
    },
    {
        oldId: 1440,
        slug: 'slippery-mind',
        name: 'Slippery Mind',
        description: '*Slippery Mind (Ex):* This ability represents the rogue’s ability to wriggle free from magical effects that would otherwise control or compel her. If a rogue with slippery mind is affected by an enchantment spell or effect and fails her saving throw, she can attempt it again 1 round later at the same DC. She gets only this one extra chance to succeed on her saving throw.',
        level: 10,
    },
];

/**
 * Ensure the target Feature exists (create if missing) and return its id.
 */
async function resolveTargetFeature(remap: ChoiceRemap): Promise<number> {
    const existing = await prisma.feature.findUnique({
        where: { slug: remap.slug },
        select: { id: true, name: true },
    });
    if (existing) {
        console.log(`  Target ${remap.slug} already exists as Feature ${existing.id} (${existing.name}).`);
        return existing.id;
    }

    const created = await prisma.feature.create({
        data: {
            slug: remap.slug,
            name: remap.name,
            description: remap.description,
            displayInCharacterSheet: true,
            sourceType: FeatureSourceType.Class,
            level: remap.level,
        },
        select: { id: true },
    });
    console.log(`  Created Feature ${created.id} ${remap.slug} (${remap.name}).`);
    return created.id;
}

/**
 * Rewrite FeatureEntity and CharacterFeatureChoice rows that still point at oldId.
 */
async function remapPointers(oldId: number, newId: number): Promise<void> {
    const entityResult = await prisma.featureEntity.updateMany({
        where: {
            appliesTo: EntityAppliesToType.Feature,
            appliesToId: oldId,
        },
        data: { appliesToId: newId },
    });
    const choiceResult = await prisma.characterFeatureChoice.updateMany({
        where: { appliesToId: oldId },
        data: { appliesToId: newId },
    });
    const prereqResult = await prisma.featurePrerequisite.updateMany({
        where: {
            type: FeaturePrerequisiteType.ClassFeature,
            appliesToId: oldId,
        },
        data: { appliesToId: newId },
    });
    console.log(`  Remapped ${oldId} -> ${newId}: ${entityResult.count} FeatureEntity, ${choiceResult.count} CharacterFeatureChoice, ${prereqResult.count} FeaturePrerequisite.`);
}

/**
 * Report Feature-choice entities that still point at a missing Feature.
 */
async function reportRemainingStalePointers(): Promise<void> {
    const featurePointers = await prisma.featureEntity.findMany({
        where: {
            appliesTo: EntityAppliesToType.Feature,
            appliesToId: { not: null },
        },
        select: {
            id: true,
            featureId: true,
            appliesToId: true,
            feature: { select: { name: true } },
        },
    });

    const targetIds = [...new Set(
        featurePointers
            .map(pointer => pointer.appliesToId)
            .filter((id): id is number => id !== null)
    )];
    const existingTargets = await prisma.feature.findMany({
        where: { id: { in: targetIds } },
        select: { id: true },
    });
    const existingIds = new Set(existingTargets.map(target => target.id));
    const stale = featurePointers.filter(
        pointer => pointer.appliesToId !== null && !existingIds.has(pointer.appliesToId)
    );

    if (stale.length === 0) {
        console.log('\nNo remaining stale Feature-choice pointers.');
        return;
    }

    console.log(`\nRemaining stale Feature-choice pointers: ${stale.length}`);
    for (const pointer of stale) {
        console.log(`  FeatureEntity ${pointer.id} on "${pointer.feature.name}" (${pointer.featureId}) -> missing Feature ${pointer.appliesToId}`);
    }
}

async function main(): Promise<void> {
    console.log('Remapping stale Feature-choice appliesToId values.\n');

    for (const remap of REMAPS) {
        console.log(`${remap.name} (old ${remap.oldId}, slug ${remap.slug})`);
        const newId = await resolveTargetFeature(remap);
        await remapPointers(remap.oldId, newId);
    }

    await reportRemainingStalePointers();
    console.log('\nDone.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
