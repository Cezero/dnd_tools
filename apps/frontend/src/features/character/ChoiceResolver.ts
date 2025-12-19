import { FeatureProgression, FeatureEntity, FeatInQueryResponse } from '@shared/schema';
import { EntityType, EntityAppliesToType, CoreComponent, FeatureFeatChoiceFilter } from '@shared/static-data';

import type { PendingChoice, ChoiceOption } from './types';

// Cache service type
type CacheService = {
    getClassNameById: (id: number) => Promise<CoreComponent | undefined>;
    getDomainSelectByEdition: (editionId: number) => Promise<CoreComponent[]>;
};

/**
 * Service for resolving character choices
 */
export class ChoiceResolver {
    /**
     * Identify pending choices from feature progressions
     * Filters out choices that have already been made
     */
    static async identifyPendingChoices(
        progressions: FeatureProgression[],
        cacheService: CacheService,
        editionId?: number,
        existingChoices?: Array<{ progressionId: number; featureEntityId: number }>,
        allFeats?: FeatInQueryResponse[]
    ): Promise<PendingChoice[]> {
        const choices: PendingChoice[] = [];

        // Create a Set for fast lookup of existing choices
        const existingChoicesSet = new Set<string>();
        if (existingChoices) {
            for (const choice of existingChoices) {
                existingChoicesSet.add(`${choice.progressionId}-${choice.featureEntityId}`);
            }
        }

        for (const progression of progressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.type === EntityType.Choice) {
                        // Check if this choice has already been made
                        const choiceKey = `${progression.id}-${entity.id}`;
                        if (existingChoicesSet.has(choiceKey)) {
                            // Skip this choice - it's already been made
                            continue;
                        }

                        const choice = await this.createPendingChoice(entity, progression, cacheService, editionId, allFeats);
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
     * Resolve a domain choice and return the granted features
     */
    static async resolveDomainChoice(
        domainId: number,
        sourceProgressions: FeatureProgression[],
        domainData?: { features?: FeatureProgression[] }
    ): Promise<FeatureProgression[]> {
        const grantedProgressions: FeatureProgression[] = [];

        // First, check if domain progressions already exist in source progressions
        for (const progression of sourceProgressions) {
            if (progression.domainId === domainId) {
                grantedProgressions.push(progression);
            }
        }

        // If no progressions found and domain data is provided, use it
        if (grantedProgressions.length === 0 && domainData?.features) {
            console.log(`✅ Using provided domain data with ${domainData.features.length} features`);
            grantedProgressions.push(...domainData.features);
        } else if (grantedProgressions.length === 0) {
            console.warn(`⚠️ No domain progressions found for domain ${domainId} and no domain data provided`);
        } else {
            console.log(`✅ Found ${grantedProgressions.length} existing domain progressions`);
        }

        return grantedProgressions;
    }

    /**
     * Resolve a feat choice and return the granted features
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

        // If no progressions found, fetch them from the API
        if (grantedProgressions.length === 0) {
            try {
                console.log(`🔍 Fetching feat features for feat ${featId}`);
                const response = await fetch(`/api/feats/${featId}`);
                if (response.ok) {
                    const featData = await response.json();
                    if (featData.features && featData.features.length > 0) {
                        console.log(`✅ Found ${featData.features.length} feat features`);
                        grantedProgressions.push(...featData.features);
                    } else {
                        console.warn(`⚠️ No features found for feat ${featId}`);
                    }
                } else {
                    console.error(`❌ Failed to fetch feat ${featId}: ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ Error fetching feat ${featId}:`, error);
            }
        } else {
            console.log(`✅ Found ${grantedProgressions.length} existing feat progressions`);
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

        // First, check if spell progressions already exist in source progressions
        for (const progression of sourceProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.appliesTo === EntityAppliesToType.Spell && entity.appliesToId === spellId) {
                        grantedProgressions.push(progression);
                    }
                }
            }
        }

        // If no progressions found, fetch them from the API
        if (grantedProgressions.length === 0) {
            try {
                console.log(`🔍 Fetching spell features for spell ${spellId}`);
                const response = await fetch(`/api/spells/${spellId}`);
                if (response.ok) {
                    const spellData = await response.json();
                    if (spellData.features && spellData.features.length > 0) {
                        console.log(`✅ Found ${spellData.features.length} spell features`);
                        grantedProgressions.push(...spellData.features);
                    } else {
                        console.warn(`⚠️ No features found for spell ${spellId}`);
                    }
                } else {
                    console.error(`❌ Failed to fetch spell ${spellId}: ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ Error fetching spell ${spellId}:`, error);
            }
        } else {
            console.log(`✅ Found ${grantedProgressions.length} existing spell progressions`);
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
     * Create a pending choice from a choice entity
     */
    private static async createPendingChoice(
        entity: FeatureEntity,
        progression: FeatureProgression,
        cacheService: CacheService,
        editionId?: number,
        allFeats?: FeatInQueryResponse[]
    ): Promise<PendingChoice | null> {
        if (!entity.appliesTo) {
            return null;
        }

        // For domain and feat choices, appliesToId can be null (player chooses from all available options)
        // For other choices, appliesToId should be specified
        if (entity.appliesTo !== EntityAppliesToType.Domain &&
            entity.appliesTo !== EntityAppliesToType.Feat &&
            !entity.appliesToId) {
            return null;
        }

        // Choice entities are already identified by EntityType.Choice

        const source = await this.getSourceName(progression, cacheService);

        // Create a more descriptive name based on the choice type
        let choiceName = '';
        if (entity.appliesTo === EntityAppliesToType.Domain) {
            choiceName = `${source}: Select a Domain`;
        } else if (entity.appliesTo === EntityAppliesToType.Feat) {
            // Check if this is a fighter bonus feat choice
            if (entity.filterType === FeatureFeatChoiceFilter.FighterBonus) {
                choiceName = `${source}: Select a Fighter Bonus Feat`;
            } else {
            choiceName = `${source}: Select a Feat`;
            }
        } else if (entity.appliesTo === EntityAppliesToType.Skill) {
            choiceName = `${source}: Select a Skill`;
        } else if (entity.appliesTo === EntityAppliesToType.Spell) {
            choiceName = `${source}: Select a Spell`;
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
            required: true, // TODO: Determine from entity properties
            options: await this.getChoiceOptions(entity, progression, cacheService, editionId, allFeats),
            maxSelections: entity.value || 1,
            minSelections: 1,
        };
    }


    /**
     * Get choice options based on entity type
     * Uses the pre-populated data from the FeatureProgression entities
     */
    private static async getChoiceOptions(entity: FeatureEntity, _progression: FeatureProgression, cacheService: CacheService, editionId?: number, allFeats?: FeatInQueryResponse[]): Promise<ChoiceOption[]> {
        const options: ChoiceOption[] = [];

        // The data is already populated by featureSystemService.getFeatureProgressionsByIds
        // which fetches all related data (domains, feats, features, spells, items)
        switch (entity.appliesTo) {
            case EntityAppliesToType.Domain:
                if (entity.domain) {
                    // Specific domain choice (entity.domain is populated)
                    options.push({
                        id: `domain-${entity.domain.id}`,
                        name: entity.domain.name,
                        description: `Domain: ${entity.domain.name}`,
                        value: entity.domain.id,
                        prerequisites: []
                    });
                } else {
                    // General domain choice (player chooses from all domains)
                    if (editionId) {
                        try {
                            const domains = await cacheService.getDomainSelectByEdition(editionId);
                            domains.forEach(domain => {
                                options.push({
                                    id: `domain-${domain.id}`,
                                    name: domain.name,
                                    description: `Domain: ${domain.name}`,
                                    value: domain.id,
                                    prerequisites: [] // No prerequisites for domains
                                });
                            });
                        } catch (error) {
                            console.error('Error fetching domains:', error);
                            // Fallback to placeholder
                            options.push({
                                id: 'domain-error',
                                name: 'Error loading domains',
                                description: 'Could not load domain options',
                                value: 0,
                                prerequisites: []
                            });
                        }
                    } else {
                        // No edition ID provided
                        options.push({
                            id: 'domain-no-edition',
                            name: 'No edition selected',
                            description: 'Please select an edition to see domain options',
                            value: 0,
                            prerequisites: []
                        });
                    }
                }
                break;
            case EntityAppliesToType.Feat:
                if (entity.feat) {
                    // Specific feat choice (entity.feat is populated)
                    options.push({
                        id: `feat-${entity.feat.id}`,
                        name: entity.feat.name,
                        description: entity.feat.description || `Feat: ${entity.feat.name}`,
                        value: entity.feat.id,
                        prerequisites: entity.feat.prerequisites ? [entity.feat.prerequisites] : []
                    });
                } else {
                    // General feat choice (player chooses from all available feats)
                    // Filter by filterType if specified (e.g., FighterBonus)
                    if (!allFeats || allFeats.length === 0) {
                        // No feats provided - add placeholder
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
                        } else if (entity.filterType === FeatureFeatChoiceFilter.MetamagicOrItemCreation) {
                            // Filter for metamagic or item creation feats
                            // This would need to be determined by feat category or flags
                            // For now, include all feats (can be refined later)
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
            case EntityAppliesToType.Skill:
                // Skills are handled by static data, not database entities
                // This would need to be handled differently
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
        }

        return options;
    }

    /**
     * Get source name for display
     */
    private static async getSourceName(progression: FeatureProgression, cacheService: CacheService): Promise<string> {
        if (progression.class?.name) {
            return progression.class.name;
        }

        // If class name is not populated but we have classId, fetch from cache
        if (progression.sourceType === 1 && progression.classId) {
            try {
                const classData = await cacheService.getClassNameById(progression.classId);
                if (classData?.name) {
                    return classData.name;
                }
            } catch (error) {
                console.error('Error fetching class name:', error);
            }
            return 'Class';
        }

        if (progression.sourceType === 0) {
            // Race source - check if we have raceId and can get race name from sharedData
            // Note: progression.race is not always populated, so we return generic "Race"
            // The actual race name should be passed via sharedData or resolved elsewhere
            // For now, return generic "Race" - this will be improved when race data is available in progression
            return 'Race';
        }

        if (progression.sourceType === 5) {
            return 'Domain';
        }

        // TODO: Add domain name resolution when those fields are available
        return 'Unknown Source';
    }
}
