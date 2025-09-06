import type {
    FeatureProgression,
    FeatureModifier,
    FeatureChoice
} from '@shared/schema';
import {
    DisplayType,
    BreakdownComponentType,
    ModifierType,
    ModifierAppliesToType,
    FeatureType,
    FeatureChoiceType,
    FormulaId
} from '@shared/static-data';

import { calculatorRegistry } from './calculator-registry';
import { conditionFormatterRegistry } from './condition-formatter-registry';
import { formatterRegistry } from './formatter-registry';
import { ModifierGroupingStrategy, ChoiceGroupingStrategy } from './grouping-strategies';
import { labelerRegistry } from './labeler-registry';
import type {
    DisplayContext,
    DisplayResult,
    LevelEntry,
    DisplayStrategy,
    ProgressionValue,
    FormatterMetadata,
    ProcessingConfig,
    ProcessingContext,
    ProcessingResult,
    BaseFormatter,
    ChoiceFormatter,
    TransitionPoint,
    CalculationContext,
    FormattedItemWithLevel,
    CalculatedValueWithLevel,
    GroupedLevelItem,
    CalculationBreakdown
} from './types';

// Constants
const MAX_CHARACTER_LEVEL = 20; // D&D standard maximum character level

// Transition types
const TRANSITION_TYPE = {
    START: 0,
    TRANSITION: 1
} as const;

abstract class DisplayStrategyBase implements DisplayStrategy {
    /**
     * Unified entry point for formatting feature progressions
     * Converts single progression to array and delegates to formatProgressions
     */
    format(
        input: FeatureProgression | FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        const progressions = Array.isArray(input) ? input : [input];
        return this.formatProgressions(progressions, context, metadata, showLabels);
    }

    /**
     * Protected method for subclasses to implement their specific formatting logic
     * This is called internally by format() and should not be called directly by external code
     */
    protected abstract formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels?: boolean
    ): DisplayResult;

    /**
     * Orchestrate the complete 6-phase formatting process for a single progression
     * This is the core orchestration method that coordinates all phases
     */
    protected orchestrateFormatting(
        progression: FeatureProgression,
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        // Phase 1: Value Generation & Calculation
        const calculatedValues = this.generateValues(progression, context, metadata);

        // Phase 2: Pure Formatting - Format individual calculated values
        const formattedItems = this.formatItems(calculatedValues, metadata, progression.level, showLabels);

        // Phase 3: Within-Level Grouping (Pre-Transition)
        const withinLevelGrouped = this.groupWithinLevel(formattedItems, progression);

        // Phase 4: Transition Detection
        const transitions = this.detectTransitions(withinLevelGrouped);

        // Phase 5: Within-Progression Grouping (Post-Transition)
        const withinProgressionGrouped = this.groupWithinProgression(withinLevelGrouped, transitions);

        // Phase 6: Display-Specific Final Grouping
        const result = this.createDisplayResult(withinProgressionGrouped, context, progression);

        return result;
    }

    /**
     * Determine if progression generation is needed based on formula properties
     */
    protected shouldGenerateProgression(progression: FeatureProgression, _context?: DisplayContext): boolean {
        const hasProgressionModifiers = progression.modifiers?.some(m =>
            m.formulaParams
        );

        // Check if any choice has progression (if applicable)
        const hasProgressionChoices = progression.choices?.some(c =>
            c.formulaParams
        );

        return hasProgressionModifiers || hasProgressionChoices;
    }

    /**
     * Phase 1: Value Generation & Calculation
     * Generate calculated values for each level of each progression
     */
    protected generateValues(
        progression: FeatureProgression,
        context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): CalculatedValueWithLevel[] {
        const results: CalculatedValueWithLevel[] = [];

        // For progressions with formula-based modifiers/choices: use ProgressionGenerator
        if (this.shouldGenerateProgression(progression, context)) {
            // Process ALL formula modifiers using progression generation
            const formulaModifiers = progression.modifiers?.filter(m => m.formulaParams) || [];

            for (const formulaModifier of formulaModifiers) {
                const progressionValues = this.generateProgressionValuesForSingleModifier(formulaModifier, progression, context);

                // Process all progression values for this modifier
                for (const progressionValue of progressionValues) {
                    results.push({
                        // Remove value field - formatters will get it from entity.value
                        breakdown: progressionValue.breakdown,
                        entity: progressionValue.modifier, // Use the modified modifier
                        level: progressionValue.level
                    });
                }
            }

            // Process ALL formula choices using progression generation
            const formulaChoices = progression.choices?.filter(c => c.formulaParams) || [];

            for (const formulaChoice of formulaChoices) {
                const progressionValues = this.generateProgressionValuesForSingleChoice(formulaChoice, progression, context);

                // Process all progression values for this choice
                for (const progressionValue of progressionValues) {
                    results.push({
                        // Remove value field - choices don't have numeric values
                        breakdown: progressionValue.breakdown,
                        entity: progressionValue.choice!, // Use the choice from progression value
                        level: progressionValue.level
                    });
                }
            }

            // Also process static modifiers and choices at the progression level
            this.processStaticModifiersAtLevel(progression, progression.level, results);
            this.processStaticChoicesAtLevel(progression, progression.level, results);
        } else {
            // For progressions with only static entities: process directly
            this.processEntitiesAtLevel(progression, progression.level, results);
        }

        return results;
    }

    /**
     * Helper method to process only static modifiers (without formulas) at a specific level
     */
    private processStaticModifiersAtLevel(
        progression: FeatureProgression,
        level: number,
        results: CalculatedValueWithLevel[]
    ): void {
        // Process only static modifiers (those without formulas)
        if (progression.modifiers) {
            for (const modifier of progression.modifiers) {
                if (!modifier.formulaParams) {
                    // Direct value - static modifier
                    results.push({
                        // Remove value field - formatters will get it from entity.value
                        breakdown: {
                            components: [{
                                source: 'Direct Value',
                                value: modifier.value,
                                type: BreakdownComponentType.base,
                                description: 'Direct modifier value'
                            }]
                        },
                        entity: modifier,
                        level
                    });
                }
            }
        }
    }

    /**
     * Helper method to process only static choices (without formulas) at a specific level
     */
    private processStaticChoicesAtLevel(
        progression: FeatureProgression,
        level: number,
        results: CalculatedValueWithLevel[]
    ): void {
        // Process only static choices (those without formulas)
        if (progression.choices) {
            for (const choice of progression.choices) {
                if (!choice.formulaParams) {
                    results.push({
                        // Remove value field - choices don't have numeric values
                        breakdown: {
                            components: [{
                                source: 'Choice',
                                value: 0,
                                type: BreakdownComponentType.choice,
                                description: `Choice: ${choice.type}`
                            }]
                        },
                        entity: choice,
                        level
                    });
                }
            }
        }
    }

    /**
     * Helper method to process static entities (modifiers/choices without formulas) at a specific level
     * All formula-based entities are handled by the progression generator path
     */
    private processEntitiesAtLevel(
        progression: FeatureProgression,
        level: number,
        results: CalculatedValueWithLevel[]
    ): void {
        // Process modifiers
        if (progression.modifiers) {
            for (const modifier of progression.modifiers) {
                // Process only static modifiers (those without formulas)
                // Modifiers with formulaParams are handled by the progression generator path
                if (!modifier.formulaParams) {
                    // Direct value
                    results.push({
                        // Remove value field - formatters will get it from entity.value
                        breakdown: {
                            components: [{
                                source: 'Direct Value',
                                value: modifier.value,
                                type: BreakdownComponentType.base,
                                description: 'Direct modifier value'
                            }]
                        },
                        entity: modifier,
                        level
                    });
                }
            }
        }

        // Process choices
        if (progression.choices) {
            for (const choice of progression.choices) {
                results.push({
                    // Remove value field - choices don't have numeric values
                    breakdown: {
                        components: [{
                            source: 'Choice',
                            value: 0,
                            type: BreakdownComponentType.choice,
                            description: `Choice: ${choice.type}`
                        }]
                    },
                    entity: choice,
                    level
                });
            }
        }
    }

    /**
     * Get entity type from entity information
     */
    private getEntityType(entity: FeatureModifier | FeatureChoice): FeatureType {
        if ('appliesTo' in entity) {
            return FeatureType.Modifier;
        } else if ('behavior' in entity) {
            return FeatureType.Choice;
        } else {
            return FeatureType.Modifier; // Default fallback
        }
    }

    /**
     * Check if breakdown contains a display string from getDisplayString()
     * Returns the display string if found, null otherwise
     */
    private getDisplayStringFromBreakdown(breakdown: CalculationBreakdown): string | null {
        // Check if this is a display string case by looking at the breakdown
        // When getDisplayString() is used, the formula field contains the display string
        // and the value is 0
        if (breakdown.components.length > 0) {
            const component = breakdown.components[0];
            if (component.value === 0 && component.formula !== component.source) {
                // This indicates a display string case
                return component.formula;
            }
        }
        return null;
    }

    /**
     * Check if a group of items represents cumulative modifiers
     * Cumulative modifiers are those generated from formulas with cumulative=true
     */
    private isCumulativeGroup(groupedItems: FormattedItemWithLevel[]): boolean {
        if (groupedItems.length === 0) return false;

        // Check if all items in the group are modifiers with the same cumulative formula
        const firstItem = groupedItems[0];
        if (!('appliesTo' in firstItem.entity)) return false;

        const firstModifier = firstItem.entity as FeatureModifier;
        if (!firstModifier.formulaParams) return false;

        // Check if the formula is cumulative
        const isCumulative = firstModifier.formulaParams.cumulative === true;

        // Also verify that all items in the group have the same formula
        return isCumulative && groupedItems.every(item => {
            if (!('appliesTo' in item.entity)) return false;
            const modifier = item.entity as FeatureModifier;
            return modifier.formulaParams?.formulaId === firstModifier.formulaParams?.formulaId;
        });
    }

    /**
     * Get entity sub type from entity information
     */
    private getEntitySubType(entity: FeatureModifier | FeatureChoice): ModifierType | FeatureChoiceType {
        if ('appliesTo' in entity) {
            return entity.type as ModifierType;
        } else if ('behavior' in entity) {
            return entity.type as FeatureChoiceType;
        } else {
            return ModifierType.Bonus; // Default fallback
        }
    }

    /**
     * Helper method to get the feature ID for an entity
     */
    private getFeatureId(entity: FeatureModifier | FeatureChoice): number {
        // For dummy modifiers representing features without entities, use the id as the feature ID
        if ('appliesTo' in entity && entity.appliesTo === ModifierAppliesToType.Ability && entity.type === ModifierType.Bonus && entity.value === 0 && !entity.formulaParams) {
            return entity.id; // This is actually the feature ID
        }

        // For regular entities, we need to find the feature ID
        // This is a simplified approach - in a more robust implementation, we'd track this explicitly
        if ('appliesTo' in entity) {
            return entity.progressionId;
        } else if ('behavior' in entity) {
            return entity.featureId;
        }
        return 0;
    }

    /**
     * Phase 2: Pure Formatting
     * Format individual calculated values using pure formatters
     */
    protected formatItems(
        calculatedValues: CalculatedValueWithLevel[],
        metadata?: FormatterMetadata,
        progressionLevel?: number,
        showLabels: boolean = true
    ): FormattedItemWithLevel[] {
        return calculatedValues.map(({ breakdown, entity, level }) => {
            let formattedValue: string;

            if (this.getEntityType(entity) === FeatureType.Modifier) {
                const modifier = entity as FeatureModifier;

                // Check if this is a display string case (from getDisplayString())
                const displayString = this.getDisplayStringFromBreakdown(breakdown);
                if (displayString) {
                    formattedValue = displayString;
                } else {
                    const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, modifier.type, modifier.appliesTo) as BaseFormatter;
                    formattedValue = formatter ? formatter.format(modifier, metadata) : `${modifier.value}`;
                }

                // Skip labeling for cumulative modifiers - they will be labeled after grouping
                const isCumulativeModifier = modifier.formulaParams?.cumulative === true;
                if (!isCumulativeModifier) {
                    formattedValue = labelerRegistry.applyLabel(formattedValue, modifier, showLabels);
                }
            } else {
                const choice = entity as FeatureChoice;
                const formatter = formatterRegistry.getFormatter(FeatureType.Choice, choice.type) as ChoiceFormatter;
                formattedValue = formatter ? formatter.formatChoice(choice, metadata) : `Choice: ${FeatureChoiceType[choice.type] || choice.type}`;
            }

            return {
                formattedValue,
                breakdown,
                entity,
                level,
                descriptionLevel: progressionLevel,
                featureId: this.getFeatureId(entity),
                entityType: this.getEntityType(entity),
                entitySubType: this.getEntitySubType(entity),
                entityAppliesTo: 'appliesTo' in entity ? entity.appliesTo : undefined,
                groupingId: 'groupingId' in entity ? entity.groupingId || 0 : 0
            };
        });
    }

    /**
     * Phase 3: Within-Level Grouping (Pre-Transition)
     * Group entities by groupingId ONLY (ignore entity type and subType for grouping)
     */
    protected groupWithinLevel(
        formattedItems: FormattedItemWithLevel[],
        progression: FeatureProgression
    ): GroupedLevelItem[] {
        if (formattedItems.length === 0) {
            return [];
        }

        // STEP 1: Group by level first
        const groupedByLevel = new Map<number, FormattedItemWithLevel[]>();

        for (const item of formattedItems) {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        }

        const results: GroupedLevelItem[] = [];

        for (const [level, items] of groupedByLevel) {
            // STEP 2: Group by groupingId ONLY (ignore entity type and subType for grouping)
            const groupedByGroupingId = new Map<number, FormattedItemWithLevel[]>();

            for (const item of items) {
                const groupingId = item.groupingId; // No || 0 needed - always present
                if (!groupedByGroupingId.has(groupingId)) {
                    groupedByGroupingId.set(groupingId, []);
                }
                groupedByGroupingId.get(groupingId)!.push(item);
            }

            // STEP 3: Process each grouping separately
            for (const [groupingId, groupedItems] of groupedByGroupingId) {
                if (groupedItems.length > 0) {
                    if (groupingId === 0) {
                        // For groupingId = 0, keep items separate - don't group them
                        for (const item of groupedItems) {
                            let formattedValue = item.formattedValue;

                            // Apply condition formatting to individual items as well
                            if ('appliesTo' in item.entity && (item.entity as FeatureModifier).conditions && (item.entity as FeatureModifier).conditions!.length > 0) {
                                const modifier = item.entity as FeatureModifier;
                                formattedValue = conditionFormatterRegistry.formatCondition(
                                    modifier.conditions![0],
                                    item.formattedValue
                                );
                            }

                            results.push({
                                level,
                                featureId: progression.featureId,
                                formattedValue,
                                breakdown: { components: [] }, // Simplified for now
                                descriptionLevel: progression.level,
                                progressionId: progression.id,
                                entityType: item.entityType,
                                entitySubType: item.entitySubType,
                                entityAppliesTo: item.entityAppliesTo,
                                groupingId: item.groupingId
                            });
                        }
                    } else {
                        // For groupingId > 0, use grouping strategy to combine items
                        let formattedValue: string;

                        // Route to appropriate grouping strategy based on entity types
                        // Note: Choices and modifiers should never be grouped together in practice
                        const hasChoices = groupedItems.some(item => 'behavior' in item.entity);

                        if (hasChoices) {
                            // Pure choice group
                            const choiceGroupingStrategy = new ChoiceGroupingStrategy();
                            const groupedResult = choiceGroupingStrategy.group(groupedItems.map(item => ({
                                formattedValue: item.formattedValue,
                                breakdown: item.breakdown,
                                metadata: undefined,
                                modifier: 'appliesTo' in item.entity ? item.entity : undefined,
                                groupingId: item.groupingId
                            })));
                            formattedValue = groupedResult.formattedValue;
                        } else {
                            // Pure modifier group (default)
                            const modifierGroupingStrategy = new ModifierGroupingStrategy();
                            const groupedResult = modifierGroupingStrategy.group(groupedItems.map(item => ({
                                formattedValue: item.formattedValue,
                                breakdown: item.breakdown,
                                metadata: undefined,
                                modifier: 'appliesTo' in item.entity ? item.entity : undefined,
                                groupingId: item.groupingId
                            })));

                            // Check if any of the modifiers have conditions and add condition prefix
                            const modifiersWithConditions = groupedItems.filter(item =>
                                'appliesTo' in item.entity && (item.entity as FeatureModifier).conditions && (item.entity as FeatureModifier).conditions!.length > 0
                            );

                            if (modifiersWithConditions.length > 0) {
                                // Use the first modifier's conditions for the prefix (assuming all modifiers in a group have the same conditions)
                                const firstModifier = modifiersWithConditions[0].entity as FeatureModifier;
                                if (firstModifier.conditions && firstModifier.conditions.length > 0) {
                                    // Use the condition formatter registry to format the condition with the grouped result
                                    formattedValue = conditionFormatterRegistry.formatCondition(
                                        firstModifier.conditions[0],
                                        groupedResult.formattedValue
                                    );
                                } else {
                                    formattedValue = groupedResult.formattedValue;
                                }
                            } else {
                                formattedValue = groupedResult.formattedValue;
                            }
                        }

                        // Check if this is a cumulative group (all modifiers have the same cumulative formula)
                        const firstModifier = groupedItems[0].entity as FeatureModifier;
                        const isCumulativeGroup = this.isCumulativeGroup(groupedItems);

                        if (isCumulativeGroup) {
                            // For cumulative groups, apply label to the grouped result
                            formattedValue = labelerRegistry.applyLabel(formattedValue, firstModifier, true);
                        }
                        // For non-cumulative groups, the individual items are already labeled

                        // For grouped items, use default values since items are grouped

                        results.push({
                            level,
                            featureId: progression.featureId,
                            formattedValue,
                            breakdown: { components: [] }, // Simplified for now
                            descriptionLevel: progression.level,
                            progressionId: progression.id,
                            entityType: FeatureType.Modifier,
                            entitySubType: ModifierType.Bonus,
                            entityAppliesTo: undefined,
                            groupingId: groupingId
                        });
                    }
                }
            }
        }

        return results;
    }

    /**
     * Phase 5: Within-Progression Grouping (Post-Transition)
     * Group all entities for each transition level within a single progression
     */
    protected groupWithinProgression(
        withinLevelGrouped: GroupedLevelItem[],
        transitions: TransitionPoint[]
    ): GroupedLevelItem[] {
        if (withinLevelGrouped.length === 0) {
            return [];
        }

        // Get transition levels (including start level)
        const transitionLevels = new Set<number>();
        transitionLevels.add(withinLevelGrouped[0]?.level || 1); // Start level - using 1 as fallback for empty arrays
        transitions.forEach(t => transitionLevels.add(t.level));

        const results: GroupedLevelItem[] = [];

        // For each transition level, only include entities that actually changed
        for (const level of Array.from(transitionLevels).sort((a, b) => a - b)) {
            const levelItems = withinLevelGrouped.filter(item => item.level === level);

            if (levelItems.length > 0) {
                // Find which entities actually changed at this level
                const changedEntities: GroupedLevelItem[] = [];

                for (const item of levelItems) {
                    // Check if this entity type has a transition at this level
                    // Use the same composite key logic as transition detection
                    const hasTransition = transitions.some(t => {
                        if (t.level !== level) return false;

                        if (item.groupingId === 0) {
                            // For individual items, match by entity type + subtype + appliesTo
                            return t.entityType === item.entityType &&
                                t.entitySubType === item.entitySubType &&
                                t.entityAppliesTo === item.entityAppliesTo;
                        } else {
                            // For grouped items, match by groupingId
                            return t.groupingId === item.groupingId;
                        }
                    });

                    // Also include if this is the start level (first transition)
                    const isStartLevel = level === Array.from(transitionLevels).sort((a, b) => a - b)[0];

                    if (hasTransition || isStartLevel) {
                        changedEntities.push(item);
                    }
                }

                if (changedEntities.length > 0) {
                    // Phase 5: Group ALL entities at this level by featureId
                    // This is the key fix - group by featureId regardless of groupingId
                    const entitiesByFeatureId = new Map<number, GroupedLevelItem[]>();

                    for (const item of changedEntities) {
                        if (!entitiesByFeatureId.has(item.featureId)) {
                            entitiesByFeatureId.set(item.featureId, []);
                        }
                        entitiesByFeatureId.get(item.featureId)!.push(item);
                    }

                    // For each featureId, combine all entities with ', ' delimiter
                    for (const [_featureId, featureEntities] of entitiesByFeatureId) {
                        if (featureEntities.length === 1) {
                            // Single entity - add as-is
                            results.push(featureEntities[0]);
                        } else {
                            // Multiple entities - combine with ', ' delimiter
                            const combinedValue = featureEntities.map(item => item.formattedValue).join(', ');
                            const firstItem = featureEntities[0];
                            results.push({
                                level,
                                featureId: firstItem.featureId,
                                formattedValue: combinedValue,
                                breakdown: { components: [] },
                                descriptionLevel: firstItem.descriptionLevel,
                                progressionId: firstItem.progressionId,
                                entityType: FeatureType.Modifier, // Default type since we're combining all
                                entitySubType: ModifierType.Bonus, // Default subtype
                                entityAppliesTo: undefined,
                                groupingId: 0 // Reset to 0 since we're now grouping by featureId
                            });
                        }
                    }
                }
            }
        }

        return results;
    }

    /**
     * Phase 1: Progression Generation for a specific modifier
     * Generate progression values for a single formula-based modifier
     */
    protected generateProgressionValuesForSingleModifier(
        formulaModifier: FeatureModifier,
        progression: FeatureProgression,
        context?: DisplayContext
    ): ProgressionValue[] {
        if (!formulaModifier.formulaParams) {
            return [];
        }

        const calculationContext: CalculationContext = {
            level: progression.level,
            progressionLevel: progression.level,
            characterLevel: context?.currentLevel,
            character: context?.character
        };

        // Use registry to get progression generator and formula calculator
        const progressionGenerator = calculatorRegistry.getDefaultProgressionGenerator();
        const formulaCalculator = calculatorRegistry.getFormulaCalculator(formulaModifier.formulaParams.formulaId);
        if (!progressionGenerator) {
            return [];
        }

        // For CONDITIONAL_SCALING, start at the first threshold level instead of progression.level
        let startLevel = progression.level;
        if (formulaModifier.formulaParams.formulaId === FormulaId.CONDITIONAL_SCALING &&
            formulaModifier.formulaParams.thresholds &&
            formulaModifier.formulaParams.thresholds.length > 0) {
            // Start at the first threshold level for conditional scaling
            startLevel = Math.min(...formulaModifier.formulaParams.thresholds);
        }

        // Generate all values using the progression generator
        // The progression generator handles character-dependent formulas internally
        return progressionGenerator.generateValues({
            formula: formulaModifier.formulaParams,
            startLevel,
            endLevel: MAX_CHARACTER_LEVEL,
            context: calculationContext,
            modifierValue: formulaModifier.value, // Pass the actual modifier value for proper scaling
            formulaCalculator,
            originalModifier: formulaModifier // Pass the original modifier for creating modified version
        });
    }

    /**
     * Phase 1: Progression Generation for a specific choice
     * Generate progression values for a single formula-based choice
     */
    protected generateProgressionValuesForSingleChoice(
        formulaChoice: FeatureChoice,
        progression: FeatureProgression,
        context?: DisplayContext
    ): ProgressionValue[] {
        if (!formulaChoice.formulaParams) {
            return [];
        }

        const calculationContext: CalculationContext = {
            level: progression.level,
            progressionLevel: progression.level,
            characterLevel: context?.currentLevel,
            character: context?.character
        };

        // Use registry to get progression generator and formula calculator
        const progressionGenerator = calculatorRegistry.getDefaultProgressionGenerator();
        const formulaCalculator = calculatorRegistry.getFormulaCalculator(formulaChoice.formulaParams.formulaId);
        if (!progressionGenerator) {
            return [];
        }

        // For CONDITIONAL_SCALING, start at the first threshold level instead of progression.level
        let startLevel = progression.level;
        if (formulaChoice.formulaParams.formulaId === FormulaId.CONDITIONAL_SCALING &&
            formulaChoice.formulaParams.thresholds &&
            formulaChoice.formulaParams.thresholds.length > 0) {
            // Start at the first threshold level for conditional scaling
            startLevel = Math.min(...formulaChoice.formulaParams.thresholds);
        }

        // Generate all values using the progression generator
        // The progression generator handles character-dependent formulas internally
        return progressionGenerator.generateValues({
            formula: formulaChoice.formulaParams,
            startLevel,
            endLevel: MAX_CHARACTER_LEVEL,
            context: calculationContext,
            modifierValue: 0, // Choices don't have numeric values
            formulaCalculator,
            originalChoice: formulaChoice // Pass the original choice
        });
    }

    /**
     * Phase 4: Transition Detection
     * Detect transitions for each groupingId separately
     */
    protected detectTransitions(withinLevelGrouped: GroupedLevelItem[]): TransitionPoint[] {
        if (withinLevelGrouped.length === 0) {
            return [];
        }

        // Step 1: Flatten and sort by level, then by groupingId
        const levelEntityGroups = this.flattenToLevelEntityGroups(withinLevelGrouped);

        // Step 2: Single-pass transition detection
        const transitions: TransitionPoint[] = [];
        const previousValues = new Map<string, string>(); // Use composite key for individual items

        // Always include start level
        const startGroup = levelEntityGroups[0];
        transitions.push(this.createStartTransition(startGroup));

        // Detect transitions for each group
        for (const group of levelEntityGroups) {
            const groupingId = group.items[0]?.groupingId || 0;
            const entityType = group.items[0]?.entityType;

            // Create a composite key for transition detection
            let transitionKey: string;
            if (groupingId === 0) {
                // For individual items (groupingId = 0), use entity type + subtype + appliesTo as key
                const item = group.items[0];
                transitionKey = `${item.entityType}-${item.entitySubType}-${item.entityAppliesTo || 'none'}`;
            } else {
                // For grouped items (groupingId > 0), use groupingId as key
                transitionKey = `group-${groupingId}`;
            }

            const previousValue = previousValues.get(transitionKey);

            // For choices, always create a transition at every level where they appear
            // because choices represent availability, not value changes
            if (entityType === FeatureType.Choice) {
                transitions.push(this.createTransition(group));
                previousValues.set(transitionKey, group.formattedValue);
            } else if (group.formattedValue !== previousValue) {
                // For modifiers, only create transitions when the value actually changes
                transitions.push(this.createTransition(group));
                previousValues.set(transitionKey, group.formattedValue);
            }
        }

        return transitions.sort((a, b) => a.level - b.level);
    }

    /**
     * Helper method to flatten grouped items into a simple structure for transition detection
     */
    private flattenToLevelEntityGroups(withinLevelGrouped: GroupedLevelItem[]): Array<{
        level: number;
        entityType: FeatureType;
        entitySubType: ModifierType | FeatureChoiceType;
        formattedValue: string;
        items: GroupedLevelItem[];
    }> {
        // Group by level first, then by groupingId (not entity type)
        const groupedByLevel = new Map<number, GroupedLevelItem[]>();

        for (const item of withinLevelGrouped) {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        }

        const result: Array<{
            level: number;
            entityType: FeatureType;
            entitySubType: ModifierType | FeatureChoiceType;
            formattedValue: string;
            items: GroupedLevelItem[];
        }> = [];

        // For each level, group by groupingId and create flattened structure
        for (const [level, items] of groupedByLevel) {
            const groupedByGroupingId = new Map<number, GroupedLevelItem[]>();

            for (const item of items) {
                const groupingId = item.groupingId;
                if (!groupedByGroupingId.has(groupingId)) {
                    groupedByGroupingId.set(groupingId, []);
                }
                groupedByGroupingId.get(groupingId)!.push(item);
            }

            // Create flattened groups for each groupingId at this level
            for (const [groupingId, groupingItems] of groupedByGroupingId) {
                if (groupingId === 0) {
                    // For groupingId = 0, treat each item individually
                    for (const item of groupingItems) {
                        result.push({
                            level,
                            entityType: item.entityType,
                            entitySubType: item.entitySubType,
                            formattedValue: item.formattedValue,
                            items: [item]
                        });
                    }
                } else {
                    // For grouped items (groupingId > 0), group them together
                    const firstItem = groupingItems[0];
                    const formattedValue = groupingItems.map(item => item.formattedValue).join(', ');

                    result.push({
                        level,
                        entityType: firstItem.entityType,
                        entitySubType: firstItem.entitySubType,
                        formattedValue,
                        items: groupingItems
                    });
                }
            }
        }

        // Sort by level, then by groupingId for consistent processing
        return result.sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            // Sort by groupingId instead of entitySubType
            const aGroupingId = a.items[0]?.groupingId || 0;
            const bGroupingId = b.items[0]?.groupingId || 0;
            return aGroupingId - bGroupingId;
        });
    }

    /**
     * Helper method to create a start transition
     */
    private createStartTransition(group: {
        level: number;
        entityType: FeatureType;
        entitySubType: ModifierType | FeatureChoiceType;
        formattedValue: string;
        items: GroupedLevelItem[];
    }): TransitionPoint {
        return {
            level: group.level,
            type: TRANSITION_TYPE.START,
            description: group.formattedValue,
            value: 0,
            previousValue: undefined,
            entityType: group.entityType,
            entitySubType: group.entitySubType,
            entityAppliesTo: group.items[0]?.entityAppliesTo,
            groupingId: group.items[0]?.groupingId || 0,
        };
    }

    /**
     * Helper method to create a regular transition
     */
    private createTransition(group: {
        level: number;
        entityType: FeatureType;
        entitySubType: ModifierType | FeatureChoiceType;
        formattedValue: string;
        items: GroupedLevelItem[];
    }): TransitionPoint {
        return {
            level: group.level,
            type: TRANSITION_TYPE.TRANSITION,
            description: group.formattedValue,
            value: 0,
            previousValue: 0,
            entityType: group.entityType,
            entitySubType: group.entitySubType,
            entityAppliesTo: group.items[0]?.entityAppliesTo,
            groupingId: group.items[0]?.groupingId || 0,
        };
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
        entity: FeatureModifier | FeatureChoice,
        config: ProcessingConfig,
        context: ProcessingContext
    ): ProcessingResult {
        try {
            const formatter = formatterRegistry.getFormatter(config.entityType, config.subType!, config.subTypeId);
            if (!formatter) {
                return {
                    formattedValue: `Unknown formatter for ${config.entityType}`,
                    success: false,
                    error: `No formatter found for entity type ${config.entityType}`,
                    breakdown: { components: [] }
                };
            }
            const formattedValue = this.formatEntity(entity, formatter, context);

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

    protected formatEntity(
        entity: FeatureModifier | FeatureChoice,
        formatter: BaseFormatter | ChoiceFormatter,
        context: ProcessingContext
    ): string {
        switch (context.entityType) {
            case FeatureType.Modifier: {
                const modifier = entity as FeatureModifier;
                return (formatter as BaseFormatter).format(modifier, context.metadata);
            }
            case FeatureType.Choice: {
                const choice = entity as FeatureChoice;
                return (formatter as ChoiceFormatter).formatChoice(choice, context.metadata);
            }
            default:
                return `Unknown entity type: ${FeatureType[context.entityType] || context.entityType}`;
        }
    }
}

export class EditPageDisplayStrategy extends DisplayStrategyBase {
    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        // just use the first progression
        return this.orchestrateFormatting(progressions[0], context, metadata, showLabels);
    }

    /**
     * Override Phase 6 to implement DisplayType.Edit specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        progression?: FeatureProgression
    ): DisplayResult {
        if (withinProgressionGrouped.length === 0) {
            return {
                formattedValue: `Level ${progression.level}`,
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // withinProgressionGrouped already contains only the changed items at their respective levels
        // No need to group by level again - just create LevelEntry objects directly
        const levelEntries: LevelEntry[] = withinProgressionGrouped.map(item => ({
            level: item.level,
            description: `Level ${item.level}`,
            items: [item]
        }));

        // DisplayType.Edit: Phase 5 already combined all entities at each level
        // Now just add "Level X:" prefix and join with "; "
        const transitionStrings = withinProgressionGrouped
            .map(item => `Level ${item.level}: ${item.formattedValue}`);

        const formattedValue = transitionStrings.join('; ');

        return {
            formattedValue,
            breakdown: { components: [] }, // Simplified for now
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }
}

export class DetailPageDisplayStrategy extends DisplayStrategyBase {
    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        if (!progressions || progressions.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // Process each progression individually using the base orchestration
        const progressionResults: DisplayResult[] = [];

        for (const progression of progressions) {
            // Use orchestrateFormatting for Phases 1-5 (same as EditPageDisplayStrategy)
            const result = this.orchestrateFormatting(progression, context, metadata, showLabels);
            progressionResults.push(result);
        }

        // Phase 6: Multi-Progression Level Grouping (Detail only)
        const levelEntries = this.groupMultiProgressionByLevel(progressionResults);

        return {
            formattedValue: 'Full Progression',
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }

    /**
     * Override Phase 6 to implement DisplayType.Detail specific logic
     * This is a no-op since DetailPageDisplayStrategy handles Phase 6 in groupMultiProgressionByLevel
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        progression?: FeatureProgression
    ): DisplayResult {
        // DisplayType.Detail: This method is a no-op - pass through the data unchanged
        // The actual Phase 6 logic is handled in groupMultiProgressionByLevel
        if (withinProgressionGrouped.length === 0) {
            // for progressions with no items, return a level entry with an empty item so the feature still displays
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: [{
                    level: progression.level,
                    description: `Level ${progression.level}`,
                    items: [{
                        level: progression.level,
                        featureId: progression.featureId,
                        formattedValue: '',
                        breakdown: { components: [] },
                        descriptionLevel: progression.level,
                        progressionId: progression.id,
                        entityType: FeatureType.Modifier,
                        entitySubType: 0,
                        entityAppliesTo: undefined,
                        groupingId: 0 // Default grouping for ungrouped entities
                    }]
                }]
            };
        }

        // Create a simple DisplayResult that preserves the data without transformation
        const levelEntries: LevelEntry[] = withinProgressionGrouped.map(item => ({
            level: item.level,
            description: `Level ${item.level}`,
            items: [item]
        }));

        return {
            formattedValue: withinProgressionGrouped.map(item => item.formattedValue).join(', '),
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }

    /**
     * Phase 6: Multi-Progression Level Grouping (Detail only)
     * Group multiple FeatureProgressions by level
     */
    private groupMultiProgressionByLevel(
        progressionResults: DisplayResult[]
    ): LevelEntry[] {
        // Group by level
        const groupedByLevel = new Map<number, LevelEntry[]>();

        for (const item of progressionResults) {
            for (const levelEntry of item.levelEntries) {
                if (!groupedByLevel.has(levelEntry.level)) {
                    groupedByLevel.set(levelEntry.level, []);
                }
                groupedByLevel.get(levelEntry.level)!.push(levelEntry);
            }
        }

        // Create LevelEntry[] for each level
        const levelEntries: LevelEntry[] = [];
        for (const [level, items] of groupedByLevel) {
            levelEntries.push({
                level,
                description: `Level ${level}`,
                items: items.flatMap(item => item.items)
            });
        }

        // Sort by level
        return levelEntries.sort((a, b) => a.level - b.level);
    }
}

export class CharacterSheetDisplayStrategy extends DisplayStrategyBase {
    protected formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata,
        showLabels: boolean = true
    ): DisplayResult {
        // Character sheet shows current level values only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formattedItems: GroupedLevelItem[] = [];

        for (const progression of progressions) {
            // Use orchestration for character sheet display
            const result = this.orchestrateFormatting(progression, context, metadata, showLabels);
            if (result.formattedValue) {
                formattedItems.push({
                    level: currentLevel,
                    featureId: progression.featureId,
                    formattedValue: result.formattedValue,
                    breakdown: result.breakdown,
                    descriptionLevel: progression.level,
                    progressionId: progression.id,
                    entityType: FeatureType.Modifier, // Default type
                    entitySubType: 0, // Default subtype
                    entityAppliesTo: undefined,
                    groupingId: 0 // Default grouping for ungrouped entities
                });
            }
        }

        const levelEntries = [{
            level: currentLevel,
            description: `Level ${currentLevel}`,
            items: formattedItems
        }];

        // Create a DisplayResult from the levelEntries
        const formattedValue = formattedItems.map(item => item.formattedValue).join(', ');

        return {
            formattedValue,
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }

    /**
     * Override Phase 6 to implement DisplayType.CharacterSheet specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext,
        _progression?: FeatureProgression
    ): DisplayResult {
        // DisplayType.CharacterSheet: filter to current character level only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        // Find the item for the current level
        const currentItem = withinProgressionGrouped.find(item => item.level === currentLevel);

        if (!currentItem) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        return {
            formattedValue: currentItem.formattedValue,
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries: []
        };
    }
}

// Private singleton instances - only accessible through factory
const editPageStrategy = new EditPageDisplayStrategy();
const detailPageStrategy = new DetailPageDisplayStrategy();
const characterSheetStrategy = new CharacterSheetDisplayStrategy();

export class DisplayStrategyFactory {
    static createStrategy(displayType: DisplayType): DisplayStrategy {
        switch (displayType) {
            case DisplayType.Edit:
                return editPageStrategy;
            case DisplayType.Detail:
                return detailPageStrategy;
            case DisplayType.CharacterSheet:
                return characterSheetStrategy;
            default:
                throw new Error(`Unknown display type: ${displayType}`);
        }
    }
}

export const displayStrategyFactory = DisplayStrategyFactory;
