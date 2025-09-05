import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

// Magic numbers from the old FeatureSpecialEffectType enum (now removed)
const OLD_EFFECT_TYPE = {
    Proficiency: 0,        // ClassProficiency effects
    WeaponFamiliarity: 7,  // WeaponFamiliarity effects
} as const;

// Magic numbers from ModifierType enum
const MODIFIER_TYPE = {
    Other: 3,              // ModifierType.Other
} as const;

// Magic numbers from ModifierAppliesToType enum
const MODIFIER_APPLIES_TO = {
    Skill: 1,              // ModifierAppliesToType.Skill (for weapon proficiency)
    Feat: 21,              // ModifierAppliesToType.Feat (for class proficiency)
} as const;

async function migrateFeatureSpecialEffects() {
    console.log('Starting FeatureSpecialEffect migration...');

    // 1. Migrate ClassProficiency effects
    const proficiencyEffects = await prisma.featureSpecialEffect.findMany({
        where: { effectType: OLD_EFFECT_TYPE.Proficiency },
        include: { featureProgression: true }
    });

    console.log(`Found ${proficiencyEffects.length} proficiency effects to migrate`);

    for (const effect of proficiencyEffects) {
        // Create new FeatureModifier
        await prisma.featureModifier.create({
            data: {
                progressionId: effect.progressionId,
                type: MODIFIER_TYPE.Other,
                value: 0,
                bonusType: null,
                appliesTo: MODIFIER_APPLIES_TO.Feat,
                appliesToId: effect.featId,
                itemId: effect.itemId,
                groupingId: effect.groupingId,
            }
        });

        console.log(`Migrated proficiency effect ${effect.id} for progression ${effect.progressionId}`);
    }

    // 2. Migrate WeaponFamiliarity effects
    const weaponFamiliarityEffects = await prisma.featureSpecialEffect.findMany({
        where: { effectType: OLD_EFFECT_TYPE.WeaponFamiliarity },
        include: { featureProgression: true }
    });

    console.log(`Found ${weaponFamiliarityEffects.length} weapon familiarity effects to migrate`);

    for (const effect of weaponFamiliarityEffects) {
        // Create new FeatureModifier
        await prisma.featureModifier.create({
            data: {
                progressionId: effect.progressionId,
                type: MODIFIER_TYPE.Other,
                value: 0,
                bonusType: null,
                appliesTo: MODIFIER_APPLIES_TO.Skill,
                appliesToId: effect.itemId,
                itemId: null,
                groupingId: effect.groupingId,
            }
        });

        console.log(`Migrated weapon familiarity effect ${effect.id} for progression ${effect.progressionId}`);
    }

    // 3. Delete old FeatureSpecialEffect records
    const deletedCount = await prisma.featureSpecialEffect.deleteMany({
        where: {
            effectType: { in: [OLD_EFFECT_TYPE.Proficiency, OLD_EFFECT_TYPE.WeaponFamiliarity] }
        }
    });

    console.log(`Deleted ${deletedCount.count} old FeatureSpecialEffect records`);
    console.log('Migration completed successfully!');
}

migrateFeatureSpecialEffects()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
