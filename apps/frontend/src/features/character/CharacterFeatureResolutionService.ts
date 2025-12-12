import { CascadingResolver, ChoiceResolver, FeatureEntityHandlers, GestaltClassService } from '@/features/character';
import { FeatureEntity, CharacterWithAllDetailsResponse, DnDClass, FeatureProgression } from '@shared/schema';
import { CoreComponent, EntityAppliesToType } from '@shared/static-data';

import type { ResolutionContext, ResolutionResult, PendingChoice } from './types';

/**
 * Main service for resolving character features
 */
export class CharacterFeatureResolutionService {
    /**
     * Main entry point for resolving all character features at a given level
     * Returns processed FeatureProgression[] with source attribution
     */
    static async resolveCharacterFeatures(
        character: CharacterWithAllDetailsResponse,
        targetLevel: number,
        context: ResolutionContext,
        cacheService?: { getClassNameById: (id: number) => CoreComponent | undefined; getDomainSelectByEdition: (editionId: number) => CoreComponent[] }
    ): Promise<ResolutionResult> {
        const resolution = new FeatureResolution(character, targetLevel, context);

        // Phase 1: Resolve base features (race, class)
        await resolution.resolveBaseFeatures();

        // Phase 2: Handle gestalt merging (if applicable)
        if (context.isGestalt && context.classDetails && context.secondaryClassDetails) {
            await resolution.resolveGestaltMerging();
        }

        // Phase 3: Identify pending choices
        await resolution.identifyPendingChoices(cacheService);

        // Phase 4: Resolve user choices (if provided)
        if (context.userChoices) {
            await resolution.resolveUserChoices(context.userChoices);
        }

        // Phase 5: Resolve granted features from choices
        await resolution.resolveGrantedFeatures();

        // Phase 6: Final feature compilation
        return resolution.compileFinalFeatures();
    }
}

/**
 * Core feature resolution logic
 */
class FeatureResolution {
    private character: CharacterWithAllDetailsResponse;
    private targetLevel: number;
    private context: ResolutionContext;
    private resolvedProgressions: FeatureProgression[] = [];
    private pendingChoices: PendingChoice[] = [];
    private warnings: string[] = [];
    private errors: string[] = [];
    private resolutionDepth = 0;

    constructor(character: CharacterWithAllDetailsResponse, targetLevel: number, context: ResolutionContext) {
        this.character = character;
        this.targetLevel = targetLevel;
        this.context = context;
    }

    /**
     * Resolve base features from race and class
     */
    async resolveBaseFeatures(): Promise<void> {
        // Resolve racial features
        if (this.context.raceDetails) {
            await this.resolveRacialFeatures();
        }

        // Resolve class features
        if (this.context.classDetails) {
            await this.resolveClassFeatures(this.context.classDetails);
        }
    }

    /**
     * Resolve gestalt merging for primary and secondary classes
     */
    async resolveGestaltMerging(): Promise<void> {
        if (!this.context.classDetails || !this.context.secondaryClassDetails) {
            return;
        }

        // Merge classes according to gestalt rules
        const mergedClass = GestaltClassService.mergeClasses(
            this.context.classDetails,
            this.context.secondaryClassDetails
        );

        // Update context with merged class
        this.context.effectiveClassDetails = mergedClass;

        // Process merged features
        await this.resolveClassFeatures(mergedClass);
    }

    /**
     * Identify pending choices that need user input
     */
    async identifyPendingChoices(cacheService?: { getClassNameById: (id: number) => CoreComponent | undefined; getDomainSelectByEdition: (editionId: number) => CoreComponent[] }): Promise<void> {
        if (!this.context.includePendingChoices) {
            return;
        }

        // Use choice resolver to identify pending choices
        // If no cache service provided, use minimal fallback
        const service = cacheService || {
            getClassNameById: (_id: number) => undefined,
            getDomainSelectByEdition: (_editionId: number) => []
        };
        this.pendingChoices = ChoiceResolver.identifyPendingChoices(this.resolvedProgressions, service);
    }

    /**
     * Resolve user choices and their grants
     */
    async resolveUserChoices(userChoices: NonNullable<ResolutionContext['userChoices']>): Promise<void> {
        // Generic choice resolution - handle any appliesTo type
        for (const [appliesToType, selectedIds] of Object.entries(userChoices)) {
            for (const selectedId of selectedIds) {
                await this.resolveGenericChoice(parseInt(appliesToType), selectedId);
            }
        }
    }

    /**
     * Resolve a generic choice by appliesTo type and selected ID
     */
    private async resolveGenericChoice(appliesToType: number, selectedId: number): Promise<void> {
        // Use ChoiceResolver methods directly instead of fetchEntityFeatures
        const grantedProgressions = await this.resolveGenericChoiceWithResolver(appliesToType, selectedId);

        if (grantedProgressions && grantedProgressions.length > 0) {
            // Process each feature progression
            for (const progression of grantedProgressions) {
                if (progression.entities) {
                    for (const entity of progression.entities) {
                        const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                        this.processEntityResult(result, progression);
                    }
                }
                this.resolvedProgressions.push(progression);
            }
        }
    }

    /**
     * Resolve a generic choice using ChoiceResolver methods
     */
    private async resolveGenericChoiceWithResolver(appliesToType: number, selectedId: number): Promise<FeatureProgression[]> {
        // Map appliesTo type to the appropriate ChoiceResolver method
        switch (appliesToType) {
            case EntityAppliesToType.Domain:
                return await ChoiceResolver.resolveDomainChoice(selectedId, this.resolvedProgressions);
            case EntityAppliesToType.Feat:
                return await ChoiceResolver.resolveFeatChoice(selectedId, this.resolvedProgressions);
            case EntityAppliesToType.Feature:
                return await ChoiceResolver.resolveFeatureChoice(selectedId, this.resolvedProgressions);
            case EntityAppliesToType.Spell:
                return await ChoiceResolver.resolveSpellChoice(selectedId, this.resolvedProgressions);
            case EntityAppliesToType.Skill:
                return await ChoiceResolver.resolveSkillChoice(selectedId, this.resolvedProgressions);
            default:
                console.warn(`Unknown appliesTo type: ${appliesToType}`);
                return [];
        }
    }

    /**
     * Map appliesTo type to entity type for fetching features
     */
    private getEntityTypeFromAppliesTo(appliesToType: number): string {
        // Map EntityAppliesToType to the entity type string used by fetchEntityFeatures
        switch (appliesToType) {
            case EntityAppliesToType.Domain: // EntityAppliesToType.Domain
                return 'domains';
            case EntityAppliesToType.Feat: // EntityAppliesToType.Feat
                return 'feats';
            case EntityAppliesToType.Feature: // EntityAppliesToType.Feature
                return 'features';
            case EntityAppliesToType.Spell: // EntityAppliesToType.Spell
                return 'spells';
            case EntityAppliesToType.Skill: // EntityAppliesToType.Skill
                return 'skills';
            default:
                console.warn(`Unknown appliesTo type: ${appliesToType}`);
                return 'unknown';
        }
    }

    /**
     * Resolve granted features from choices
     */
    async resolveGrantedFeatures(): Promise<void> {
        if (!this.context.resolveCascading) {
            return;
        }

        // Use cascading resolver to handle granted features
        const cascadingResolver = new CascadingResolver();
        const result = await cascadingResolver.resolveCascadingFeatures(
            this.resolvedProgressions,
            this.context.userChoices
        );

        // Merge results
        this.resolvedProgressions = result.resolvedProgressions;
        this.warnings.push(...result.warnings);
        this.errors.push(...result.errors);
    }

    /**
     * Compile final resolved features
     */
    compileFinalFeatures(): ResolutionResult {
        return {
            resolvedProgressions: this.resolvedProgressions,
            pendingChoices: this.pendingChoices,
            warnings: this.warnings,
            errors: this.errors,
        };
    }

    // Private helper methods
    private async resolveRacialFeatures(): Promise<void> {
        if (!this.context.raceDetails || !this.context.raceDetails.features) {
            return;
        }

        // Use the feature progressions that are already available in the race data
        const racialProgressions = this.context.raceDetails.features;

        // Process each racial progression
        for (const progression of racialProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                    // Process the result (class skills, proficiencies, etc.)
                    this.processEntityResult(result, progression);
                }
            }
            this.resolvedProgressions.push(progression);
        }
    }

    private async resolveClassFeatures(classDetails: DnDClass): Promise<void> {
        if (!classDetails || !classDetails.features) {
            return;
        }

        // Use the feature progressions that are already available in the class data
        const classProgressions = classDetails.features;

        // Process each class progression
        for (const progression of classProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                    // Process the result (class skills, proficiencies, etc.)
                    this.processEntityResult(result, progression);
                }
            }
            this.resolvedProgressions.push(progression);
        }
    }

    /**
     * Process the result of entity processing
     */
    private processEntityResult(result: { grants: FeatureEntity[]; warnings?: string[]; errors?: string[] }, _progression: FeatureProgression): void {
        // Handle warnings and errors
        if (result.warnings) {
            this.warnings.push(...result.warnings);
        }
        if (result.errors) {
            this.errors.push(...result.errors);
        }

        // Process grants - the entities themselves contain all the information needed
        // The FeatureProgression already has source attribution (sourceType, classId, raceId, etc.)
        // No need to duplicate this information
    }

    private async processChoiceEntity(_entity: unknown, _progression: FeatureProgression): Promise<void> {
        // TODO: Implement choice entity processing
        // This will be implemented in the choice system phase
    }

    /**
     * Fetch entity features from the backend based on choice type
     */
    private async fetchEntityFeatures(choiceType: string, entityId: number): Promise<FeatureProgression[]> {
        try {
            let apiPath: string;
            let featuresField: string;

            switch (choiceType) {
                case 'domains':
                    apiPath = `/api/domains/${entityId}`;
                    featuresField = 'features';
                    break;
                case 'feats':
                    apiPath = `/api/feats/${entityId}`;
                    featuresField = 'features';
                    break;
                case 'spells':
                    apiPath = `/api/spells/${entityId}`;
                    featuresField = 'features';
                    break;
                case 'features':
                    apiPath = `/api/features/${entityId}`;
                    featuresField = 'progressions';
                    break;
                default:
                    console.warn(`Unknown choice type: ${choiceType}`);
                    return [];
            }

            const response = await fetch(apiPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${choiceType}: ${response.statusText}`);
            }

            const entity = await response.json();

            // Return the entity's features (feature progressions)
            return entity[featuresField] || [];
        } catch (error) {
            console.error(`Error fetching ${choiceType} features:`, error);
            return [];
        }
    }

    private async resolveDomainChoice(domainId: number): Promise<void> {
        const domainFeatures = await this.fetchEntityFeatures('domains', domainId);
        if (domainFeatures && domainFeatures.length > 0) {
            // Process each domain progression
            for (const progression of domainFeatures) {
                if (progression.entities) {
                    for (const entity of progression.entities) {
                        const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                        this.processEntityResult(result, progression);
                    }
                }
                this.resolvedProgressions.push(progression);
            }
        }
    }

    private async resolveFeatChoice(featId: number): Promise<void> {
        const featFeatures = await this.fetchEntityFeatures('feats', featId);
        if (featFeatures && featFeatures.length > 0) {
            // Process each feat progression
            for (const progression of featFeatures) {
                if (progression.entities) {
                    for (const entity of progression.entities) {
                        const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                        this.processEntityResult(result, progression);
                    }
                }
                this.resolvedProgressions.push(progression);
            }
        }
    }

    private async resolveSkillChoice(skillId: number): Promise<void> {
        // Skills typically don't have features, but may grant bonuses or other effects
        // This would need to be implemented based on the skill system
        console.log('Resolving skill choice:', skillId);
        // TODO: Implement skill choice resolution based on skill system requirements
    }

    private async resolveSpellChoice(spellId: number): Promise<void> {
        const spellFeatures = await this.fetchEntityFeatures('spells', spellId);
        if (spellFeatures && spellFeatures.length > 0) {
            // Process each spell progression
            for (const progression of spellFeatures) {
                if (progression.entities) {
                    for (const entity of progression.entities) {
                        const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                        this.processEntityResult(result, progression);
                    }
                }
                this.resolvedProgressions.push(progression);
            }
        }
    }

    private async resolveFeatureChoice(featureId: number): Promise<void> {
        const featureProgressions = await this.fetchEntityFeatures('features', featureId);
        if (featureProgressions && featureProgressions.length > 0) {
            // Process each feature progression
            for (const progression of featureProgressions) {
                if (progression.entities) {
                    for (const entity of progression.entities) {
                        const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                        this.processEntityResult(result, progression);
                    }
                }
                this.resolvedProgressions.push(progression);
            }
        }
    }
}
