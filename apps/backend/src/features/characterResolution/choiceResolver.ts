import type { FeatureProgression, FeatureEntity, FeatInQueryResponse } from '@shared/schema';
import { EntityType, EntityAppliesToType, FeatureFeatChoiceFilter, FeatureSourceType, CompanionType } from '@shared/static-data';
import { featureSystemService } from '../featureSystem/featureSystemService';
import { domainService } from '../domain/domainService';
import { featService } from '../feat/featService';
import { companionService } from '../companion/companionService';
import { companionBenefitToFeatureEntity } from './companionUtil';
import type { PendingChoice } from './types';

/**
 * Choice option for pending choices
 */
interface ChoiceOption {
    id: string;
    name: string;
    description: string;
    value: number;
    prerequisites?: string[];
}

/**
 * Backend service for resolving character choices.
 * 
 * Handles identification of pending choices and resolution of selected choices.
 * Uses backend services (domainService, featService, companionService) instead of
 * frontend fetch calls for better performance and consistency.
 */
export class ChoiceResolver {
    /**
     * Identifies pending choices from feature progressions.
     * 
     * Scans progressions for choice entities and creates PendingChoice objects
     * with appropriate options. Filters out already-made choices and progressions
     * above the character's current level.
     * 
     * @returns Array of pending choices that require user input
     */
    static async identifyPendingChoices(
        progressions: FeatureProgression[],
        editionId?: number,
        existingChoices?: Array<{ progressionId: number; featureEntityId: number }>,
        allFeats?: FeatInQueryResponse[],
        characterLevel?: number,
        classLevels?: Map<number, number>
    ): Promise<PendingChoice[]> {
        const choices: PendingChoice[] = [];

        // Create a Set for fast lookup of existing choices
        const existingChoicesSet = new Set<string>();
        if (existingChoices) {
            for (const choice of existingChoices) {
                existingChoicesSet.add(`${choice.progressionId}-${choice.featureEntityId}`);
            }
        }

        // Filter progressions by level before processing
        const filteredProgressions = progressions.filter(progression => {
            // For class progressions, check if the progression level is <= the character's class level
            if (progression.classId && progression.sourceType === FeatureSourceType.Class && classLevels) {
                const classLevel = classLevels.get(progression.classId) ?? 0;
                return progression.level <= classLevel;
            }

            // For non-class progressions, check against character level if provided
            if (characterLevel !== undefined) {
                return progression.level <= characterLevel;
            }

            // If no level filtering is provided, include all progressions
            return true;
        });

        for (const progression of filteredProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice) {
                        // Check if this choice has already been made
                        const choiceKey = `${progression.id}-${entity.id}`;
                        if (existingChoicesSet.has(choiceKey)) {
                            continue;
                        }

                        const choice = await this.createPendingChoice(entity, progression, editionId, allFeats);
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
     * Resolves a domain choice and returns the granted feature progressions.
     * 
     * First checks if domain progressions already exist in source progressions,
     * otherwise fetches domain features from the backend domain service.
     */
    static async resolveDomainChoice(
        domainId: number,
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // First, check if domain progressions already exist in source progressions
        for (const progression of sourceProgressions) {
            if (progression.domainId === domainId) {
                grantedProgressions.push(progression);
            }
        }

        // If no progressions found, fetch domain features from backend
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
     * Resolves a feat choice and returns the granted feature progressions.
     * 
     * First checks if feat progressions already exist in source progressions,
     * otherwise attempts to fetch feat features from the backend.
     */
    static async resolveFeatChoice(
        featId: number,
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // First, check if feat progressions already exist in source progressions
        for (const progression of sourceProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Feat && entity.appliesToId === featId) {
                        grantedProgressions.push(progression);
                    }
                }
            }
        }

        // If no progressions found, fetch feat features from backend
        if (grantedProgressions.length === 0) {
            try {
                // Use featureSystemService to get feat progressions
                // Note: This may need to be implemented if not already available
                const featProgressions = await featureSystemService.getFeatureProgressionsByIds([], []);
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
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // Find skill progressions for the selected skill
        for (const progression of sourceProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Skill && entity.appliesToId === skillId) {
                        grantedProgressions.push(progression);
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
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // Find spell progressions for the selected spell
        for (const progression of sourceProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Spell && entity.appliesToId === spellId) {
                        grantedProgressions.push(progression);
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
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // Find feature progressions for the selected feature
        for (const progression of sourceProgressions) {
            if (progression.featureId === featureId) {
                grantedProgressions.push(progression);
            }
        }

        return grantedProgressions;
    }

    /**
     * Resolve an animal companion choice and return the granted features
     */
    static async resolveAnimalCompanionChoice(
        companionId: number,
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // Find feature progressions for the selected companion
        for (const progression of sourceProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.appliesTo === EntityAppliesToType.AnimalCompanion && entity.appliesToId === companionId) {
                        grantedProgressions.push(progression);
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
     * @param sourceProgressions - The current feature progressions to search within
     * @returns Array of feature progressions granted by the choice
     */
    static async resolveChoiceByType(
        appliesToType: number,
        selectedId: number,
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
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
            default:
                console.warn(`Unknown appliesTo type: ${appliesToType}`);
                return [];
        }
    }

    /**
     * Resolves a familiar choice and converts companion benefits to feature progressions.
     * 
     * First checks if familiar progressions already exist. If not, fetches the companion
     * from the backend and converts each benefit into a FeatureProgression with
     * appropriate FeatureEntity objects.
     */
    static async resolveFamiliarChoice(
        companionId: number,
        sourceProgressions: FeatureProgression[]
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // First, check if familiar progressions already exist in source progressions
        for (const progression of sourceProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Familiar && entity.appliesToId === companionId) {
                        grantedProgressions.push(progression);
                    }
                }
            }
        }

        // If no progressions found, fetch companion data and convert benefits to progressions
        if (grantedProgressions.length === 0) {
            try {
                const companion = await companionService.getCompanionById({ id: companionId });
                
                if (companion && companion.benefits && companion.benefits.length > 0) {
                    // Convert each benefit to a FeatureEntity and create a FeatureProgression
                    for (const benefit of companion.benefits) {
                        const entity = companionBenefitToFeatureEntity(benefit);
                        
                        // Create a FeatureProgression for this benefit
                        const progressionId = companionId * 10000 + benefit.index;
                        entity.progressionId = progressionId;

                        const progression: FeatureProgression = {
                            id: progressionId,
                            sourceType: FeatureSourceType.Class,
                            level: 1,
                            featureId: 0,
                            classId: null,
                            raceId: null,
                            variantOverrideId: null,
                            domainId: null,
                            feature: {
                                id: 0,
                                name: `Familiar Benefit: ${companion.monster?.name || 'Unknown'}`,
                                description: '',
                                slug: `familiar-benefit-${companionId}-${benefit.index}`,
                                displayInCharacterSheet: true,
                            },
                            entities: [entity],
                        };
                        
                        grantedProgressions.push(progression);
                    }
                }
            } catch (error) {
                console.error(`Error fetching familiar ${companionId}:`, error);
            }
        }

        return grantedProgressions;
    }

    /**
     * Create a pending choice from a choice entity
     */
    private static async createPendingChoice(
        entity: FeatureEntity,
        progression: FeatureProgression,
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

        const source = this.getSourceName(progression);

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

        return {
            id: `${progression.id}-${entity.id}`,
            name: choiceName,
            type: entity.appliesTo,
            description: choiceName,
            source,
            level: progression.level,
            required: true,
            options: await this.getChoiceOptions(entity, progression, editionId, allFeats),
            maxSelections: entity.value || 1,
            minSelections: 1,
        };
    }

    /**
     * Get choice options based on entity type
     */
    private static async getChoiceOptions(
        entity: FeatureEntity,
        _progression: FeatureProgression,
        editionId?: number,
        allFeats?: FeatInQueryResponse[]
    ): Promise<ChoiceOption[]> {
        const options: ChoiceOption[] = [];

        switch (entity.appliesTo) {
            case EntityAppliesToType.Domain:
                if (entity.domain) {
                    // Specific domain choice
                    options.push({
                        id: `domain-${entity.domain.id}`,
                        name: entity.domain.name,
                        description: `Domain: ${entity.domain.name}`,
                        value: entity.domain.id,
                        prerequisites: []
                    });
                } else {
                    // General domain choice - fetch all domains for edition
                    if (editionId) {
                        try {
                            const domainsResponse = await domainService.getAllDomains();
                            const domains = domainsResponse.results.filter(d => d.editionId === editionId);
                            domains.forEach(domain => {
                                options.push({
                                    id: `domain-${domain.id}`,
                                    name: domain.name,
                                    description: `Domain: ${domain.name}`,
                                    value: domain.id,
                                    prerequisites: []
                                });
                            });
                        } catch (error) {
                            console.error('Error fetching domains:', error);
                            options.push({
                                id: 'domain-error',
                                name: 'Error loading domains',
                                description: 'Could not load domain options',
                                value: 0,
                                prerequisites: []
                            });
                        }
                    }
                }
                break;

            case EntityAppliesToType.Feat:
                if (entity.feat) {
                    // Specific feat choice
                    options.push({
                        id: `feat-${entity.feat.id}`,
                        name: entity.feat.name,
                        description: entity.feat.description || `Feat: ${entity.feat.name}`,
                        value: entity.feat.id,
                        prerequisites: entity.feat.prerequisites ? [entity.feat.prerequisites] : []
                    });
                } else {
                    // General feat choice
                    if (!allFeats || allFeats.length === 0) {
                        options.push({
                            id: 'feat-no-data',
                            name: 'No feats available',
                            description: 'Feats data not provided',
                            value: 0,
                            prerequisites: []
                        });
                    } else {
                        let availableFeats = allFeats;

                        // Filter by filterType if specified
                        if (entity.filterType === FeatureFeatChoiceFilter.FighterBonus) {
                            availableFeats = availableFeats.filter(feat => feat.fighterBonus === true);
                        }

                        availableFeats.forEach(feat => {
                            options.push({
                                id: `feat-${feat.id}`,
                                name: feat.name,
                                description: feat.description || `Feat: ${feat.name}`,
                                value: feat.id,
                                prerequisites: feat.prerequisites ? [feat.prerequisites] : []
                            });
                        });
                    }
                }
                break;

            case EntityAppliesToType.Spell:
                if (entity.spell) {
                    options.push({
                        id: `spell-${entity.spell.id}`,
                        name: entity.spell.name,
                        description: `Spell: ${entity.spell.name}`,
                        value: entity.spell.id,
                        prerequisites: []
                    });
                }
                break;

            case EntityAppliesToType.Feature:
                if (entity.feature) {
                    options.push({
                        id: `feature-${entity.feature.id}`,
                        name: entity.feature.name,
                        description: entity.feature.description || `Feature: ${entity.feature.name}`,
                        value: entity.feature.id,
                        prerequisites: entity.feature.prerequisites?.map(p => p.type.toString()) || []
                    });
                }
                break;

            case EntityAppliesToType.AnimalCompanion:
            case EntityAppliesToType.Familiar:
                if (entity.companion) {
                    // Specific companion choice
                    const companionName = entity.companion.name || `Companion ${entity.companion.id}`;
                    const companionTypeName = entity.appliesTo === EntityAppliesToType.Familiar ? 'Familiar' : 'Animal Companion';
                    options.push({
                        id: `companion-${entity.companion.id}`,
                        name: companionName,
                        description: `${companionTypeName}: ${companionName}`,
                        value: entity.companion.id,
                        prerequisites: []
                    });
                } else {
                    // General companion choice - fetch all companions
                    try {
                        const companionsResponse = await companionService.getAllCompanions();
                        const typeFilter = entity.appliesTo === EntityAppliesToType.Familiar 
                            ? CompanionType.Familiar 
                            : CompanionType.AnimalCompanion;
                        const companions = companionsResponse.results.filter(
                            companion => companion.type === typeFilter
                        );
                        companions.forEach(companion => {
                            const monsterName = companion.monster?.name || `Companion ${companion.id}`;
                            const companionTypeName = companion.type === CompanionType.Familiar
                                ? 'Familiar'
                                : 'Animal Companion';
                            options.push({
                                id: `companion-${companion.id}`,
                                name: monsterName,
                                description: `${companionTypeName}: ${monsterName}`,
                                value: companion.id,
                                prerequisites: []
                            });
                        });
                    } catch (error) {
                        console.error('Error fetching companions:', error);
                        options.push({
                            id: 'companion-error',
                            name: 'Error loading companions',
                            description: 'Could not load companion options',
                            value: 0,
                            prerequisites: []
                        });
                    }
                }
                break;
        }

        return options;
    }

    /**
     * Get source name for display
     */
    private static getSourceName(progression: FeatureProgression): string {
        if (progression.class?.name) {
            return progression.class.name;
        }
        if (progression.feature?.name) {
            return progression.feature.name;
        }
        // Fallback to source type if no class or feature name available
        if (progression.sourceType === FeatureSourceType.Class) {
            return 'Class';
        }
        if (progression.sourceType === FeatureSourceType.Race) {
            return 'Race';
        }
        if (progression.sourceType === FeatureSourceType.Domain) {
            return 'Domain';
        }
        return 'Unknown Source';
    }
}










