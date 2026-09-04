import {
    getCompanionNameFromCache,
    getDomainNameFromCache,
    getFeatNameFromCache,
    getFeatureNameFromCache,
    getItemNameFromCache,
    getSkillSummaryById,
    getSpellNameFromCache,
} from '@/services/cache';
import type {
    CharacterFeatureChoice,
    CharacterWithAllDetailsResponse,
    FeatureWithRelations,
} from '@shared/schema';
import {
    ABILITY_MAP,
    CREATURE_TYPES,
    EntityAppliesToType,
    EntityType,
    FAMILIAR_ALERTNESS_FEATURE_SLUG,
    FAMILIAR_ALERTNESS_REACH_REMINDER,
} from '@shared/static-data';

import type { FeatureChoiceEntityRef } from './types';

/**
 * Collect feature choices from every advancement on a persisted character.
 */
export function collectFeatureChoices(
    character: CharacterWithAllDetailsResponse
): CharacterFeatureChoice[] {
    const choices: CharacterFeatureChoice[] = [];
    for (const advancement of character.advancements) {
        if (advancement.featureChoices) {
            choices.push(...advancement.featureChoices);
        }
    }
    return choices;
}

/**
 * Resolve a saved choice to the selected entity's display name.
 *
 * Uses `CharacterFeatureChoice.appliesToId` (the player's pick), not the
 * unselected choice entity's `appliesToId`.
 */
export function resolveFeatureChoiceDisplayName(
    choice: CharacterFeatureChoice,
    entity: FeatureChoiceEntityRef | undefined
): string | null {
    if (!choice.appliesToId || !entity?.appliesTo) {
        return null;
    }

    switch (entity.appliesTo) {
        case EntityAppliesToType.AnimalCompanion:
        case EntityAppliesToType.Familiar:
            return getCompanionNameFromCache(choice.appliesToId) ?? null;
        case EntityAppliesToType.Feat: {
            const featName = getFeatNameFromCache(choice.appliesToId);
            if (!featName) {
                return null;
            }
            return formatFeatNameWithSubtype(featName, choice.appliesToSubId);
        }
        case EntityAppliesToType.Domain:
            return getDomainNameFromCache(choice.appliesToId) ?? null;
        case EntityAppliesToType.Feature:
            return getFeatureNameFromCache(choice.appliesToId) ?? null;
        case EntityAppliesToType.Skill: {
            const skill = getSkillSummaryById(choice.appliesToId);
            return skill?.name ?? null;
        }
        case EntityAppliesToType.Spell:
            return getSpellNameFromCache(choice.appliesToId) ?? null;
        case EntityAppliesToType.CreatureType:
            return CREATURE_TYPES[choice.appliesToId]?.name ?? null;
        case EntityAppliesToType.Ability:
            return ABILITY_MAP[choice.appliesToId]?.name ?? null;
        default:
            return null;
    }
}

/**
 * Append a feat subtype (weapon, school, skill) when `featSubId` is set.
 *
 * Example: `Weapon Focus (Longsword)`.
 */
export function formatFeatNameWithSubtype(
    featName: string,
    featSubId: number | null | undefined
): string {
    if (!featSubId || featSubId <= 0) {
        return featName;
    }
    const itemName = getItemNameFromCache(featSubId);
    return itemName ? `${featName} (${itemName})` : featName;
}

/**
 * Class on a shared feature that this character actually has.
 * Shared maps (Wizard + Sorcerer familiar Alertness) otherwise use the first
 * mapped class, which can label a Wizard's grant as Sorcerer Granted.
 */
export function pickFeatureClassIdForCharacter(
    classMaps: Array<{ classId: number }> | null | undefined,
    classLevelCounts: Map<number, number>
): number | null {
    const maps = classMaps ?? [];
    if (maps.length === 0) {
        return null;
    }
    const owned = maps
        .filter((row) => (classLevelCounts.get(row.classId) ?? 0) > 0)
        .sort((a, b) => (
            (classLevelCounts.get(b.classId) ?? 0) - (classLevelCounts.get(a.classId) ?? 0)
        ));
    return (owned[0] ?? maps[0]).classId;
}

/**
 * Granted-feat label, including the familiar Alertness reach reminder.
 */
export function formatGrantedFeatDisplayName(
    featName: string,
    featSubId: number | null | undefined,
    sourceFeature?: { slug: string; summary?: string | null } | null
): string {
    const baseName = formatFeatNameWithSubtype(featName, featSubId);
    if (sourceFeature?.slug !== FAMILIAR_ALERTNESS_FEATURE_SLUG) {
        return baseName;
    }
    const reminder = sourceFeature.summary?.trim() || FAMILIAR_ALERTNESS_REACH_REMINDER;
    return `${baseName} (${reminder})`;
}

/**
 * Feature title including the player's selected choices.
 *
 * Example: `Animal Companion: Dog`. Multiple selections are comma-separated.
 */
export function formatFeatureNameWithChoices(
    feature: FeatureWithRelations,
    choices: CharacterFeatureChoice[]
): string {
    const featureName = feature.name || '';
    const selected = choices.filter((choice) => choice.featureId === feature.id);
    if (selected.length === 0) {
        return featureName;
    }

    const resolvedNames = selected
        .map((choice) => {
            const entity = feature.entities?.find((item) => item.id === choice.featureEntityId);
            return resolveFeatureChoiceDisplayName(choice, entity);
        })
        .filter((name): name is string => Boolean(name));

    if (resolvedNames.length === 0) {
        return featureName;
    }

    return `${featureName}: ${resolvedNames.join(', ')}`;
}

/**
 * Master skill grant from a familiar or animal companion type-benefit feature.
 *
 * Example: `Grants +3 to Move Silently when within reach`.
 */
export function formatCompanionChoiceGrantNote(
    feature: FeatureWithRelations,
    choices: CharacterFeatureChoice[],
    resolvedProgressions: FeatureWithRelations[]
): string | null {
    const selected = choices.filter((choice) => choice.featureId === feature.id);
    const grantParts: string[] = [];
    let includesFamiliar = false;

    for (const choice of selected) {
        const entity = feature.entities?.find((item) => item.id === choice.featureEntityId);
        if (
            !entity
            || (
                entity.appliesTo !== EntityAppliesToType.Familiar
                && entity.appliesTo !== EntityAppliesToType.AnimalCompanion
            )
            || !choice.appliesToId
        ) {
            continue;
        }
        if (entity.appliesTo === EntityAppliesToType.Familiar) {
            includesFamiliar = true;
        }
        for (const companionFeature of resolvedProgressions) {
            if (companionFeature.companionId !== choice.appliesToId) {
                continue;
            }
            for (const bonusEntity of companionFeature.entities ?? []) {
                if (
                    bonusEntity.type !== EntityType.Bonus
                    || bonusEntity.appliesTo !== EntityAppliesToType.Skill
                    || bonusEntity.appliesToId == null
                    || bonusEntity.value == null
                ) {
                    continue;
                }
                const skillName = getSkillSummaryById(bonusEntity.appliesToId)?.name
                    ?? `Skill ${bonusEntity.appliesToId}`;
                const amount = bonusEntity.value;
                const signed = `${amount >= 0 ? '+' : ''}${amount}`;
                grantParts.push(`${signed} to ${skillName}`);
            }
        }
    }

    if (grantParts.length === 0) {
        return null;
    }
    const grants = `Grants ${grantParts.join(' and ')}`;
    return includesFamiliar ? `${grants} when within reach` : grants;
}

/**
 * Feature summary plus familiar/animal-companion skill grant note, if any.
 */
export function formatFeatureSummaryWithCompanionGrant(
    feature: FeatureWithRelations,
    choices: CharacterFeatureChoice[],
    resolvedProgressions: FeatureWithRelations[]
): string {
    const summary = feature.summary?.trim() ?? '';
    const grantNote = formatCompanionChoiceGrantNote(feature, choices, resolvedProgressions);
    return [summary, grantNote].filter((part): part is string => Boolean(part)).join(' ');
}
