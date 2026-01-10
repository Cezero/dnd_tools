import { useCallback } from 'react';

import { getClassNameFromCache, getDomainSelectByEdition } from '@/services/cache';
import { FeatureProgression, FeatureEntity } from '@shared/schema';
import { EntityType, EntityAppliesToType, ENTITY_APPLIES_TO_TYPES } from '@shared/static-data';

import type { PendingChoice, ChoiceOption } from './types';

/**
 * React hook for resolving character choices
 */
export function useChoiceResolver() {
    /**
     * Identify pending choices from feature progressions
     */
    const identifyPendingChoices = useCallback((progressions: FeatureProgression[], editionId?: number): PendingChoice[] => {
        const choices: PendingChoice[] = [];

        for (const progression of progressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice) {
                        const choice = createPendingChoice(entity, progression, editionId);
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
    progression: FeatureProgression,
    editionId?: number
): PendingChoice | null {
    if (!entity.appliesTo) {
        return null;
    }

    // For most choice types, appliesToId can be null (e.g., "select any bonus feat", "select any domain")
    // Only require appliesToId when there's a specific limited list (e.g., "choose between these 2 specific feats")
    // For now, allow all choice types to have null appliesToId

    const choice: PendingChoice = {
        id: `${progression.id}-${entity.id}`,
        type: entity.appliesTo,
        name: `Choice for ${ENTITY_APPLIES_TO_TYPES[entity.appliesTo].name}`,
        description: '',
        source: getSourceName(progression),
        level: progression.level,
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
function generateFeatOptions(_entity: FeatureEntity): ChoiceOption[] {
    // TODO: Implement feat options generation
    // This would need to query available feats based on prerequisites
    return [
        { id: '1', name: 'Sample Feat 1', description: 'A sample feat option', value: 1 },
        { id: '2', name: 'Sample Feat 2', description: 'Another sample feat option', value: 2 },
    ];
}

/**
 * Generate domain options for a choice
 */
function generateDomainOptions(
    entity: FeatureEntity,
    editionId?: number
): ChoiceOption[] {
    if (!editionId) {
        return [];
    }

    const domains = getDomainSelectByEdition(editionId);
    return domains.map(domain => ({
        id: domain.id.toString(),
        name: domain.name,
        description: `Domain: ${domain.name}`,
        value: domain.id,
    }));
}

/**
 * Generate skill options for a choice
 */
function generateSkillOptions(_entity: FeatureEntity): ChoiceOption[] {
    // TODO: Implement skill options generation
    return [
        { id: '1', name: 'Sample Skill 1', description: 'A sample skill option', value: 1 },
        { id: '2', name: 'Sample Skill 2', description: 'Another sample skill option', value: 2 },
    ];
}

/**
 * Generate spell options for a choice
 */
function generateSpellOptions(_entity: FeatureEntity): ChoiceOption[] {
    // TODO: Implement spell options generation
    return [
        { id: '1', name: 'Sample Spell 1', description: 'A sample spell option', value: 1 },
        { id: '2', name: 'Sample Spell 2', description: 'Another sample spell option', value: 2 },
    ];
}

/**
 * Generate feature options for a choice
 */
function generateFeatureOptions(_entity: FeatureEntity): ChoiceOption[] {
    // TODO: Implement feature options generation
    return [
        { id: '1', name: 'Sample Feature 1', description: 'A sample feature option', value: 1 },
        { id: '2', name: 'Sample Feature 2', description: 'Another sample feature option', value: 2 },
    ];
}

/**
 * Generate generic options for a choice
 */
function generateGenericOptions(_entity: FeatureEntity): ChoiceOption[] {
    return [
        { id: '1', name: 'Option 1', description: 'Generic option 1', value: 1 },
        { id: '2', name: 'Option 2', description: 'Generic option 2', value: 2 },
    ];
}

/**
 * Get source name for a progression
 */
function getSourceName(progression: FeatureProgression): string {
    if (progression.classId) {
        const className = getClassNameFromCache(progression.classId);
        if (className) {
            return className;
        }
    }
    if (progression.feature?.name) {
        return progression.feature.name;
    }
    return 'Unknown Source';
}
