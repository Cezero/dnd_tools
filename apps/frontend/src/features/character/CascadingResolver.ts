import { ChoiceResolver, FeatureEntityHandlers } from '@/features/character';
import { FeatureProgression } from '@shared/schema';
import { EntityAppliesToType, ResolutionStepType } from '@shared/static-data';

import type { CascadingResolutionResult, ResolutionStep, EntityProcessingResult } from './types';

/**
 * Service for handling cascading feature resolution
 */
export class CascadingResolver {
    private resolutionDepth = 0;
    private maxDepth = 10;
    private resolutionChain: ResolutionStep[] = [];
    private processedFeatures = new Set<number>();

    /**
     * Resolve cascading features from initial progressions
     */
    async resolveCascadingFeatures(
        initialProgressions: FeatureProgression[],
        userChoices?: Record<number, number[]>
    ): Promise<CascadingResolutionResult> {
        let currentProgressions = [...initialProgressions];
        let hasChanges = true;
        const warnings: string[] = [];
        const errors: string[] = [];

        this.resolutionDepth = 0;
        this.resolutionChain = [];
        this.processedFeatures.clear();

        while (hasChanges && this.resolutionDepth < this.maxDepth) {
            this.resolutionDepth++;

            const newProgressions = await this.resolveNextLevel(currentProgressions, userChoices);
            hasChanges = this.hasFeatureChanges(currentProgressions, newProgressions);
            currentProgressions = newProgressions;
        }

        if (this.resolutionDepth >= this.maxDepth) {
            warnings.push('Maximum resolution depth reached - possible circular dependency');
        }

        return {
            resolvedProgressions: currentProgressions,
            warnings,
            errors,
            resolutionChain: this.resolutionChain,
        };
    }

    /**
     * Resolve the next level of features
     */
    private async resolveNextLevel(
        currentProgressions: FeatureProgression[],
        userChoices?: Record<number, number[]>
    ): Promise<FeatureProgression[]> {
        const newProgressions: FeatureProgression[] = [...currentProgressions];

        // Process each progression for cascading effects
        for (const progression of currentProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);

                    // Check if this entity grants new features that need resolution
                    if (result.grants && result.grants.length > 0) {
                        await this.processGrantedFeatures(result, progression, newProgressions);
                    }
                }
            }
        }

        // Resolve user choices if provided
        if (userChoices) {
            await this.resolveUserChoices(userChoices, newProgressions);
        }

        return newProgressions;
    }

    /**
     * Process features granted by other features
     */
    private async processGrantedFeatures(
        result: EntityProcessingResult,
        sourceProgression: FeatureProgression,
        _progressions: FeatureProgression[]
    ): Promise<void> {
        const step: ResolutionStep = {
            step: this.resolutionChain.length + 1,
            description: `Processing granted features from ${sourceProgression.feature?.name || 'Unknown Feature'}`,
            source: this.getSourceName(sourceProgression),
            level: sourceProgression.level,
            type: ResolutionStepType.Grant,
            details: result as unknown,
        };

        this.resolutionChain.push(step);

        // Process granted entities
        if (result.grants) {
            for (const entity of result.grants) {
                // TODO: Process different types of granted entities
                // This would need to be implemented based on the actual entity types
                console.log('Processing granted entity:', entity);
            }
        }
    }

    /**
     * Process a granted feat
     */
    private async processGrantedFeat(_feat: unknown, _progressions: FeatureProgression[]): Promise<void> {
        // TODO: Implement feat processing
        // This would involve:
        // 1. Finding the feat's feature progressions
        // 2. Adding them to the character's progressions
        // 3. Processing any entities in those progressions
    }

    /**
     * Process a granted spell
     */
    private async processGrantedSpell(_spell: unknown, _progressions: FeatureProgression[]): Promise<void> {
        // TODO: Implement spell processing
        // This would involve:
        // 1. Adding the spell to the character's spell list
        // 2. Processing any spell-related features
    }

    /**
     * Process a granted special ability
     */
    private async processGrantedAbility(_ability: unknown, _progressions: FeatureProgression[]): Promise<void> {
        // TODO: Implement ability processing
        // This would involve:
        // 1. Adding the ability to the character's abilities
        // 2. Processing any ability-related features
    }

    /**
     * Resolve user choices and their cascading effects
     */
    private async resolveUserChoices(
        userChoices: Record<number, number[]>,
        progressions: FeatureProgression[]
    ): Promise<void> {
        // Generic choice resolution - handle any appliesTo type
        for (const [appliesToType, selectedIds] of Object.entries(userChoices)) {
            for (const selectedId of selectedIds) {
                const grantedProgressions = await this.resolveGenericChoice(parseInt(appliesToType), selectedId, progressions);
                progressions.push(...grantedProgressions);

                const step: ResolutionStep = {
                    step: this.resolutionChain.length + 1,
                    description: `Resolved choice (type ${appliesToType}): ${selectedId}`,
                    source: 'User Choice',
                    level: 1,
                    type: ResolutionStepType.Choice,
                    details: { appliesToType: parseInt(appliesToType), selectedId, grantedProgressions: grantedProgressions.length },
                };
                this.resolutionChain.push(step);
            }
        }
    }

    /**
     * Resolve a generic choice by appliesTo type and selected ID
     */
    private async resolveGenericChoice(appliesToType: number, selectedId: number, progressions: FeatureProgression[]): Promise<FeatureProgression[]> {
        // Map appliesTo type to the appropriate ChoiceResolver method
        switch (appliesToType) {
            case EntityAppliesToType.Domain: // EntityAppliesToType.Domain
                return await ChoiceResolver.resolveDomainChoice(selectedId, progressions);
            case EntityAppliesToType.Feat: // EntityAppliesToType.Feat
                return await ChoiceResolver.resolveFeatChoice(selectedId, progressions);
            case EntityAppliesToType.Feature: // EntityAppliesToType.Feature
                return await ChoiceResolver.resolveFeatureChoice(selectedId, progressions);
            case EntityAppliesToType.Spell: // EntityAppliesToType.Spell
                return await ChoiceResolver.resolveSpellChoice(selectedId, progressions);
            case EntityAppliesToType.Skill: // EntityAppliesToType.Skill
                return await ChoiceResolver.resolveSkillChoice(selectedId, progressions);
            default:
                console.warn(`Unknown appliesTo type: ${appliesToType}`);
                return [];
        }
    }

    /**
     * Check if there are changes between two sets of progressions
     */
    private hasFeatureChanges(
        oldProgressions: FeatureProgression[],
        newProgressions: FeatureProgression[]
    ): boolean {
        if (oldProgressions.length !== newProgressions.length) {
            return true;
        }

        // Check if any progressions have changed
        for (let i = 0; i < oldProgressions.length; i++) {
            if (oldProgressions[i].id !== newProgressions[i].id) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get source name for display
     */
    private getSourceName(progression: FeatureProgression): string {
        if (progression.class?.name) {
            return progression.class.name;
        }
        // TODO: Add race and domain name resolution when those relationships are populated
        return 'Unknown Source';
    }
}
