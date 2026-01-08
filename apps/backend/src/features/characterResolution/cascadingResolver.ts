import type { FeatureProgression } from '@shared/schema';

import { ChoiceResolver } from './choiceResolver';
import { FeatureEntityHandlers } from './featureEntityHandlers';
import type { EntityProcessingResult } from './featureEntityHandlers';

/**
 * Result of cascading resolution
 */
export interface CascadingResolutionResult {
    resolvedProgressions: FeatureProgression[];
    warnings: string[];
    errors: string[];
}

/**
 * Backend service for handling cascading feature resolution.
 * 
 * Processes features that grant other features recursively, handling circular
 * dependencies and depth limits. Continues resolution until no new features
 * are granted or maximum depth is reached.
 */
export class CascadingResolver {
    private resolutionDepth = 0;
    private maxDepth = 10;

    /**
     * Resolves cascading features from initial progressions.
     * 
     * Iteratively processes features that grant other features until no new
     * features are discovered or maximum depth is reached. Handles user choices
     * during the resolution process.
     * 
     * @returns Complete resolution result with all cascading features resolved
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
        _sourceProgression: FeatureProgression,
        _progressions: FeatureProgression[]
    ): Promise<void> {
        // Process granted entities
        if (result.grants) {
            for (const _entity of result.grants) {
                // TODO: Process different types of granted entities
                // This would need to be implemented based on the actual entity types
                //console.log('Processing granted entity:', entity);
            }
        }
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
                const grantedProgressions = await ChoiceResolver.resolveChoiceByType(parseInt(appliesToType), selectedId, progressions);

                // Only add progressions that don't already exist to avoid duplicates
                for (const progression of grantedProgressions) {
                    const existingProgression = progressions.find(p => p.id === progression.id);
                    if (!existingProgression) {
                        progressions.push(progression);
                    }
                }
            }
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
}










