import { useCallback } from 'react';

import { getClassNameFromCache, getDomainSelectByEdition } from '@/services/cache';
import type { FeatureWithRelations, FeatureEntity, PendingChoice } from '@shared/schema';
import { EntityType, EntityAppliesToType, ENTITY_APPLIES_TO_TYPES } from '@shared/static-data';

/**
 * React hook for resolving character choices
 */
export function useChoiceResolver() {
    /**
     * Identify pending choices from feature features
     */
    const identifyPendingChoices = useCallback((features: FeatureWithRelations[], editionId?: number): PendingChoice[] => {
        const choices: PendingChoice[] = [];

        for (const feature of features) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.type === EntityType.Choice) {
                        const choice = createPendingChoice(entity, feature, editionId);
                        if (choice) {
                            choices.push(choice);
                        }
                    }
                }
            }
        }

        return choices;
    }, []);

    return { identifyPendingChoices };
}

/**
 * Create a pending choice from a choice entity
 */
function createPendingChoice(
    entity: FeatureEntity,
    feature: FeatureWithRelations,
    editionId?: number
): PendingChoice | null {
    if (!entity.appliesTo) {
        return null;
    }

    // For most choice types, appliesToId can be null (e.g., "select any bonus feat", "select any domain")
    // Only require appliesToId when there's a specific limited list (e.g., "choose between these 2 specific feats")
    // For now, allow all choice types to have null appliesToId

    const choice: PendingChoice = {
        id: `${feature.id}-${entity.id}`,
        type: entity.appliesTo,
        name: `Choice for ${ENTITY_APPLIES_TO_TYPES[entity.appliesTo].name}`,
        description: '',
        source: getSourceName(feature),
        level: feature.level,
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [],
    };

    // Generate options based on appliesTo type
    switch (entity.appliesTo) {
        case EntityAppliesToType.Feat:
            choice.options = generateFeatOptions(entity);
            break;
        case EntityAppliesToType.Domain:
            choice.options = generateDomainOptions(entity, editionId);
            break;
        case EntityAppliesToType.Skill:
            choice.options = generateSkillOptions(entity);
            break;
        case EntityAppliesToType.Spell:
            choice.options = generateSpellOptions(entity);
            break;
        case EntityAppliesToType.Feature:
            choice.options = generateFeatureOptions(entity);
            break;
        default:
            choice.options = generateGenericOptions(entity);
    }

    // Set choice properties based on entity
    if (entity.value) {
        choice.minSelections = entity.value;
    }
    if (entity.appliesToSubId) {
        choice.maxSelections = entity.appliesToSubId;
    }

    return choice;
}

/**
 * Generate feat options for a choice
 */
function generateFeatOptions(_entity: FeatureEntity): number[] {
    // TODO: Implement feat options generation
    // This would need to query available feats based on prerequisites
    return [1, 2];
}

/**
 * Generate domain options for a choice
 */
function generateDomainOptions(
    entity: FeatureEntity,
    editionId?: number
): number[] {
    if (!editionId) {
        return [];
    }

    const domains = getDomainSelectByEdition(editionId);
    return domains.map(domain => domain.id);
}

/**
 * Generate skill options for a choice
 */
function generateSkillOptions(_entity: FeatureEntity): number[] {
    // TODO: Implement skill options generation
    return [1, 2];
}

/**
 * Generate spell options for a choice
 */
function generateSpellOptions(_entity: FeatureEntity): number[] {
    // TODO: Implement spell options generation
    return [1, 2];
}

/**
 * Generate feature options for a choice
 */
function generateFeatureOptions(_entity: FeatureEntity): number[] {
    // TODO: Implement feature options generation
    return [1, 2];
}

/**
 * Generate generic options for a choice
 */
function generateGenericOptions(_entity: FeatureEntity): number[] {
    return [1, 2];
}

/**
 * Get source name for a feature
 */
function getSourceName(feature: FeatureWithRelations): string {
    if (feature.classes && feature.classes.length > 0) {
        const firstClassId = feature.classes[0].classId;
        const className = getClassNameFromCache(firstClassId);
        if (className) {
            return className;
        }
    }
    if (feature.name) {
        return feature.name;
    }
    return 'Unknown Source';
}
