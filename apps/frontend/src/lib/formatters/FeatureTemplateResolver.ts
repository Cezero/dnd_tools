import { applyFeatureFormula } from '@/lib/character-calculation/utils/formulaApplier';
import type { CharacterWithAllDetailsResponse, FeatureWithRelations, Feature } from '@shared/schema';
import { EntityAppliesToType, EntityType } from '@shared/static-data';

import type { DisplayContext, FormattedItemWithLevel, CharacterSheetDisplayResult } from './types';

/**
 * Resolves template placeholders using XPath-style navigation through resolved character data
 * Operates as a final stage in the formatting system with access to fully formatted character data
 * Supports dot notation to navigate any nested object structure
 * 
 * Examples:
 * - {{feature.wild-shape.entities.uses.value}} - Gets uses per day value from Wild Shape feature
 * - {{feature.wild-shape.entities.uses.formattedValue}} - Gets formatted uses per day
 * - {{choice.wizard-school.specialization}} - Gets specialization from wizard school choice
 * - {{companion.name}} - Gets companion name
 * - {{clericEnergy.turnRebuke}} - Gets cleric energy turn/rebuke choice
 */
export class FeatureTemplateResolver {
    /**
     * Resolves a template string by replacing placeholders with values from resolved character data
     * This operates as a final stage after all formatting is complete
     */
    static resolveTemplate(
        template: string,
        context: DisplayContext,
        character: CharacterWithAllDetailsResponse,
        baseFeature?: Feature,
        featureWithRelations?: FeatureWithRelations,
        resolvedProgressions?: FeatureWithRelations[],
        formattedItems?: FormattedItemWithLevel[],
        formattedCharacterResult?: CharacterSheetDisplayResult
    ): string {
        if (!template) {
            return '';
        }

        // Match {{placeholder}} or {{placeholder.subProperty}} patterns
        const placeholderRegex = /\{\{([^}]+)\}\}/g;

        return template.replace(placeholderRegex, (match, placeholderPath) => {
            const value = this.resolvePath(placeholderPath.trim(), {
                context,
                character,
                baseFeature,
                featureWithRelations,
                resolvedProgressions: resolvedProgressions || [],
                formattedItems: formattedItems || [],
                formattedCharacterResult,
            });
            return value !== null && value !== undefined ? String(value) : match;
        });
    }

    /**
     * Resolves an XPath-style path through the character data structure
     */
    private static resolvePath(
        path: string,
        data: {
            context: DisplayContext;
            character: CharacterWithAllDetailsResponse;
            baseFeature?: Feature;
            featureWithRelations?: FeatureWithRelations;
            resolvedProgressions: FeatureWithRelations[];
            formattedItems: FormattedItemWithLevel[];
            formattedCharacterResult?: CharacterSheetDisplayResult;
        }
    ): string | number | null | undefined {
        const parts = path.split('.');
        if (parts.length === 0) {
            return null;
        }

        const root = parts[0];
        const remainingPath = parts.slice(1).join('.');

        // Handle feature entity navigation
        if (root === 'feature' && remainingPath) {
            return this.resolveFeaturePath(remainingPath, data);
        }

        // Handle choice navigation
        if (root === 'choice' && remainingPath) {
            return this.resolveChoicePath(remainingPath, data.context);
        }

        // Handle companion navigation
        if (root === 'companion' && remainingPath) {
            return this.resolveCompanionPath(remainingPath, data.context);
        }

        // Handle cleric energy navigation
        if (root === 'clericEnergy' && remainingPath) {
            return this.resolveClericEnergyPath(remainingPath, data.context);
        }

        // Generic context property access
        const value = this.getNestedProperty(data.context, path);
        if (value !== null && value !== undefined) {
            if (typeof value === 'string' || typeof value === 'number') {
                return value;
            }
        }
        return null;
    }

    /**
     * Resolves feature entity paths
     * Format: feature.<slug>.<path>
     * Examples:
     * - feature.wild-shape.entities.uses.value
     * - feature.wild-shape.entities.uses.formattedValue
     * - feature.wild-shape.entities.uses.calculatedValue
     */
    private static resolveFeaturePath(
        path: string,
        data: {
            baseFeature?: Feature;
            featureWithRelations?: FeatureWithRelations;
            resolvedProgressions: FeatureWithRelations[];
            character: CharacterWithAllDetailsResponse;
            context: DisplayContext;
            formattedItems: FormattedItemWithLevel[];
            formattedCharacterResult?: CharacterSheetDisplayResult;
        }
    ): string | number | null | undefined {
        const parts = path.split('.');
        if (parts.length === 0) {
            return null;
        }

        // Find feature by slug or use provided feature
        let targetFeature: Feature | undefined = data.baseFeature;
        let targetProgression: FeatureWithRelations | undefined = data.featureWithRelations;

        if (parts[0] && (!targetFeature || targetFeature.slug !== parts[0])) {
            // Try to find feature by slug in resolved features
            for (const prog of data.resolvedProgressions) {
                if (prog.slug === parts[0]) {
                    targetFeature = prog;
                    targetProgression = prog;
                    break;
                }
            }
        }

        if (!targetFeature || !targetProgression) {
            return null;
        }

        // Navigate through feature entities
        if (parts[1] === 'entities' && parts.length > 2) {
            return this.resolveFeatureEntityPath(parts.slice(2), targetProgression, data.character, data.context, data.formattedItems);
        }

        // Direct feature property access
        const value = this.getNestedProperty(targetFeature, parts.slice(1).join('.'));
        if (value !== null && value !== undefined) {
            if (typeof value === 'string' || typeof value === 'number') {
                return value;
            }
        }
        return null;
    }

    /**
     * Resolves feature entity paths
     * Format: <entityFilter>.<property>
     * Examples:
     * - uses.value - Gets value from entity with appliesTo=Uses
     * - uses.formattedValue - Gets formatted value from formatting system
     * - uses.calculatedValue - Gets calculated value using formula
     * - quantity.uses.value - Gets value from Quantity entity with appliesTo=Uses
     */
    private static resolveFeatureEntityPath(
        pathParts: string[],
        feature: FeatureWithRelations,
        character: CharacterWithAllDetailsResponse,
        context: DisplayContext,
        formattedItems: FormattedItemWithLevel[]
    ): string | number | null | undefined {
        if (!feature.entities || feature.entities.length === 0) {
            return null;
        }

        let matchingEntities = feature.entities;
        let propertyPath = pathParts;

        // Filter by entity type if first part matches
        const entityType = this.parseEntityType(pathParts[0]);
        if (entityType !== null) {
            matchingEntities = matchingEntities.filter(e => e.type === entityType);
            propertyPath = pathParts.slice(1);
        }

        // Filter by appliesTo if next part matches
        if (propertyPath.length > 0) {
            const appliesTo = this.parseAppliesTo(propertyPath[0]);
            if (appliesTo !== null) {
                matchingEntities = matchingEntities.filter(e => e.appliesTo === appliesTo);
                propertyPath = propertyPath.slice(1);
            } else if (entityType === null) {
                // If no entity type was specified, try appliesTo as first part
                const appliesToFirst = this.parseAppliesTo(pathParts[0]);
                if (appliesToFirst !== null) {
                    matchingEntities = matchingEntities.filter(e => e.appliesTo === appliesToFirst);
                    propertyPath = pathParts.slice(1);
                }
            }
        }

        if (matchingEntities.length === 0) {
            return null;
        }

        // Get the first matching entity (or aggregate if multiple)
        const entity = matchingEntities[0];

        // Navigate entity properties
        if (propertyPath.length === 0) {
            // Return entity value
            return entity.value ?? null;
        }

        const property = propertyPath[0];
        const remainingPath = propertyPath.slice(1).join('.');

        // Handle calculated value using formula system
        if (property === 'calculatedValue' || property === 'value') {
            if (entity.formulaParams) {
                const calculatedValue = applyFeatureFormula(
                    entity,
                    character,
                    feature.level || context.currentLevel || 1
                );
                return calculatedValue ?? entity.value ?? null;
            }
            return entity.value ?? null;
        }

        // Handle formatted value using formatting system
        if (property === 'formattedValue') {
            // Find formatted item for this entity
            // Match by entity ID and feature ID (since FormattedItemWithLevel has featureId)
            const formattedItem = formattedItems.find(item =>
                item.entity.id === entity.id &&
                item.featureId === feature.id
            );
            if (formattedItem) {
                return formattedItem.formattedValue;
            }
            // Fall back to calculated value if formatted item not found
            if (entity.formulaParams) {
                const calculatedValue = applyFeatureFormula(
                    entity,
                    character,
                    feature.level || context.currentLevel || 1
                );
                return calculatedValue?.toString() ?? entity.value?.toString() ?? null;
            }
            return entity.value?.toString() ?? null;
        }

        // Generic property access
        const genericValue = this.getNestedProperty(entity, remainingPath || property);
        if (genericValue !== null && genericValue !== undefined) {
            if (typeof genericValue === 'string' || typeof genericValue === 'number') {
                return genericValue;
            }
        }
        return null;
    }

    /**
     * Resolves choice paths
     * Format: choice.<choiceGroupId>.<property>
     * Example: choice.wizard-school.specialization
     */
    private static resolveChoicePath(
        path: string,
        context: DisplayContext
    ): string | number | null | undefined {
        const parts = path.split('.');
        if (parts.length < 2) {
            return null;
        }

        const choiceGroupId = parts[0];
        const remainingPath = parts.slice(1).join('.');

        const choice = context.choices?.get(choiceGroupId);
        if (!choice) {
            return null;
        }

        // Navigate choice properties
        if (remainingPath) {
            // Access choiceData properties
            if (choice.choiceData) {
                const value = this.getNestedProperty(choice.choiceData, remainingPath);
                if (value !== null && value !== undefined) {
                    if (typeof value === 'string' || typeof value === 'number') {
                        return value;
                    }
                }
            }

            // Access direct choice properties
            const directValue = this.getNestedProperty(choice, remainingPath);
            if (directValue !== null && directValue !== undefined) {
                if (typeof directValue === 'string' || typeof directValue === 'number') {
                    return directValue;
                }
            }
        }

        // Return appliesToId as default
        return choice.appliesToId;
    }

    /**
     * Resolves companion paths
     * Format: companion.<property>
     * Example: companion.name
     */
    private static resolveCompanionPath(
        path: string,
        context: DisplayContext
    ): string | number | null | undefined {
        if (!context.companions || context.companions.length === 0) {
            return null;
        }

        // Get first companion (could be extended to support multiple)
        const companion = context.companions[0];
        const value = this.getNestedProperty(companion, path);
        if (value !== null && value !== undefined) {
            if (typeof value === 'string' || typeof value === 'number') {
                return value;
            }
        }
        return null;
    }

    /**
     * Resolves cleric energy paths
     * Format: clericEnergy.<property>
     * Example: clericEnergy.turnRebuke
     */
    private static resolveClericEnergyPath(
        path: string,
        context: DisplayContext
    ): string | number | null | undefined {
        const energyChoice = context.clericEnergyChoice;
        if (!energyChoice) {
            return null;
        }

        const value = this.getNestedProperty(energyChoice, path);
        if (value !== null && value !== undefined) {
            if (typeof value === 'string' || typeof value === 'number') {
                return value;
            }
        }
        return null;
    }

    /**
     * Parses entity type from string
     */
    private static parseEntityType(str: string): number | null {
        const typeMap: Record<string, number> = {
            'bonus': EntityType.Bonus,
            'quantity': EntityType.Quantity,
            'replacement': EntityType.Replacement,
            'other': EntityType.Other,
            'proficiency': EntityType.Other, // Proficiencies use EntityType.Other with appliesTo = EntityAppliesToType.Proficiency
            'choice': EntityType.Choice,
            'allocation': EntityType.Allocation,
        };
        return typeMap[str.toLowerCase()] ?? null;
    }

    /**
     * Parses appliesTo type from string
     */
    private static parseAppliesTo(str: string): number | null {
        const appliesToMap: Record<string, number> = {
            'uses': EntityAppliesToType.Uses,
            'skill': EntityAppliesToType.Skill,
            'feat': EntityAppliesToType.Feat,
            'spell': EntityAppliesToType.Spell,
            'ability': EntityAppliesToType.Ability,
            'ac': EntityAppliesToType.AC,
            'attack': EntityAppliesToType.Attack,
            'damage': EntityAppliesToType.Damage,
            'movementspeed': EntityAppliesToType.MovementSpeed,
            'savingthrow': EntityAppliesToType.SavingThrow,
            'initiative': EntityAppliesToType.Initiative,
            'distance': EntityAppliesToType.Distance,
            'targets': EntityAppliesToType.Targets,
            'hitdice': EntityAppliesToType.HitDice,
            'extraattacks': EntityAppliesToType.ExtraAttacks,
            'healing': EntityAppliesToType.Healing,
            'unarmeddamage': EntityAppliesToType.UnarmedDamage,
            'spellresistance': EntityAppliesToType.SpellResistance,
        };
        return appliesToMap[str.toLowerCase()] ?? null;
    }

    /**
     * Gets a nested property from an object using dot notation
     */
    private static getNestedProperty(obj: unknown, path: string): unknown {
        if (!obj || typeof obj !== 'object') {
            return null;
        }

        if (!path) {
            return obj;
        }

        const parts = path.split('.');
        let current: unknown = obj;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = (current as Record<string, unknown>)[part];
            } else {
                return null;
            }
        }

        return current;
    }
}
