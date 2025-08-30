import type {
    FeatureProgression,
    FeatureModifier,
    FeatureChoice,
    FormulaParamsData,
    FeatureSpecialEffect
} from '@shared/schema';
import {
    DisplayType,
    FORMULA_MAP,
    FEATURE_MODIFIER_CONDITION_TYPES,
    SIZE_MAP,
    SPELL_SCHOOL_MAP,
    ATTACK_TYPES,
    FeatureModifierConditionType,
    BreakdownComponentType,
    ModifierType,
    ModifierAppliesToType,
    FeatureType,
    FeatureSpecialEffectType,
    FeatureChoiceType
} from '@shared/static-data';

import { calculatorRegistry } from './calculator-registry';
import { formatterRegistry } from './formatter-registry';
import { ModifierGroupingStrategy } from './grouping-strategies';
import type {
    DisplayContext,
    DisplayResult,
    LevelEntry,
    DisplayStrategy,
    ProgressionValue,
    FormatterMetadata,
    FormulaDefinition,
    ProcessingConfig,
    ProcessingContext,
    ProcessingResult,
    BaseFormatter,
    ChoiceFormatter,
    EffectFormatter,
    CalculationBreakdown,
    TransitionPoint,
    CalculationContext,
    FormattedItemWithLevel,
    CalculatedValueWithLevel,
    EntityGroupKey,
    GroupedLevelItem
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
        metadata?: FormatterMetadata
    ): LevelEntry[] {
        const progressions = Array.isArray(input) ? input : [input];
        return this.formatProgressions(progressions, context, metadata);
    }

    abstract formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): LevelEntry[];

    /**
     * Orchestrate the complete 6-phase formatting process for a single progression
     * This is the core orchestration method that coordinates all phases
     */
    protected orchestrateFormatting(
        progression: FeatureProgression,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        // Phase 1: Value Generation & Calculation
        const calculatedValues = this.generateValues(progression, context, metadata);

        // Phase 2: Pure Formatting - Format individual calculated values
        const formattedItems = this.formatItems(calculatedValues, metadata, progression.level);

        // Phase 3: Within-Level Grouping (Pre-Transition)
        const withinLevelGrouped = this.groupWithinLevel(formattedItems, progression);

        // Phase 4: Transition Detection
        const transitions = this.detectTransitions(withinLevelGrouped);

        // Phase 5: Within-Progression Grouping (Post-Transition)
        const withinProgressionGrouped = this.groupWithinProgression(withinLevelGrouped, transitions);

        // Phase 6: Display-Specific Final Grouping
        const result = this.createDisplayResult(withinProgressionGrouped, context);



        return result;
    }

    /**
     * Determine if progression generation is needed based on formula properties
     */
    protected shouldGenerateProgression(progression: FeatureProgression, context?: DisplayContext): boolean {
        // Check if any modifier has a formula with hasProgression: true
        const hasProgressionModifiers = progression.modifiers?.some(m =>
            m.formulaParams && FORMULA_MAP[m.formulaParams.formulaId]?.hasProgression
        );

        // Check if any choice has progression (if applicable)
        const hasProgressionChoices = progression.choices?.some(c =>
            // TODO: Implement choice progression logic when needed
            false
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
        metadata?: FormatterMetadata
    ): CalculatedValueWithLevel[] {
        const results: CalculatedValueWithLevel[] = [];

        // For formula-based progressions: use ProgressionGenerator
        if (this.shouldGenerateProgression(progression, context)) {
            const progressionValues = this.generateProgressionValues(progression, context);

            // Process all progression values
            for (const progressionValue of progressionValues) {
                this.processEntitiesAtLevel(progression, progressionValue.level, results, {
                    value: progressionValue.value,
                    breakdown: progressionValue.breakdown
                });
            }
        } else {
            // For direct entities: extract values directly
            this.processEntitiesAtLevel(progression, progression.level, results);
        }

        // If no entities were processed, add a placeholder for the feature itself
        if (results.length === 0) {
            // Create a dummy modifier to represent the feature itself
            const dummyModifier: FeatureModifier = {
                id: progression.id,
                featureProgressionId: progression.id,
                type: ModifierType.Bonus,
                value: 0,
                bonusType: null,
                appliesTo: ModifierAppliesToType.Ability,
                appliesToId: 0,
                conditions: [],
                formulaParamsId: null,
                formulaParams: null
            };

            results.push({
                value: 0,
                breakdown: {
                    components: [{
                        source: 'Feature',
                        value: 0,
                        type: BreakdownComponentType.base,
                        description: '' // Empty string for features without entities
                    }]
                },
                entity: dummyModifier,
                level: progression.level
            });
        }

        return results;
    }

    /**
     * Helper method to process entities at a specific level
     */
    private processEntitiesAtLevel(
        progression: FeatureProgression,
        level: number,
        results: CalculatedValueWithLevel[],
        sharedValue?: { value: number; breakdown: CalculationBreakdown }
    ): void {
        // Process modifiers
        if (progression.modifiers) {
            for (const modifier of progression.modifiers) {
                // Always calculate individual values for each modifier to handle different formula parameters
                if (modifier.formulaParams) {
                    // For progression formulas, use the shared value from the progression generator
                    if (sharedValue) {
                        results.push({
                            value: sharedValue.value,
                            breakdown: sharedValue.breakdown,
                            entity: modifier,
                            level
                        });
                    } else {
                        // Formula-based calculation for single level
                        const calculatedValue = this.calculateFormulaValue(modifier.formulaParams, level, undefined, progression.level);
                        results.push({
                            value: calculatedValue.value,
                            breakdown: calculatedValue.breakdown,
                            entity: modifier,
                            level
                        });
                    }
                } else {
                    // Direct value
                    results.push({
                        value: modifier.value,
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
                    value: 0, // Choices don't have numeric values
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

        // Process effects
        if (progression.effects) {
            for (const effect of progression.effects) {
                results.push({
                    value: 0, // Effects don't have numeric values
                    breakdown: {
                        components: [{
                            source: 'Effect',
                            value: 0,
                            type: BreakdownComponentType.base,
                            description: `Effect: ${effect.effectType}`
                        }]
                    },
                    entity: effect,
                    level
                });
            }
        }
    }



    /**
     * Get entity type from entity information
     */
    private getEntityType(entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect): FeatureType {
        if ('appliesTo' in entity) {
            return FeatureType.Modifier;
        } else if ('behavior' in entity) {
            return FeatureType.Choice;
        } else if ('effectType' in entity) {
            return FeatureType.Effect;
        } else {
            return FeatureType.Modifier; // Default fallback
        }
    }

    /**
     * Get entity sub type from entity information
     */
    private getEntitySubType(entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect): ModifierType | FeatureSpecialEffectType | FeatureChoiceType {
        if ('appliesTo' in entity) {
            return entity.type as ModifierType;
        } else if ('behavior' in entity) {
            return entity.type as FeatureChoiceType;
        } else if ('effectType' in entity) {
            return entity.effectType as FeatureSpecialEffectType;
        } else {
            return ModifierType.Bonus; // Default fallback
        }
    }

    /**
     * Helper method to create entity group key
     */
    private createEntityGroupKey(entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect): EntityGroupKey {
        if ('appliesTo' in entity) {
            return { type: FeatureType.Modifier, subType: entity.type };
        } else if ('behavior' in entity) {
            return { type: FeatureType.Choice, subType: entity.type };
        } else if ('effectType' in entity) {
            return { type: FeatureType.Effect, subType: entity.effectType };
        }
        // Default fallback
        return { type: FeatureType.Modifier, subType: ModifierType.Bonus };
    }

    /**
     * Helper method to get the feature ID for an entity
     */
    private getFeatureId(entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect): number {
        // For dummy modifiers representing features without entities, use the id as the feature ID
        if ('appliesTo' in entity && entity.appliesTo === ModifierAppliesToType.Ability && entity.type === ModifierType.Bonus && entity.value === 0 && !entity.formulaParams) {
            return entity.id; // This is actually the feature ID
        }

        // For regular entities, we need to find the feature ID
        // This is a simplified approach - in a more robust implementation, we'd track this explicitly
        if ('appliesTo' in entity) {
            return entity.featureProgressionId;
        } else if ('behavior' in entity) {
            return entity.featureId;
        } else if ('effectType' in entity) {
            return entity.progressionId; // Effects don't have featureId, use progressionId
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
        progressionLevel?: number
    ): FormattedItemWithLevel[] {
        return calculatedValues.map(({ value, breakdown, entity, level }) => {
            let formattedValue: string;

            if ('appliesTo' in entity) {
                // Check if this is a dummy modifier representing a feature without entities
                if (entity.appliesTo === ModifierAppliesToType.Ability && entity.type === ModifierType.Bonus && entity.value === 0 && !entity.formulaParams) {
                    // This is a dummy modifier for a feature without entities
                    formattedValue = ''; // Empty string for features without entities
                } else {
                    // Regular modifier
                    // Check if this is a character-dependent formula with display string in breakdown
                    if (breakdown?.components?.[0]?.formula && entity.formulaParams?.formulaId) {
                        const formulaDef = FORMULA_MAP[entity.formulaParams.formulaId];
                        if (formulaDef?.isCharacterDependent) {
                            // Use the display string from the breakdown
                            formattedValue = breakdown.components[0].formula;
                        } else {
                            // Use regular formatter
                            const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, entity.type, entity.appliesTo) as BaseFormatter;
                            formattedValue = formatter ? formatter.format(value, entity, metadata) : `${value}`;
                        }
                    } else {
                        // Use regular formatter
                        const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, entity.type, entity.appliesTo) as BaseFormatter;
                        formattedValue = formatter ? formatter.format(value, entity, metadata) : `${value}`;
                    }
                }
            } else if ('behavior' in entity) {
                // Choice
                const formatter = formatterRegistry.getFormatter(FeatureType.Choice, entity.type) as ChoiceFormatter;
                formattedValue = formatter ? formatter.formatChoice(entity, metadata) : `Choice: ${FeatureChoiceType[entity.type] || entity.type}`;
            } else if ('effectType' in entity) {
                // Effect
                const formatter = formatterRegistry.getFormatter(FeatureType.Effect, entity.effectType) as EffectFormatter;
                formattedValue = formatter ? formatter.format(entity, 1) : `Effect: ${FeatureSpecialEffectType[entity.effectType] || entity.effectType}`;
            } else {
                formattedValue = `${value}`;
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
                entityAppliesTo: 'appliesTo' in entity ? entity.appliesTo : undefined
            };
        });
    }

    /**
 * Phase 3: Within-Level Grouping (Pre-Transition)
 * Group entities of the same type within a single level
 */
    protected groupWithinLevel(
        formattedItems: FormattedItemWithLevel[],
        progression: FeatureProgression
    ): GroupedLevelItem[] {
        if (formattedItems.length === 0) {
            return [];
        }

        // Group by level first
        const groupedByLevel = new Map<number, FormattedItemWithLevel[]>();

        for (const item of formattedItems) {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        }

        const results: GroupedLevelItem[] = [];

        // For each level, group by entity type
        for (const [level, items] of groupedByLevel) {
            // Group by entity type
            const groupedByType = new Map<EntityGroupKey, FormattedItemWithLevel[]>();

            for (const item of items) {
                const groupKey = this.createEntityGroupKey(item.entity);

                if (!groupedByType.has(groupKey)) {
                    groupedByType.set(groupKey, []);
                }
                groupedByType.get(groupKey)!.push(item);
            }

            // Create grouped results for each type
            for (const [groupKey, typeItems] of groupedByType) {
                if (typeItems.length > 0) {
                    let formattedValue: string;

                    switch (groupKey.type) {
                        case FeatureType.Modifier: {
                            // Use ModifierGroupingStrategy for proper formatting
                            const modifierGroupingStrategy = new ModifierGroupingStrategy();
                            const groupedResult = modifierGroupingStrategy.group(typeItems.map(item => ({
                                formattedValue: item.formattedValue,
                                breakdown: item.breakdown,
                                metadata: undefined,
                                modifier: 'appliesTo' in item.entity ? item.entity : undefined
                            })));

                            // Check if any of the modifiers have conditions and add condition prefix
                            const modifiersWithConditions = typeItems.filter(item =>
                                'appliesTo' in item.entity && (item.entity as FeatureModifier).conditions && (item.entity as FeatureModifier).conditions!.length > 0
                            );

                            if (modifiersWithConditions.length > 0) {
                                // Use the first modifier's conditions for the prefix (assuming all modifiers in a group have the same conditions)
                                const firstModifier = modifiersWithConditions[0].entity as FeatureModifier;
                                const conditionPrefix = this.formatConditionPrefix(firstModifier);
                                if (conditionPrefix) {
                                    formattedValue = `${groupedResult.formattedValue} vs ${conditionPrefix}`;
                                } else {
                                    formattedValue = groupedResult.formattedValue;
                                }
                            } else {
                                formattedValue = groupedResult.formattedValue;
                            }


                            break;
                        }
                        case FeatureType.Choice: {
                            // FeatureChoice - join with | delimiter
                            formattedValue = typeItems.map(item => item.formattedValue).join(' | ');
                            break;
                        }
                        case FeatureType.Effect: {
                            // FeatureEffect - join with , delimiter
                            formattedValue = typeItems.map(item => item.formattedValue).join(', ');
                            break;
                        }
                        default: {
                            // Unknown entity type - join with , delimiter
                            formattedValue = typeItems.map(item => item.formattedValue).join(', ');
                            break;
                        }
                    }

                    results.push({
                        level,
                        featureId: progression.featureId,
                        formattedValue,
                        breakdown: { components: [] }, // Simplified for now
                        descriptionLevel: progression.level,
                        progressionId: progression.id,
                        entityType: groupKey.type,
                        entitySubType: groupKey.subType,
                        entityAppliesTo: undefined
                    });
                }
            }
        }

        return results;
    }

    /**
     * Phase 5: Within-Progression Grouping (Post-Transition)
     * Group entities that actually transition at each level
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

        // For each transition level, include entities at that level
        for (const level of Array.from(transitionLevels).sort((a, b) => a - b)) {
            const levelItems = withinLevelGrouped.filter(item => item.level === level);

            if (levelItems.length > 0) {
                // Include all items at this level
                for (const item of levelItems) {
                    results.push(item);
                }
            }
        }

        return results;
    }

    /**
     * Phase 1: Progression Generation
     * Generate progression values for formula-based modifiers with hasProgression: true
     */
    protected generateProgressionValues(
        progression: FeatureProgression,
        context?: DisplayContext
    ): ProgressionValue[] {
        // Check if progression generation is needed
        if (!this.shouldGenerateProgression(progression, context)) {
            return [];
        }

        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        if (!formulaModifier?.formulaParams) {
            return [];
        }

        const formulaDef = FORMULA_MAP[formulaModifier.formulaParams.formulaId];
        if (!formulaDef) {
            return [];
        }

        // For character-dependent formulas without character context, use display strings
        if (formulaDef.isCharacterDependent && !context?.character) {
            const progressionGenerator = calculatorRegistry.getProgressionGenerator(0);
            if (!progressionGenerator) {
                return [];
            }
            const displayStrings = progressionGenerator.generateDisplayStrings(
                formulaModifier.formulaParams,
                progression.level,
                MAX_CHARACTER_LEVEL
            );

            // Convert display strings to ProgressionValue objects
            return displayStrings.map((displayString, index) => ({
                level: progression.level + index,
                value: 0, // Display strings don't have numeric values
                breakdown: {
                    components: [{
                        source: formulaDef.name,
                        value: 0,
                        type: BreakdownComponentType.formula,
                        description: displayString,
                        formula: displayString
                    }]
                },
                conditionalValues: []
            }));
        } else {
            // For non-character-dependent formulas or when character context is available
            const calculationContext: CalculationContext = {
                level: progression.level,
                progressionLevel: progression.level,
                characterLevel: context?.currentLevel,
                character: context?.character
            };

            // Use registry to get progression generator and formula calculator
            const progressionGenerator = calculatorRegistry.getProgressionGenerator(0);
            const formulaCalculator = calculatorRegistry.getFormulaCalculator(formulaModifier.formulaParams.formulaId);
            if (!progressionGenerator) {
                return [];
            }
            return progressionGenerator.generateProgressionValues(
                formulaModifier.formulaParams,
                progression.level,
                MAX_CHARACTER_LEVEL,
                calculationContext,
                undefined, // modifierValue
                formulaCalculator
            );
        }
    }

    /**
     * Phase 4: Transition Detection
     * Detect transitions for each entity type separately
     */
    protected detectTransitions(withinLevelGrouped: GroupedLevelItem[]): TransitionPoint[] {
        if (withinLevelGrouped.length === 0) {
            return [];
        }

        // Group by level and entity type to detect transitions separately
        const groupedByLevelAndType = new Map<number, Map<ModifierType | FeatureSpecialEffectType | FeatureChoiceType, GroupedLevelItem[]>>();

        for (const item of withinLevelGrouped) {
            if (!groupedByLevelAndType.has(item.level)) {
                groupedByLevelAndType.set(item.level, new Map());
            }

            // Create a key that identifies the entity type based on the actual item
            const entityTypeKey = item.entitySubType;

            if (!groupedByLevelAndType.get(item.level)!.has(entityTypeKey)) {
                groupedByLevelAndType.get(item.level)!.set(entityTypeKey, []);
            }

            groupedByLevelAndType.get(item.level)!.get(entityTypeKey)!.push(item);
        }

        // Get all levels and entity types
        const sortedLevels = Array.from(groupedByLevelAndType.keys()).sort((a, b) => a - b);
        const allEntityTypes = new Set<ModifierType | FeatureSpecialEffectType | FeatureChoiceType>();

        for (const level of sortedLevels) {
            const entityTypes = groupedByLevelAndType.get(level)!;
            for (const entityType of entityTypes.keys()) {
                allEntityTypes.add(entityType);
            }
        }

        const transitions: TransitionPoint[] = [];

        // Always include the start level
        if (sortedLevels.length > 0) {
            const startLevel = sortedLevels[0];
            const startValues = Array.from(groupedByLevelAndType.get(startLevel)!.values()).flat();
            transitions.push({
                level: startLevel,
                type: TRANSITION_TYPE.START,
                description: startValues.join(', '),
                value: 0,
                previousValue: undefined,
                entityType: FeatureType.Modifier,
                entitySubType: ModifierType.Bonus,
            });
        }

        // Detect transitions for each entity type separately
        for (const entityType of allEntityTypes) {
            let previousValue: string | undefined;

            for (const level of sortedLevels) {
                const currentValues = groupedByLevelAndType.get(level)!.get(entityType);

                if (currentValues && currentValues.length > 0) {
                    // Combine all values at this level for the entity type
                    const currentValue = currentValues.map(item => item.formattedValue).join(', ');

                    if (currentValue !== previousValue) {
                        // Determine the entity type and subtype for the transition
                        const firstItem = currentValues[0];
                        transitions.push({
                            level,
                            type: TRANSITION_TYPE.TRANSITION,
                            description: currentValue,
                            value: 0,
                            previousValue: 0,
                            entityType: firstItem.entityType,
                            entitySubType: firstItem.entitySubType,
                        });
                        previousValue = currentValue;
                    }
                }
            }
        }

        // Sort transitions by level and remove duplicates
        const uniqueTransitions = new Map<number, TransitionPoint>();
        for (const transition of transitions) {
            if (!uniqueTransitions.has(transition.level)) {
                uniqueTransitions.set(transition.level, transition);
            } else {
                // Merge descriptions for transitions at the same level
                const existing = uniqueTransitions.get(transition.level)!;
                existing.description = `${existing.description}, ${transition.description}`;
            }
        }

        return Array.from(uniqueTransitions.values()).sort((a, b) => a.level - b.level);
    }

    /**
     * Phase 6: Display-Specific Final Grouping
     * Apply display-specific final grouping logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext
    ): DisplayResult {
        if (withinProgressionGrouped.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // Group by level to create one LevelEntry per level
        const groupedByLevel = new Map<number, Array<GroupedLevelItem>>();

        for (const item of withinProgressionGrouped) {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        }

        // Create LevelEntry objects for each level
        const levelEntries: LevelEntry[] = Array.from(groupedByLevel.entries())
            .sort(([a], [b]) => a - b)
            .map(([level, items]: [number, GroupedLevelItem[]]) => ({
                level,
                description: `Level ${level}`,
                items: items
            }));

        // For DisplayType.Edit, create the formatted string
        const transitionStrings = withinProgressionGrouped.map(item =>
            `Level ${item.level}: ${item.formattedValue}`
        );
        const formattedValue = transitionStrings.join('; ');

        return {
            formattedValue,
            breakdown: { components: [] }, // Simplified for now
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries
        };
    }

    /**
     * Calculate formula value using Layer 2 logic
     */
    protected calculateFormulaValue(
        formulaParams: FormulaParamsData,
        level: number,
        context?: DisplayContext,
        progressionLevel?: number
    ): { value: number; breakdown: CalculationBreakdown } {
        const formulaDef = FORMULA_MAP[formulaParams.formulaId];
        if (!formulaDef) {
            return {
                value: 0,
                breakdown: { components: [{ source: 'Formula', value: 0, type: BreakdownComponentType.formula, description: `Unknown formula ID: ${formulaParams.formulaId}` }] }
            };
        }

        // Build parameters for formula calculation
        const params = this.buildFormulaParams(formulaParams, level, progressionLevel || level, context);

        // Calculate the value using the formula
        let calculatedValue: number | string;
        let numericValue: number;

        if (formulaDef.isCharacterDependent && !context?.character) {
            // For character-dependent formulas without character context, use display string
            calculatedValue = formulaDef.getDisplayString(params);
            numericValue = 0; // Display strings don't have numeric values
        } else {
            // For non-character-dependent formulas or when character context is available
            calculatedValue = formulaDef.calculate(params);
            numericValue = typeof calculatedValue === 'string' ? 0 : calculatedValue;
        }

        return {
            value: numericValue,
            breakdown: {
                components: [{
                    source: formulaDef.name,
                    value: numericValue,
                    type: BreakdownComponentType.formula,
                    description: formulaDef.isCharacterDependent && !context?.character
                        ? `Formula display: ${calculatedValue}`
                        : `Formula calculation: ${calculatedValue}`,
                    formula: typeof calculatedValue === 'string' ? calculatedValue : undefined
                }]
            }
        };
    }

    protected processEntity(
        entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect,
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
        entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect,
        formatter: BaseFormatter | ChoiceFormatter | EffectFormatter,
        context: ProcessingContext
    ): string {
        switch (context.entityType) {
            case FeatureType.Modifier: {
                const modifier = entity as FeatureModifier;
                return (formatter as BaseFormatter).format(modifier.value, modifier, context.metadata);
            }
            case FeatureType.Choice: {
                const choice = entity as FeatureChoice;
                return (formatter as ChoiceFormatter).formatChoice(choice, context.metadata);
            }
            case FeatureType.Effect: {
                const effect = entity as FeatureSpecialEffect;
                return (formatter as EffectFormatter).format(effect, context.level || 1);
            }
            default:
                return `Unknown entity type: ${FeatureType[context.entityType] || context.entityType}`;
        }
    }

    protected formatConditionPrefix(modifier: FeatureModifier): string {
        if (!modifier.conditions || modifier.conditions.length === 0) {
            return '';
        }

        const conditionStrings = modifier.conditions.map(condition => {
            const conditionTypeName = this.getConditionTypeName(condition.conditionType);
            const conditionValueName = this.getConditionValueName(condition.conditionType, condition.conditionValue);
            return `${conditionTypeName} ${conditionValueName}`;
        });

        return conditionStrings.join(', ');
    }

    protected getConditionTypeName(conditionType: number): string {
        const conditionTypeInfo = FEATURE_MODIFIER_CONDITION_TYPES[conditionType];
        if (!conditionTypeInfo) {
            return 'Unknown';
        }
        // Use displayName if available, otherwise use name
        return conditionTypeInfo.displayName !== undefined && conditionTypeInfo.displayName !== null
            ? conditionTypeInfo.displayName
            : conditionTypeInfo.name;
    }

    protected getConditionValueName(conditionType: number, conditionValue: number): string {
        switch (conditionType) {
            case FeatureModifierConditionType.character_size:
                return SIZE_MAP[conditionValue]?.name || `Size ${conditionValue}`;
            case FeatureModifierConditionType.spell_school:
                return SPELL_SCHOOL_MAP[conditionValue]?.name || `Spell School ${conditionValue}`;
            case FeatureModifierConditionType.attack_type:
                return ATTACK_TYPES[conditionValue]?.name || `Attack Type ${conditionValue}`;
            default:
                return `Value ${conditionValue}`;
        }
    }

    protected buildFormulaParams(
        formula: FormulaParamsData,
        level: number,
        startLevel: number,
        context?: DisplayContext,
        modifierValue?: number
    ): Record<string, unknown> {
        // Use the formula object directly and add the additional parameters
        const params: Record<string, unknown> = {
            ...formula,
            level,
            startLevel,
            scalingValue: modifierValue !== undefined ? modifierValue : 1,
            baseValue: modifierValue !== undefined ? modifierValue : 1, // Add baseValue for Ability-based formulas
            context // Pass context to formulas
        };

        return params;
    }

    /**
     * Enhanced formatting for formula-based progressions with transition detection
     * This provides a unified way for all display strategies to handle transitions
     */
    protected formatFormulaProgressionWithTransitions(
        progression: FeatureProgression,
        baseResult: string,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams?.formulaId);
        if (!formulaModifier?.formulaParams) {
            return baseResult;
        }

        const progressionGenerator = calculatorRegistry.getProgressionGenerator(0);
        const transitionDetector = calculatorRegistry.getTransitionDetector(0);
        const formulaCalculator = calculatorRegistry.getFormulaCalculator(formulaModifier.formulaParams.formulaId);
        const calculationContext: CalculationContext = {
            level: progression.level,
            progressionLevel: progression.level,
            characterLevel: context?.currentLevel || progression.level,
            character: context?.character
        };

        if (!progressionGenerator || !transitionDetector) {
            return baseResult;
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            MAX_CHARACTER_LEVEL,
            calculationContext,
            undefined, // modifierValue
            formulaCalculator
        );
        const transitions = transitionDetector.findTransitions(values);

        if (transitions.length === 0) {
            return baseResult;
        }

        // Let subclasses customize how they want to display transition information
        return this.formatTransitionInfo(baseResult, transitions, progression, context, metadata);
    }

    /**
     * Template method for formatting transition information
     * Subclasses can override this to customize transition display
     */
    protected formatTransitionInfo(
        baseResult: string,
        transitions: Array<{ level: number; type: number; description: string; value: number; previousValue?: number }>,
        _progression: FeatureProgression,
        _context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): string {
        // Default implementation: append transition levels in parentheses
        const transitionLevels = transitions.map(t => t.level).join(', ');
        return `${baseResult} (transitions at levels: ${transitionLevels})`;
    }

    /**
     * Get current value and transition information for character sheet display
     */
    protected getCurrentValueWithTransitions(
        progression: FeatureProgression,
        currentLevel: number,
        _context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): string {
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams?.formulaId);
        if (!formulaModifier?.formulaParams) {
            return '';
        }

        const progressionGenerator = calculatorRegistry.getProgressionGenerator(0);
        const transitionDetector = calculatorRegistry.getTransitionDetector(0);
        const formulaCalculator = calculatorRegistry.getFormulaCalculator(formulaModifier.formulaParams.formulaId);

        if (!progressionGenerator || !transitionDetector) {
            return '';
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            currentLevel,
            undefined, // context
            undefined, // modifierValue
            formulaCalculator
        );
        const transitions = transitionDetector.findTransitions(values);
        const currentValue = values[values.length - 1]?.value || 0;

        if (transitions.length > 0) {
            const transitionLevels = transitions.map(t => t.level).join(', ');
            return `+${currentValue} (changes at levels: ${transitionLevels})`;
        } else {
            return `+${currentValue}`;
        }
    }
}

export class EditPageDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): LevelEntry[] {
        // Edit page processes each progression individually using orchestration
        const levelEntries: LevelEntry[] = [];

        for (const progression of progressions) {
            const result = this.orchestrateFormatting(progression, context, metadata);
            if (result.levelEntries && result.levelEntries.length > 0) {
                levelEntries.push(...result.levelEntries);
            } else {
                levelEntries.push({
                    level: progression.level,
                    description: `Level ${progression.level}`,
                    items: []
                });
            }
        }

        return levelEntries;
    }

    /**
     * Override Phase 6 to implement DisplayType.Edit specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext
    ): DisplayResult {
        if (withinProgressionGrouped.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // DisplayType.Edit: prefix with Level X: and join with ;
        const transitionStrings = withinProgressionGrouped.map(item =>
            `Level ${item.level}: ${item.formattedValue}`
        );
        const formattedValue = transitionStrings.join('; ');

        return {
            formattedValue,
            breakdown: { components: [] }, // Simplified for now
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries: []
        };
    }
}

export class DetailPageDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): LevelEntry[] {
        // Process each progression individually through Phase 1-5
        const progressionResults: GroupedLevelItem[][] = [];

        for (const progression of progressions) {
            // Phase 1-5 processing for each progression
            const calculatedValues = this.generateValues(progression, context, metadata);
            const formattedItems = this.formatItems(calculatedValues, metadata, progression.level);
            const withinLevelGrouped = this.groupWithinLevel(formattedItems, progression);
            const transitions = this.detectTransitions(withinLevelGrouped);
            const withinProgressionGrouped = this.groupWithinProgression(withinLevelGrouped, transitions);

            progressionResults.push(withinProgressionGrouped);
        }

        // Phase 6: Multi-Progression Level Grouping (Detail only)
        return this.groupMultiProgressionByLevel(progressionResults);
    }

    /**
     * Phase 6: Multi-Progression Level Grouping (Detail only)
     * Group multiple FeatureProgressions by level
     */
    private groupMultiProgressionByLevel(
        progressionResults: GroupedLevelItem[][]
    ): LevelEntry[] {
        // Flatten all progression results
        const allItems: GroupedLevelItem[] = [];
        for (const progression of progressionResults) {
            allItems.push(...progression);
        }

        // Group by level
        const groupedByLevel = new Map<number, GroupedLevelItem[]>();

        for (const item of allItems) {
            if (!groupedByLevel.has(item.level)) {
                groupedByLevel.set(item.level, []);
            }
            groupedByLevel.get(item.level)!.push(item);
        }

        // Create LevelEntry[] for each level
        const levelEntries: LevelEntry[] = [];
        for (const [level, items] of groupedByLevel) {
            levelEntries.push({
                level,
                description: `Level ${level}`,
                items: items
            });
        }

        // Sort by level
        return levelEntries.sort((a, b) => a.level - b.level);
    }

    /**
     * Override Phase 6 to implement DisplayType.Detail specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext
    ): DisplayResult {
        // DisplayType.Detail: pass through unchanged (handled by groupMultiProgressionByLevel)
        if (withinProgressionGrouped.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] },
                showBreakdown: context?.showBreakdown || false,
                components: [],
                levelEntries: []
            };
        }

        // For single progression, just return the first item
        const firstItem = withinProgressionGrouped[0];
        return {
            formattedValue: firstItem.formattedValue,
            breakdown: { components: [] },
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries: []
        };
    }
}

export class CharacterSheetDisplayStrategy extends DisplayStrategyBase {
    formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): LevelEntry[] {
        // Character sheet shows current level values only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formattedItems: GroupedLevelItem[] = [];

        for (const progression of progressions) {
            // Use orchestration for character sheet display
            const result = this.orchestrateFormatting(progression, context, metadata);
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
                    entityAppliesTo: undefined
                });
            }
        }

        return [{
            level: currentLevel,
            description: `Level ${currentLevel}`,
            items: formattedItems
        }];
    }

    /**
     * Override Phase 6 to implement DisplayType.CharacterSheet specific logic
     */
    protected createDisplayResult(
        withinProgressionGrouped: GroupedLevelItem[],
        context?: DisplayContext
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
