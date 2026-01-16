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
     * Process features granted by other features.
     * 
     * When a feature entity grants another feature (e.g., a feat granting domain features),
     * this method resolves the granted feature and adds it to the progressions array.
     * This enables cascading resolution to continue detecting new features.
     * 
     * Examples:
     * - Ranger features that grant feats (e.g., Track feat)
     * - Fighting Style choices that determine other features
     * - Features that grant feats which in turn grant more features (multi-level cascading)
     * 
     * @param result - Entity processing result containing granted entities
     * @param sourceProgression - The progression that granted these features
     * @param progressions - Array of progressions to add granted features to (modified in place)
     * 
     * @example
     * ```typescript
     * // Entity grants a feat (appliesTo: Feat, appliesToId: 123)
     * const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
     * await this.processGrantedFeatures(result, progression, progressions);
     * // progressions now includes the feat's feature progressions
     * ```
     */
    private async processGrantedFeatures(
        result: EntityProcessingResult,
        sourceProgression: FeatureProgression,
        progressions: FeatureProgression[]
    ): Promise<void> {
        if (!result.grants || result.grants.length === 0) {
            return;
        }

        for (const entity of result.grants) {
            // Only process entities that can grant features (have appliesTo and appliesToId)
            if (!entity.appliesTo || !entity.appliesToId) {
                continue;
            }

            // Resolve the granted feature using ChoiceResolver
            const grantedProgressions = await ChoiceResolver.resolveChoiceByType(
                entity.appliesTo,
                entity.appliesToId,
                progressions
            );

            // Add progressions using utility function (no entity processing needed here,
            // as entities will be processed in the next iteration of the cascading loop)
            ChoiceResolver.addResolvedProgressions(progressions, grantedProgressions);
        }
    }

    /**
     * Resolve user choices and their cascading effects.
     * 
     * Processes user-selected choices (e.g., domain selections, feat choices) and adds
     * the granted feature progressions to the progressions array. Uses the centralized
     * utility function to avoid duplicate code.
     * 
     * @param userChoices - Record mapping appliesTo types to arrays of selected IDs
     * @param progressions - Array of progressions to add granted features to (modified in place)
     */
    private async resolveUserChoices(
        userChoices: Record<number, number[]>,
        progressions: FeatureProgression[]
    ): Promise<void> {
        // Generic choice resolution - handle any appliesTo type
        for (const [appliesToType, selectedIds] of Object.entries(userChoices)) {
            for (const selectedId of selectedIds) {
                const grantedProgressions = await ChoiceResolver.resolveChoiceByType(
                    parseInt(appliesToType),
                    selectedId,
                    progressions
                );

                // Add progressions using utility function (no entity processing needed here,
                // as entities will be processed in the next iteration of the cascading loop)
                ChoiceResolver.addResolvedProgressions(progressions, grantedProgressions);
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










