import type {
    FeatureProgression,
    FeatureEntity
} from '@shared/schema';
import {
    FormulaId
} from '@shared/static-data';

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
        const withinLevelGrouped = this.groupingPhase.groupWithinLevel(formattedItems, progression);

        // Phase 4: Within-Progression Grouping
        const withinProgressionGrouped = this.progressionGroupingPhase.groupWithinProgression(withinLevelGrouped);

        // Phase 5: Display-Specific Final Grouping
        const result = this.createDisplayResult(withinProgressionGrouped, context, progression);

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
}

export { DisplayStrategyBase };
