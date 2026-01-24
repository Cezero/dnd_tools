import { prisma } from '@/lib/prisma';
import type { FeatureWithRelations, FeatureEntity, FeatInQueryResponse, PendingChoice } from '@shared/schema';
import { EntityType, EntityAppliesToType, FeatureFeatChoiceFilter, FeatureSourceType, CompanionType } from '@shared/static-data';

import { FeatureEntityHandlers, type EntityProcessingResult } from './featureEntityHandlers';
import { domainService } from '../domain/domainService';
import { featureSystemService } from '../featureSystem/featureSystemService';

/**
 * Backend service for resolving character choices.
 * 
 * Handles identification of pending choices and resolution of selected choices.
 * Uses backend services (domainService, featService, companionService) instead of
 * frontend fetch calls for better performance and consistency.
 */
export class ChoiceResolver {
    /**
     * Identifies pending choices from feature features.
     * 
     * Scans features for choice entities and creates PendingChoice objects
     * with appropriate options. Filters out already-made choices and features
     * above the character's current level.
     * 
     * @returns Array of pending choices that require user input
     */
    static async identifyPendingChoices(
        features: FeatureWithRelations[],
        editionId?: number,
        existingChoices?: Array<{ featureId: number; featureEntityId: number }>,
        allFeats?: FeatInQueryResponse[],
        characterLevel?: number,
        classLevels?: Map<number, number>
    ): Promise<PendingChoice[]> {
        const choices: PendingChoice[] = [];

        // Create a Set for fast lookup of existing choices
        const existingChoicesSet = new Set<string>();
        if (existingChoices) {
            for (const choice of existingChoices) {
                existingChoicesSet.add(`${choice.featureId}-${choice.featureEntityId}`);
            }
        }

        // Filter features by level before processing
        const filteredProgressions = features.filter(feature => {
            // For class features, check if the feature level is <= the character's class level
            if (feature.sourceType === FeatureSourceType.Class && classLevels && feature.classes) {
                // Check all classes linked to this feature
                const hasValidLevel = feature.classes.some(c => {
                    const classLevel = classLevels.get(c.classId) ?? 0;
                    return feature.level <= classLevel;
                });
                if (hasValidLevel) return true;
            }

            // For non-class features, check against character level if provided
            if (characterLevel !== undefined) {
                return feature.level <= characterLevel;
            }

            // If no level filtering is provided, include all features
            return true;
        });

        for (const feature of filteredProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.type === EntityType.Choice) {
                        // Check if this choice has already been made
                        const choiceKey = `${feature.id}-${entity.id}`;
                        if (existingChoicesSet.has(choiceKey)) {
                            continue;
                        }

                        const choice = await this.createPendingChoice(entity, feature, editionId, allFeats);
                        if (choice) {
                            choices.push(choice);
                        }
                    }
                }
            }
        }

        return choices;
    }

    /**
     * Resolves a domain choice and returns the granted feature features.
     * 
     * First checks if domain features already exist in source features,
     * otherwise fetches domain features from the backend domain service.
     */
    static async resolveDomainChoice(
        domainId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        const grantedProgressions: FeatureWithRelations[] = [];

        // First, check if domain features already exist in source features
        for (const feature of sourceProgressions) {
            if (feature.domainId === domainId) {
                grantedProgressions.push(feature);
            }
        }

        // If no features found, fetch domain features from backend
        if (grantedProgressions.length === 0) {
            try {
                const domain = await domainService.getDomainById({ id: domainId });
                if (domain?.features && domain.features.length > 0) {
                    grantedProgressions.push(...domain.features);
                }
            } catch (error) {
                console.error(`Error fetching domain ${domainId}:`, error);
            }
        }

        return grantedProgressions;
    }

    /**
     * Resolves a feat choice and returns the granted feature features.
     * 
     * First checks if feat features already exist in source features,
     * otherwise attempts to fetch feat features from the backend.
     */
    static async resolveFeatChoice(
        featId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        const grantedProgressions: FeatureWithRelations[] = [];

        // First, check if feat features already exist in source features
        for (const feature of sourceProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Feat && entity.appliesToId === featId) {
                        grantedProgressions.push(feature);
                    }
                }
            }
        }

        // If no features found, fetch feat features from backend
        if (grantedProgressions.length === 0) {
            try {
                // Use featureSystemService to get feat features
                // Note: This may need to be implemented if not already available
                const _featProgressions = await featureSystemService.getFeaturesByIds([], []);
                // For now, return empty - feat features should be in sourceProgressions
            } catch (error) {
                console.error(`Error fetching feat ${featId}:`, error);
            }
        }

        return grantedProgressions;
    }

    /**
     * Resolve a skill choice and return the granted features
     */
    static async resolveSkillChoice(
        skillId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        const grantedProgressions: FeatureWithRelations[] = [];

        // Find skill features for the selected skill
        for (const feature of sourceProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Skill && entity.appliesToId === skillId) {
                        grantedProgressions.push(feature);
                    }
                }
            }
        }

        return grantedProgressions;
    }

    /**
     * Resolve a spell choice and return the granted features
     */
    static async resolveSpellChoice(
        spellId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        const grantedProgressions: FeatureWithRelations[] = [];

        // Find spell features for the selected spell
        for (const feature of sourceProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Spell && entity.appliesToId === spellId) {
                        grantedProgressions.push(feature);
                    }
                }
            }
        }

        return grantedProgressions;
    }

    /**
     * Resolve a feature choice and return the granted features
     */
    static async resolveFeatureChoice(
        featureId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        const grantedProgressions: FeatureWithRelations[] = [];

        // Find feature features for the selected feature
        for (const feature of sourceProgressions) {
            if (feature.id === featureId) {
                grantedProgressions.push(feature);
            }
        }

        return grantedProgressions;
    }

    /**
     * Resolve an animal companion choice and return the granted features
     */
    static async resolveAnimalCompanionChoice(
        companionId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        const grantedProgressions: FeatureWithRelations[] = [];

        // Find feature features for the selected companion
        for (const feature of sourceProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.appliesTo === EntityAppliesToType.AnimalCompanion && entity.appliesToId === companionId) {
                        grantedProgressions.push(feature);
                    }
                }
            }
        }

        // Animal companions may not grant features directly
        return grantedProgressions;
    }

    /**
     * Resolves a choice by appliesTo type and selected ID.
     * 
     * Centralized method that maps appliesTo types to the appropriate resolver method.
     * This eliminates code duplication between CharacterResolutionService and CascadingResolver.
     * 
     * @param appliesToType - The EntityAppliesToType value indicating what type of choice this is
     * @param selectedId - The ID of the selected entity (domain, feat, spell, etc.)
     * @param sourceProgressions - The current feature features to search within
     * @returns Array of feature features granted by the choice
     */
    static async resolveChoiceByType(
        appliesToType: number,
        selectedId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        switch (appliesToType) {
            case EntityAppliesToType.Domain:
                return await this.resolveDomainChoice(selectedId, sourceProgressions);
            case EntityAppliesToType.Feat:
                return await this.resolveFeatChoice(selectedId, sourceProgressions);
            case EntityAppliesToType.Feature:
                return await this.resolveFeatureChoice(selectedId, sourceProgressions);
            case EntityAppliesToType.Spell:
                return await this.resolveSpellChoice(selectedId, sourceProgressions);
            case EntityAppliesToType.Skill:
                return await this.resolveSkillChoice(selectedId, sourceProgressions);
            case EntityAppliesToType.AnimalCompanion:
                return await this.resolveAnimalCompanionChoice(selectedId, sourceProgressions);
            case EntityAppliesToType.Familiar:
                return await this.resolveFamiliarChoice(selectedId, sourceProgressions);
            default: {
                // Many appliesTo types are not choices (e.g., bonuses, direct grants, values)
                // Only log if it's a type that might actually be a choice we're missing
                const potentiallyMissingChoiceTypes: number[] = [
                    EntityAppliesToType.SpellbookSpell, // 37 - might need handler
                ];

                if (potentiallyMissingChoiceTypes.includes(appliesToType)) {
                    console.warn(`[Choice Resolver] Potentially missing choice handler for appliesTo type: ${appliesToType}`);
                } else {
                    // These are expected - many appliesTo types are not choices
                    // (e.g., AutomaticLanguage, BonusLanguage, Proficiency, bonuses, etc.)
                    // Only log at debug level if needed
                    if (process.env.DEBUG_CHOICE_RESOLVER === 'true') {
                        console.debug(`[Choice Resolver] Non-choice appliesTo type (expected): ${appliesToType}`);
                    }
                }
                return [];
            }
        }
    }

    /**
     * Adds feature features to a target array, avoiding duplicates.
     * 
     * Optionally processes entities in new features before adding them.
     * This is useful when features need their entities processed for
     * cascading feature resolution.
     * 
     * @param targetProgressions - Array to add features to (modified in place)
     * @param newProgressions - New features to add (checked for duplicates)
     * @param options - Configuration options
     * @param options.processEntities - If true, processes entities in new features using FeatureEntityHandlers
     * @param options.onEntityProcessed - Optional callback when an entity is processed (for warnings/errors)
     * 
     * @example
     * ```typescript
     * // Simple add without entity processing
     * ChoiceResolver.addResolvedProgressions(features, grantedProgressions);
     * 
     * // Add with entity processing
     * ChoiceResolver.addResolvedProgressions(features, grantedProgressions, {
     *     processEntities: true,
     *     onEntityProcessed: (result, feature) => {
     *         if (result.warnings) warnings.push(...result.warnings);
     *     }
     * });
     * ```
     */
    static addResolvedProgressions(
        targetProgressions: FeatureWithRelations[],
        newProgressions: FeatureWithRelations[],
        options?: {
            processEntities?: boolean;
            onEntityProcessed?: (result: EntityProcessingResult, feature: FeatureWithRelations) => void;
        }
    ): void {
        for (const feature of newProgressions) {
            // Check if this feature already exists to avoid duplicates
            const existingProgression = targetProgressions.find(p => p.id === feature.id);
            if (existingProgression) {
                continue;
            }

            // Optionally process entities if requested
            if (options?.processEntities && feature.entities) {
                for (const entity of feature.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, feature);
                    if (options.onEntityProcessed) {
                        options.onEntityProcessed(result, feature);
                    }
                }
            }

            targetProgressions.push(feature);
        }
    }

    /**
     * Resolves a familiar choice and converts companion benefits to feature features.
     * 
     * First checks if familiar features already exist. If not, fetches the companion
     * from the backend and converts each benefit into a FeatureWithRelations with
     * appropriate FeatureEntity objects.
     */
    static async resolveFamiliarChoice(
        companionId: number,
        sourceProgressions: FeatureWithRelations[]
    ): Promise<FeatureWithRelations[]> {
        const grantedProgressions: FeatureWithRelations[] = [];

        // First, check if familiar features already exist in source features
        for (const feature of sourceProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Familiar && entity.appliesToId === companionId) {
                        grantedProgressions.push(feature);
                    }
                }
            }
        }

        // If no features found, fetch companion feature features from feature system
        if (grantedProgressions.length === 0) {
            try {
                // Query feature features for this companion
                // All features with sourceType: FeatureSourceType.Companion should be included
                const companionProgressions = await featureSystemService.getFeaturesByCompanionId(companionId);

                grantedProgressions.push(...companionProgressions);
            } catch (error) {
                console.error(`Error fetching companion feature features for ${companionId}:`, error);
            }
        }

        return grantedProgressions;
    }

    /**
     * Create a pending choice from a choice entity
     */
    private static async createPendingChoice(
        entity: FeatureEntity,
        feature: FeatureWithRelations,
        editionId?: number,
        allFeats?: FeatInQueryResponse[]
    ): Promise<PendingChoice | null> {
        if (!entity.appliesTo) {
            return null;
        }

        // For domain, feat, animal companion, and familiar choices, appliesToId can be null
        if (entity.appliesTo !== EntityAppliesToType.Domain &&
            entity.appliesTo !== EntityAppliesToType.Feat &&
            entity.appliesTo !== EntityAppliesToType.AnimalCompanion &&
            entity.appliesTo !== EntityAppliesToType.Familiar &&
            !entity.appliesToId) {
            return null;
        }

        const source = await this.getSourceName(feature);

        // Create a descriptive name based on the choice type
        let choiceName = '';
        if (entity.appliesTo === EntityAppliesToType.Domain) {
            choiceName = `${source}: Select a Domain`;
        } else if (entity.appliesTo === EntityAppliesToType.Feat) {
            if (entity.filterType === FeatureFeatChoiceFilter.FighterBonus) {
                choiceName = `${source}: Select a Fighter Bonus Feat`;
            } else {
                choiceName = `${source}: Select a Feat`;
            }
        } else if (entity.appliesTo === EntityAppliesToType.Skill) {
            choiceName = `${source}: Select a Skill`;
        } else if (entity.appliesTo === EntityAppliesToType.Spell) {
            choiceName = `${source}: Select a Spell`;
        } else if (entity.appliesTo === EntityAppliesToType.AnimalCompanion) {
            choiceName = `${source}: Select an Animal Companion`;
        } else if (entity.appliesTo === EntityAppliesToType.Familiar) {
            choiceName = `${source}: Select a Familiar`;
        } else {
            choiceName = `${source}: Make a Choice`;
        }

        const optionIds = await this.getChoiceOptions(entity, feature, editionId, allFeats);
        // Filter out invalid options (ID must be > 0 per Zod schema)
        const validOptionIds = optionIds.filter(id => id > 0);

        // Don't return a pending choice if there are no valid options
        if (validOptionIds.length === 0) {
            return null;
        }

        return {
            id: `${feature.id}-${entity.id}`,
            name: choiceName,
            type: entity.appliesTo,
            description: choiceName,
            source,
            level: feature.level,
            required: true,
            options: validOptionIds,
            maxSelections: entity.value || 1,
            minSelections: 1,
        };
    }

    /**
     * Get choice options based on entity type
     */
    private static async getChoiceOptions(
        entity: FeatureEntity,
        _progression: FeatureWithRelations,
        editionId?: number,
        allFeats?: FeatInQueryResponse[]
    ): Promise<number[]> {
        const options: number[] = [];

        switch (entity.appliesTo) {
            case EntityAppliesToType.Domain:
                if (entity.appliesToId) {
                    // Specific domain choice - just return the ID
                    if (entity.appliesToId > 0) {
                        options.push(entity.appliesToId);
                    }
                } else {
                    // General domain choice - get all domain IDs for edition
                    if (editionId) {
                        try {
                            const domainIds = await prisma.domain.findMany({
                                where: { editionId },
                                select: { id: true }
                            });
                            domainIds.forEach(domain => {
                                if (domain.id > 0) {
                                    options.push(domain.id);
                                }
                            });
                        } catch (error) {
                            console.error('Error fetching domain IDs:', error);
                        }
                    }
                }
                break;

            case EntityAppliesToType.Feat:
                if (entity.appliesToId) {
                    // Specific feat choice - just return the ID
                    if (entity.appliesToId > 0) {
                        options.push(entity.appliesToId);
                    }
                } else {
                    // General feat choice
                    if (allFeats && allFeats.length > 0) {
                        let availableFeats = allFeats;

                        // Filter by filterType if specified
                        if (entity.filterType === FeatureFeatChoiceFilter.FighterBonus) {
                            availableFeats = availableFeats.filter(feat => feat.fighterBonus === true);
                        }

                        availableFeats.forEach(feat => {
                            if (feat.id > 0) {
                                options.push(feat.id);
                            }
                        });
                    }
                }
                break;

            case EntityAppliesToType.Spell:
                if (entity.appliesToId) {
                    // Specific spell choice - just return the ID
                    if (entity.appliesToId > 0) {
                        options.push(entity.appliesToId);
                    }
                }
                break;

            case EntityAppliesToType.Feature:
                if (entity.appliesToId) {
                    // Specific feature choice - just return the ID
                    if (entity.appliesToId > 0) {
                        options.push(entity.appliesToId);
                    }
                }
                break;

            case EntityAppliesToType.AnimalCompanion:
            case EntityAppliesToType.Familiar:
                if (entity.appliesToId) {
                    // Specific companion choice - just return the ID
                    if (entity.appliesToId > 0) {
                        options.push(entity.appliesToId);
                    }
                } else {
                    // General companion choice - get all companion IDs by type
                    try {
                        const typeFilter = entity.appliesTo === EntityAppliesToType.Familiar
                            ? CompanionType.Familiar
                            : CompanionType.AnimalCompanion;
                        const companionIds = await prisma.companion.findMany({
                            where: { type: typeFilter },
                            select: { id: true }
                        });
                        companionIds.forEach(companion => {
                            if (companion.id > 0) {
                                options.push(companion.id);
                            }
                        });
                    } catch (error) {
                        console.error('Error fetching companion IDs:', error);
                    }
                }
                break;
        }

        return options;
    }

    /**
     * Get source name for display
     */
    private static async getSourceName(feature: FeatureWithRelations): Promise<string> {
        // Check for class name via many-to-many relationship
        if (feature.classes && feature.classes.length > 0) {
            const firstClassId = feature.classes[0].classId;
            const classData = await prisma.class.findUnique({
                where: { id: firstClassId },
                select: { name: true }
            });
            if (classData?.name) {
                return classData.name;
            }
        }

        // Check for race name via many-to-many relationship
        if (feature.races && feature.races.length > 0) {
            const firstRaceId = feature.races[0].raceId;
            const raceData = await prisma.race.findUnique({
                where: { id: firstRaceId },
                select: { name: true }
            });
            if (raceData?.name) {
                return raceData.name;
            }
        }

        // Fallback to feature name
        if (feature.name) {
            return feature.name;
        }

        // Fallback to source type if no class, race, or feature name available
        if (feature.sourceType === FeatureSourceType.Class) {
            return 'Class';
        }
        if (feature.sourceType === FeatureSourceType.Race) {
            return 'Race';
        }
        if (feature.sourceType === FeatureSourceType.Domain) {
            return 'Domain';
        }
        return 'Unknown Source';
    }
}










