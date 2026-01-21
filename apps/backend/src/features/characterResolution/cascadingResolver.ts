import type { FeatureWithRelations } from '@shared/schema';

import { ChoiceResolver } from './choiceResolver';
import { FeatureEntityHandlers } from './featureEntityHandlers';
import type { EntityProcessingResult } from './featureEntityHandlers';

/**
 * Result of cascading resolution
 */
export interface CascadingResolutionResult {
    resolvedProgressions: FeatureWithRelations[];
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
     * Resolves cascading features from initial features.
     * 
     * Iteratively processes features that grant other features until no new
     * features are discovered or maximum depth is reached. Handles user choices
     * during the resolution process.
     * 
     * @returns Complete resolution result with all cascading features resolved
     */
    async resolveCascadingFeatures(
        initialProgressions: FeatureWithRelations[],
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
        currentProgressions: FeatureWithRelations[],
        userChoices?: Record<number, number[]>
    ): Promise<FeatureWithRelations[]> {
        const newProgressions: FeatureWithRelations[] = [...currentProgressions];

        // Process each feature for cascading effects
        for (const feature of currentProgressions) {
            if (feature.entities) {
                for (const entity of feature.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, feature);

                    // Check if this entity grants new features that need resolution
                    if (result.grants && result.grants.length > 0) {
                        await this.processGrantedFeatures(result, feature, newProgressions);
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
     * this method resolves the granted feature and adds it to the features array.
     * This enables cascading resolution to continue detecting new features.
     * 
     * Examples:
     * - Ranger features that grant feats (e.g., Track feat)
     * - Fighting Style choices that determine other features
     * - Features that grant feats which in turn grant more features (multi-level cascading)
     * 
     * @param result - Entity processing result containing granted entities
     * @param sourceProgression - The feature that granted these features
     * @param features - Array of features to add granted features to (modified in place)
     * 
     * @example
     * ```typescript
     * // Entity grants a feat (appliesTo: Feat, appliesToId: 123)
     * const result = FeatureEntityHandlers.processFeatureEntity(entity, feature);
     * await this.processGrantedFeatures(result, feature, features);
     * // features now includes the feat's feature features
     * ```
     */
    private async processGrantedFeatures(
        result: EntityProcessingResult,
        sourceProgression: FeatureWithRelations,
        features: FeatureWithRelations[]
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
                features
            );

            // Add features using utility function (no entity processing needed here,
            // as entities will be processed in the next iteration of the cascading loop)
            ChoiceResolver.addResolvedProgressions(features, grantedProgressions);
        }
    }

    /**
     * Resolve user choices and their cascading effects.
     * 
     * Processes user-selected choices (e.g., domain selections, feat choices) and adds
     * the granted feature features to the features array. Uses the centralized
     * utility function to avoid duplicate code.
     * 
     * @param userChoices - Record mapping appliesTo types to arrays of selected IDs
     * @param features - Array of features to add granted features to (modified in place)
     */
    private async resolveUserChoices(
        userChoices: Record<number, number[]>,
        features: FeatureWithRelations[]
    ): Promise<void> {
        // Generic choice resolution - handle any appliesTo type
        for (const [appliesToType, selectedIds] of Object.entries(userChoices)) {
            for (const selectedId of selectedIds) {
                const grantedProgressions = await ChoiceResolver.resolveChoiceByType(
                    parseInt(appliesToType),
                    selectedId,
                    features
                );

                // Add features using utility function (no entity processing needed here,
                // as entities will be processed in the next iteration of the cascading loop)
                ChoiceResolver.addResolvedProgressions(features, grantedProgressions);
            }
        }
    }

    /**
     * Check if there are changes between two sets of features
     */
    private hasFeatureChanges(
        oldProgressions: FeatureWithRelations[],
        newProgressions: FeatureWithRelations[]
    ): boolean {
        if (oldProgressions.length !== newProgressions.length) {
            return true;
        }

        // Check if any features have changed
        for (let i = 0; i < oldProgressions.length; i++) {
            if (oldProgressions[i].id !== newProgressions[i].id) {
                return true;
            }
        }

        return false;
    }
}










