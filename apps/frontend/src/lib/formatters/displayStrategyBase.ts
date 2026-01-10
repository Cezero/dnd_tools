import type { QueryClient } from '@tanstack/react-query';

import type {
    FeatureProgression,
    FeatureEntity,
    FeaturePrerequisite
} from '@shared/schema';
import {
    EntityType,
    EntityAppliesToType,
    FormulaId
} from '@shared/static-data';


import { formatterRegistry } from './formatter-registry';
import {
    ValueGenerationPhase,
    FormattingPhase,
    GroupingPhase,
    ProgressionGroupingPhase
} from './phases';
import type {
    DisplayContext,
    DisplayResult,
    DisplayStrategy,
    ProgressionValue,
    ProcessingConfig,
    ProcessingContext,
    BaseProcessingResult,
    CalculationContext,
    GroupedLevelItem,
    CalculatedValueWithLevel,
    CalculatedEntity
} from './types';
import {
    BreakdownAnalyzer,
    RegistryManager
} from './utils';
import { extractEntityIdsForPrecaching } from './utils/entity-extractor';
import {
    precacheFeat,
    precacheFeature,
    precacheSpell,
    precacheDomain,
    precacheClass,
    precacheSkill,
    precacheRace,
} from './utils/precache-helpers';

// Constants
const MAX_CHARACTER_LEVEL = 20; // D&D standard maximum character level

abstract class DisplayStrategyBase implements DisplayStrategy {
    // Phase instances
    protected readonly valueGenerationPhase = new ValueGenerationPhase();
    protected readonly formattingPhase = new FormattingPhase();
    protected readonly groupingPhase = new GroupingPhase();
    protected readonly progressionGroupingPhase = new ProgressionGroupingPhase();

    // Utility instances
    protected readonly breakdownAnalyzer = new BreakdownAnalyzer();
    protected readonly registryManager = new RegistryManager();
    /**
     * Unified entry point for formatting feature progressions
     * Converts single progression to array and delegates to formatProgressions
     */
    format(
        input: FeatureProgression | FeatureProgression[],
        context?: DisplayContext,
        showLabels: boolean = true
    ): DisplayResult {
        const progressions = Array.isArray(input) ? input : [input];
        return this.formatProgressions(progressions, context, showLabels);
    }

    /**
     * Protected method for subclasses to implement their specific formatting logic
     * This is called internally by format() and should not be called directly by external code
     */
    protected abstract formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        showLabels?: boolean
    ): DisplayResult;

    /**
     * Generates calculated values for a progression. Can be overridden by subclasses
     * to implement custom filtering or processing logic.
     */
    protected generateValues(
        progression: FeatureProgression,
        context?: DisplayContext,
    ): CalculatedValueWithLevel[] {
        return this.valueGenerationPhase.generateValues(progression, context);
    }

    /**
     * Orchestrate the complete 6-phase formatting process for a single progression
     * This is the core orchestration method that coordinates all phases
     */
    protected orchestrateFormatting(
        progression: FeatureProgression,
        context?: DisplayContext,
        showLabels: boolean = true
    ): DisplayResult {
        // Phase 1: Value Generation & Calculation
        const calculatedValues = this.generateValues(progression, context);

        // Phase 2: Pure Formatting - Format individual calculated values
        const formattedItems = this.formattingPhase.formatItems(calculatedValues, progression.level, showLabels, context);

        // Phase 3: Within-Level Grouping
        const withinLevelGrouped = this.groupingPhase.groupWithinLevel(formattedItems, progression, context);

        // Phase 4: Within-Progression Grouping
        const withinProgressionGrouped = this.progressionGroupingPhase.groupWithinProgression(withinLevelGrouped);

        // Phase 5: Display-Specific Final Grouping
        const result = this.createDisplayResult(withinProgressionGrouped, context, progression);

        // Phase 6: Format Prerequisites (if feature has prerequisites)
        if (progression.feature?.prerequisites && progression.feature.prerequisites.length > 0) {
            const formatted = this.formatPrerequisites(
                progression.feature.prerequisites,
                context
            );
            result.formattedPrerequisites = formatted;
        }
        return result;
    }

    /**
     * Determine if progression generation is needed based on formula properties
     */
    protected shouldGenerateProgression(progression: FeatureProgression, _context?: DisplayContext): boolean {
        const hasProgressionEntities = progression.entities?.some(e =>
            e.formulaParams
        );

        return hasProgressionEntities;
    }

    /**
     * Phase 1: Progression Generation for a specific entity
     * Generate progression values for a single formula-based entity
     */
    protected generateProgressionValuesForSingleEntity(
        formulaEntity: FeatureEntity,
        progression: FeatureProgression,
        context?: DisplayContext
    ): ProgressionValue[] {
        if (!formulaEntity.formulaParams) {
            return [];
        }

        const calculationContext: CalculationContext = {
            level: progression.level,
            progressionLevel: progression.level,
            characterLevel: context?.currentLevel,
            character: context?.character
        };

        // Use registry to get progression generator and formula calculator
        const progressionGenerator = this.registryManager.getDefaultProgressionGenerator();
        const formulaCalculator = this.registryManager.getFormulaCalculator(formulaEntity.formulaParams.formulaId);
        if (!progressionGenerator) {
            return [];
        }

        // For CONDITIONAL_SCALING, start at the first threshold level instead of progression.level
        let startLevel = progression.level;
        if (formulaEntity.formulaParams.formulaId === FormulaId.CONDITIONAL_SCALING &&
            formulaEntity.formulaParams.thresholds &&
            formulaEntity.formulaParams.thresholds.length > 0) {
            // Start at the first threshold level for conditional scaling
            startLevel = Math.min(...formulaEntity.formulaParams.thresholds);
        }

        // Generate all values using the progression generator
        // The progression generator handles character-dependent formulas internally
        return progressionGenerator.generateValues({
            formula: formulaEntity.formulaParams,
            startLevel,
            endLevel: MAX_CHARACTER_LEVEL,
            context: calculationContext,
            entityValue: formulaEntity.value || 0, // Use entity value, default to 0 if null
            formulaCalculator,
            originalEntity: formulaEntity // Pass the original entity for creating modified version
        });
    }

    /**
     * Phase 6: Display-Specific Final Grouping
     * Apply display-specific final grouping logic
     * This method must be overridden by display type specific strategies
     */
    protected abstract createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        progression?: FeatureProgression
    ): DisplayResult;

    /**
     * Format prerequisites for display
     * This is called as part of the orchestration phase (Phase 6)
     * Uses the formatter registry (PrerequisiteFormatter) to format prerequisites consistently with other entities.
     * Converts FeaturePrerequisite objects to CalculatedEntity format for formatting.
     */
    protected formatPrerequisites(
        prerequisites: FeaturePrerequisite[],
        context?: DisplayContext
    ): string[] {
        if (!prerequisites || prerequisites.length === 0) {
            return [];
        }

        // Get the prerequisite formatter from registry
        const formatter = formatterRegistry.getFormatter(EntityType.Other, EntityAppliesToType.Prerequisite);
        if (!formatter) {
            // Fallback if formatter not found
            console.warn('PrerequisiteFormatter not found in registry');
            return prerequisites.map(prereq => `Prerequisite ${prereq.id || ''}`);
        }

        // Convert each FeaturePrerequisite to CalculatedEntity format for formatting
        const result = prerequisites.map(prereq => {
            // Convert FeaturePrerequisite to CalculatedEntity-like structure
            // Store prerequisite type in filterType (since appliesTo is for EntityAppliesToType, not FeaturePrerequisiteType)
            // Store appliesToId and minValue in their respective fields
            // Ensure type is a number (FeaturePrerequisiteType is a number enum)
            const prereqTypeValue = typeof prereq.type === 'number' ? prereq.type : Number(prereq.type);

            const entityLike: CalculatedEntity = {
                id: prereq.id,
                progressionId: 0, // Prerequisites don't belong to progressions
                type: EntityType.Other,
                appliesTo: EntityAppliesToType.Prerequisite, // Use Prerequisite appliesTo type
                appliesToId: prereq.appliesToId,
                appliesToSubId: null,
                value: prereq.minValue, // Store minValue in value field
                bonusType: null,
                formulaParamsId: null,
                groupingId: 0,
                displayInDetail: true,
                filterType: prereqTypeValue, // Store FeaturePrerequisiteType in filterType (this is a number enum value)
            };

            // Format using the formatter
            let formattedValue = formatter.format(entityLike, context);

            // Prerequisites don't need labelers - they're already fully formatted by the formatter
            // (e.g., "Perform 6 ranks" doesn't need a "Prerequisite:" prefix)
            // Skip labeler application for prerequisites

            // Debug logging
            if (!formattedValue || formattedValue.trim() === '') {
                console.warn('PrerequisiteFormatter returned empty string for prerequisite:', {
                    prereq,
                    entityLike,
                    filterType: entityLike.filterType,
                    appliesToId: entityLike.appliesToId,
                    minValue: entityLike.value,
                    prereqType: prereq.type
                });
                // Return a fallback instead of empty string
                return `Prerequisite ${prereq.id || ''}`;
            }

            return formattedValue;
        });

        return result;
    }


    protected processEntity(
        entity: FeatureEntity,
        config: ProcessingConfig,
        _context: ProcessingContext
    ): BaseProcessingResult {
        try {
            const formatter = this.registryManager.getFormatter(config.entityType, config.subTypeId);
            if (!formatter) {
                return {
                    formattedValue: `Unknown formatter for ${config.entityType}`,
                    success: false,
                    error: `No formatter found for entity type ${config.entityType}`,
                    breakdown: { components: [] }
                };
            }
            // Extract DisplayContext from ProcessingContext if available
            const displayContext = _context.context;
            const formattedValue = formatter.format(entity as CalculatedEntity, displayContext);

            return {
                formattedValue,
                success: true,
                breakdown: { components: [] }
            };
        } catch (error) {
            return {
                formattedValue: `Error processing entity`,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                breakdown: { components: [] }
            };
        }
    }

    /**
     * Static method to precache all entities referenced in feature progressions.
     * This can be called imperatively before formatting when not using the React hook.
     *
     * @param progressions - Feature progressions to extract entity IDs from
     * @param queryClient - TanStack Query client for cache access
     * @returns Promise that resolves when all entities are precached
     *
     * @example
     * ```typescript
     * await DisplayStrategyBase.precacheEntities(progressions, queryClient);
     * const result = strategy.format(progressions);
     * ```
     */
    static async precacheEntities(
        progressions: FeatureProgression[],
        queryClient: QueryClient
    ): Promise<void> {
        if (!progressions || progressions.length === 0) {
            return;
        }

        // Extract all entity IDs that need precaching
        const entityIds = extractEntityIdsForPrecaching(progressions);

        // Create promises for all precaching operations
        const precachePromises: Promise<void>[] = [];

        // Precache feats
        for (const featId of entityIds.featIds) {
            precachePromises.push(precacheFeat(queryClient, featId));
        }

        // Precache features
        for (const featureId of entityIds.featureIds) {
            precachePromises.push(precacheFeature(queryClient, featureId));
        }

        // Precache spells
        for (const spellId of entityIds.spellIds) {
            precachePromises.push(precacheSpell(queryClient, spellId));
        }

        // Precache domains
        for (const domainId of entityIds.domainIds) {
            precachePromises.push(precacheDomain(queryClient, domainId));
        }

        // Precache classes
        for (const classId of entityIds.classIds) {
            precachePromises.push(precacheClass(queryClient, classId));
        }

        // Precache skills
        for (const skillId of entityIds.skillIds) {
            precachePromises.push(precacheSkill(queryClient, skillId));
        }

        // Precache races
        for (const raceId of entityIds.raceIds) {
            precachePromises.push(precacheRace(queryClient, raceId));
        }

        // Wait for all precaching to complete
        await Promise.all(precachePromises);
    }
}

export { DisplayStrategyBase };
