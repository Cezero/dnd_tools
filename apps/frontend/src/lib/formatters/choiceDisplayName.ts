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
