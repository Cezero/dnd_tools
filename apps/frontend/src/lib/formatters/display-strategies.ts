import type {
    FeatureProgression,
    FeatureModifier,
    FeatureChoice,
    FormulaParamsData,
    FeatureSpecialEffect
} from '@shared/schema';
import { DisplayType, FORMULA_MAP, FEATURE_MODIFIER_CONDITION_TYPES, SIZE_MAP, SPELL_SCHOOL_MAP, ATTACK_TYPES, FeatureModifierConditionType, BreakdownComponentType } from '@shared/static-data';

// Constants
const MAX_CHARACTER_LEVEL = 20; // D&D standard maximum character level


import { calculatorRegistry } from './calculator-registry';
import { formatterRegistry } from './formatter-registry';
import { ModifierGroupingStrategy } from './grouping-strategies';
import { progressionGenerator, transitionDetector } from './progression-generators';
import type {
    DisplayContext,
    DisplayResult,
    LevelEntry,
    LevelFormattedItem,
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
    CalculationContext
} from './types';
import { FeatureType } from './types';

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
     * Orchestrate the complete 6-layer formatting process for a single progression
     * This is the core orchestration method that coordinates all layers
     */
    protected orchestrateFormatting(
        progression: FeatureProgression,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        // Phase 1: Progression Generation - Expand formulas with hasProgression: true
        const progressionValues = this.generateProgressionValues(progression, context);

        // Phase 2: Value Calculation - Calculate values for each expanded level
        const calculatedValues = this.calculateValues(progression, progressionValues, context, metadata);

        // Phase 3: Pure Formatting - Format individual calculated values
        const formattedItems = this.formatItems(calculatedValues, metadata);

        // Phase 4: Grouping - Group formatted items
        const groupedResult = this.groupItems(formattedItems);

        // Phase 5: Transition Detection - Detect transitions between grouped values
        const transitions = this.detectTransitions(progressionValues);

        // Phase 6: Final Result Creation - Combine grouped result with transition information
        return this.createDisplayResult(groupedResult, transitions, context);
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
     * Phase 2: Value Calculation
     * Calculate values for each expanded progression level, with detailed breakdown
     */
    protected calculateValues(
        progression: FeatureProgression,
        progressionValues: ProgressionValue[],
        context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): Array<{ value: number; breakdown: CalculationBreakdown; entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect }> {
        const results: Array<{ value: number; breakdown: CalculationBreakdown; entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect }> = [];

        // If we have progression values, use them for calculation
        if (progressionValues.length > 0) {
            // Use the progression values that were generated in Phase 1
            for (const progressionValue of progressionValues) {
                // For progression values, we can use the modifiers directly from the progression value
                if (progressionValue.modifiers && progressionValue.modifiers.length > 0) {
                    for (const modifier of progressionValue.modifiers) {
                        results.push({
                            value: progressionValue.value,
                            breakdown: progressionValue.breakdown,
                            entity: modifier
                        });
                    }
                } else {
                    // Fallback: use the first modifier from the original progression
                    const modifier = progression.modifiers?.[0];
                    if (modifier) {
                        results.push({
                            value: progressionValue.value,
                            breakdown: progressionValue.breakdown,
                            entity: modifier
                        });
                    }
                }
            }
        } else {
            // Fallback to original logic for non-progression modifiers
            if (progression.modifiers) {
                for (const modifier of progression.modifiers) {
                    if (modifier.formulaParams) {
                        // Formula-based calculation
                        const calculatedValue = this.calculateFormulaValue(modifier.formulaParams, progression.level, context);
                        results.push({
                            value: calculatedValue.value,
                            breakdown: calculatedValue.breakdown,
                            entity: modifier
                        });
                    } else {
                        // Direct value
                        results.push({
                            value: modifier.value,
                            breakdown: { components: [{ source: 'Direct Value', value: modifier.value, type: BreakdownComponentType.base, description: 'Direct modifier value' }] },
                            entity: modifier
                        });
                    }
                }
            }

            // Process choices (simplified - choices don't typically have calculated values)
            if (progression.choices) {
                for (const choice of progression.choices) {
                    results.push({
                        value: 0, // Choices don't have numeric values
                        breakdown: { components: [{ source: 'Choice', value: 0, type: BreakdownComponentType.choice, description: `Choice: ${choice.type}` }] },
                        entity: choice
                    });
                }
            }

            // Process effects (simplified - effects don't typically have calculated values)
            if (progression.effects) {
                for (const effect of progression.effects) {
                    results.push({
                        value: 0, // Effects don't have numeric values
                        breakdown: { components: [{ source: 'Effect', value: 0, type: BreakdownComponentType.base, description: `Effect: ${effect.effectType}` }] },
                        entity: effect
                    });
                }
            }
        }
        return results;
    }

    /**
     * Layer 1: Pure Formatting
     * Format individual calculated values using pure formatters
     */
    protected formatItems(
        calculatedValues: Array<{ value: number; breakdown: CalculationBreakdown; entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect }>,
        metadata?: FormatterMetadata
    ): Array<{ formattedValue: string; breakdown: CalculationBreakdown; entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect }> {
        return calculatedValues.map(({ value, breakdown, entity }) => {
            let formattedValue: string;

            if ('appliesTo' in entity) {
                // Modifier
                const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, entity.type, entity.appliesTo) as BaseFormatter;
                formattedValue = formatter ? formatter.format(value, entity, metadata) : `${value}`;
            } else if ('behavior' in entity) {
                // Choice
                const formatter = formatterRegistry.getFormatter(FeatureType.Choice, entity.type) as ChoiceFormatter;
                formattedValue = formatter ? formatter.formatChoice(entity, metadata) : `Choice: ${entity.type}`;
            } else if ('effectType' in entity) {
                // Effect
                const formatter = formatterRegistry.getFormatter(FeatureType.Effect, entity.effectType) as EffectFormatter;
                formattedValue = formatter ? formatter.format(entity, 1) : `Effect: ${entity.effectType}`;
            } else {
                formattedValue = `${value}`;
            }

            return {
                formattedValue,
                breakdown,
                entity
            };
        });
    }

    /**
     * Layer 5: Grouping
     * Group formatted items using grouping strategies
     */
    protected groupItems(
        formattedItems: Array<{ formattedValue: string; breakdown: CalculationBreakdown; entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect }>
    ): { formattedValue: string; breakdown: CalculationBreakdown } {
        if (formattedItems.length === 0) {
            return {
                formattedValue: '',
                breakdown: { components: [] }
            };
        }

        // Use modifier grouping strategy for multiple items
        const modifierGroupingStrategy = new ModifierGroupingStrategy();
        const groupedResult = modifierGroupingStrategy.group(formattedItems.map(item => ({
            formattedValue: item.formattedValue,
            breakdown: item.breakdown,
            metadata: undefined,
            modifier: 'appliesTo' in item.entity ? item.entity : undefined
        })));

        return {
            formattedValue: groupedResult.formattedValue,
            breakdown: groupedResult.breakdown
        };
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

        // Create calculation context for the specific progression level
        const calculationContext: CalculationContext = {
            level: progression.level,
            progressionLevel: progression.level,
            characterLevel: context?.currentLevel,
            character: context?.character
        };

        // Use imported progression generator with proper level range and calculator
        const formulaCalculator = calculatorRegistry.getDefaultFormulaCalculator();
        return progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            MAX_CHARACTER_LEVEL,
            calculationContext,
            undefined, // modifierValue
            formulaCalculator
        );
    }

    /**
     * Layer 4: Transition Detection
     * Detect transitions in progression values
     */
    protected detectTransitions(progressionValues: ProgressionValue[]): TransitionPoint[] {
        if (progressionValues.length === 0) {
            return [];
        }

        // Use imported transition detector
        return transitionDetector.findTransitions(progressionValues);
    }

    /**
     * Phase 6: Final Result Creation
     * Combine grouped result with transition information
     */
    protected createDisplayResult(
        groupedResult: { formattedValue: string; breakdown: CalculationBreakdown },
        transitions: TransitionPoint[],
        context?: DisplayContext
    ): DisplayResult {
        let formattedValue = groupedResult.formattedValue;

        // If we have transitions, format them into the result
        if (transitions.length > 0) {
            const transitionStrings = transitions.map(transition =>
                `Level ${transition.level}: ${transition.description}`
            );
            formattedValue = transitionStrings.join('; ');
        }

        return {
            formattedValue,
            breakdown: groupedResult.breakdown,
            showBreakdown: context?.showBreakdown || false,
            components: [],
            levelEntries: []
        };
    }

    /**
     * Calculate formula value using Layer 2 logic
     */
    protected calculateFormulaValue(
        formulaParams: FormulaParamsData,
        level: number,
        _context?: DisplayContext
    ): { value: number; breakdown: CalculationBreakdown } {
        // Simplified formula calculation for now
        // TODO: Integrate with proper formula calculator
        return {
            value: level, // Placeholder
            breakdown: { components: [{ source: 'Formula', value: level, type: BreakdownComponentType.formula, description: `Formula calculation at level ${level}` }] }
        };
    }

    protected processWithStrategy(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext
    ): string {
        // Determine the appropriate processing strategy based on entity characteristics
        if (this.isConditionalModifiersWithFormulas(entities)) {
            return this.processConditionalModifiersWithFormulas(entities, context);
        } else if (this.isConditionalModifiersWithoutFormulas(entities)) {
            return this.processConditionalModifiersWithoutFormulas(entities, context);
        } else if (this.isNonConditionalModifiersWithFormulas(entities)) {
            return this.processNonConditionalModifiersWithFormulas(entities, context);
        } else if (this.isNonConditionalModifiersWithoutFormulas(entities)) {
            return this.processNonConditionalModifiersWithoutFormulas(entities, context);
        } else if (this.isChoices(entities)) {
            return this.processChoicesWithStrategy(entities, context);
        } else if (this.isEffects(entities)) {
            return this.processEffectsWithStrategy(entities, context);
        }

        // Fallback: return empty string if no strategy can handle the entities
        return '';
    }

    protected processEntity(
        entity: FeatureModifier | FeatureChoice | FeatureSpecialEffect,
        config: ProcessingConfig,
        context: ProcessingContext
    ): ProcessingResult {
        try {
            const formatter = this.resolveFormatter(config);
            if (!formatter) {
                return {
                    formattedValue: `Unknown formatter for ${config.entityType}`,
                    success: false,
                    error: `No formatter found for entity type ${config.entityType}`
                };
            }
            const formattedValue = this.formatEntity(entity, formatter, context);

            return {
                formattedValue,
                success: true
            };
        } catch (error) {
            return {
                formattedValue: `Error processing entity`,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    protected resolveFormatter(config: ProcessingConfig): BaseFormatter | ChoiceFormatter | EffectFormatter | undefined {
        return formatterRegistry.getFormatter(config.entityType, config.subType!, config.subTypeId);
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
                return `Unknown entity type: ${context.entityType}`;
        }
    }

    protected createTempEntityWithValue(value: number, context: ProcessingContext): FeatureModifier | FeatureChoice | FeatureSpecialEffect {
        // This is a simplified approach - in practice, we'd need to handle different entity types
        // For now, assume we're dealing with modifiers since that's the most common case
        return {
            ...context.progression.modifiers![0],
            value
        } as FeatureModifier;
    }

    protected formatProgressionDisplayStrings(displayStrings: string[], startLevel: number): string {
        return displayStrings.map((displayString, index) => `Level ${startLevel + index}: ${displayString}`).join('; ');
    }



    protected isConditionalModifiersWithFormulas(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>): boolean {
        return entities.length > 0 &&
            entities.every(e => 'conditions' in e && e.conditions && e.conditions.length > 0) &&
            entities.every(e => 'formulaParams' in e && e.formulaParams?.formulaId);
    }

    protected isConditionalModifiersWithoutFormulas(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>): boolean {
        return entities.length > 0 &&
            entities.every(e => 'conditions' in e && e.conditions && e.conditions.length > 0) &&
            entities.every(e => !('formulaParams' in e) || !e.formulaParams?.formulaId);
    }

    protected isNonConditionalModifiersWithFormulas(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>): boolean {
        return entities.length > 0 &&
            entities.every(e => !('conditions' in e) || !e.conditions || e.conditions.length === 0) &&
            entities.every(e => 'formulaParams' in e && e.formulaParams?.formulaId);
    }

    protected isNonConditionalModifiersWithoutFormulas(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>): boolean {
        return entities.length > 0 &&
            entities.every(e => !('conditions' in e) || !e.conditions || e.conditions.length === 0) &&
            entities.every(e => !('formulaParams' in e) || !e.formulaParams?.formulaId);
    }

    protected isChoices(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>): boolean {
        return entities.length > 0 && entities.every(e => 'behavior' in e);
    }

    protected isEffects(entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>): boolean {
        return entities.length > 0 && entities.every(e => 'effectType' in e);
    }

    protected processConditionalModifiersWithFormulas(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifier[];
        return modifiers.map(modifier => {
            const conditionPrefix = this.formatConditionPrefix(modifier);
            const config: ProcessingConfig = {
                hasFormula: true,
                isCharacterDependent: false,
                hasProgression: false,
                isConditional: true,
                entityType: FeatureType.Modifier,
                subType: modifier.type,
                subTypeId: modifier.appliesTo
            };
            const result = this.processFormula(modifier.formulaParams!, config, context, conditionPrefix);
            return result.success ? result.formattedValue : `Error: ${result.error}`;
        }).join(' | ');
    }

    protected processConditionalModifiersWithoutFormulas(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifier[];
        return modifiers.map(modifier => {
            const conditionPrefix = this.formatConditionPrefix(modifier);
            const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, modifier.type, modifier.appliesTo) as BaseFormatter;
            const formattedValue = formatter ? formatter.format(modifier.value, modifier, context.metadata) : `${modifier.value}`;
            const modifierGroupingStrategy = new ModifierGroupingStrategy();
            const groupedResult = modifierGroupingStrategy.group([{
                formattedValue,
                breakdown: undefined,
                metadata: context.metadata,
                modifier
            }]);
            return `${conditionPrefix} - ${groupedResult.formattedValue}`;
        }).join(' | ');
    }

    protected processNonConditionalModifiersWithFormulas(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifier[];
        return modifiers.map(modifier => {
            const config: ProcessingConfig = {
                hasFormula: true,
                isCharacterDependent: false,
                hasProgression: false,
                isConditional: false,
                entityType: FeatureType.Modifier,
                subType: modifier.type,
                subTypeId: modifier.appliesTo
            };
            const result = this.processFormula(modifier.formulaParams!, config, context);
            return result.success ? result.formattedValue : `Error: ${result.error}`;
        }).join(', ');
    }

    protected processNonConditionalModifiersWithoutFormulas(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifier[];
        const modifierGroupingStrategy = new ModifierGroupingStrategy();
        const items = modifiers.map(modifier => {
            const formatter = formatterRegistry.getFormatter(FeatureType.Modifier, modifier.type, modifier.appliesTo) as BaseFormatter;
            const formattedValue = formatter ? formatter.format(modifier.value, modifier, context.metadata) : `${modifier.value}`;
            return {
                formattedValue,
                breakdown: undefined,
                metadata: context.metadata,
                modifier
            };
        });

        const groupedResult = modifierGroupingStrategy.group(items);
        return groupedResult.formattedValue;
    }

    protected processChoicesWithStrategy(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext
    ): string {
        const choices = entities as FeatureChoice[];
        return choices.map(choice => {
            const config: ProcessingConfig = {
                hasFormula: !!choice.formulaParams?.formulaId,
                isCharacterDependent: false,
                hasProgression: false,
                isConditional: false,
                entityType: FeatureType.Choice,
                subType: choice.type
            };

            if (choice.formulaParams?.formulaId) {
                const result = this.processFormula(choice.formulaParams, config, context);
                return result.success ? result.formattedValue : `Error: ${result.error}`;
            }

            const result = this.processEntity(choice, config, context);
            return result.success ? result.formattedValue : `Error: ${result.error}`;
        }).join(', ');
    }

    protected processEffectsWithStrategy(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext
    ): string {
        const effects = entities as FeatureSpecialEffect[];
        return effects.map(effect => {
            const config: ProcessingConfig = {
                hasFormula: false,
                isCharacterDependent: false,
                hasProgression: false,
                isConditional: false,
                entityType: FeatureType.Effect,
                subType: effect.effectType
            };

            const result = this.processEntity(effect, config, context);
            return result.success ? result.formattedValue : `Error: ${result.error}`;
        }).join(', ');
    }

    protected processFormula(
        formulaParams: FormulaParamsData,
        config: ProcessingConfig,
        context: ProcessingContext,
        conditionPrefix?: string
    ): ProcessingResult {
        const formulaDef = FORMULA_MAP[formulaParams.formulaId];

        if (!formulaDef) {
            return {
                formattedValue: `Unknown Formula (ID: ${formulaParams.formulaId})`,
                success: false,
                error: `Formula definition not found for formula ID: ${formulaParams.formulaId}`
            };
        }

        // Update config with formula properties
        config.isCharacterDependent = formulaDef.isCharacterDependent;
        config.hasProgression = formulaDef.hasProgression;

        if (config.hasProgression) {
            return this.processProgressionFormula(formulaParams, formulaDef, config, context, conditionPrefix);
        } else {
            return this.processNonProgressionFormula(formulaParams, formulaDef, config, context, conditionPrefix);
        }
    }

    protected processProgressionFormula(
        formulaParams: FormulaParamsData,
        formulaDef: FormulaDefinition,
        config: ProcessingConfig,
        context: ProcessingContext,
        conditionPrefix?: string
    ): ProcessingResult {
        if (config.isCharacterDependent) {
            const displayStrings = progressionGenerator.generateDisplayStrings(
                formulaParams,
                context.progression.level,
                20
            );
            const progressionString = this.formatProgressionDisplayStrings(displayStrings, context.progression.level);
            const formattedValue = conditionPrefix ? `${conditionPrefix} - ${progressionString}` : progressionString;

            return {
                formattedValue,
                success: true
            };
        } else {
            const formulaCalculator = calculatorRegistry.getDefaultFormulaCalculator();
            const values = progressionGenerator.generateProgressionValues(
                formulaParams,
                context.progression.level,
                20,
                undefined,
                (context.progression.modifiers?.[0] as FeatureModifier)?.value,
                formulaCalculator
            );

            // Use transition detector to find only the levels where values change
            const transitions = transitionDetector.findTransitions(values);

            // Include the starting level and transition levels
            const levelsToShow = new Set<number>();
            levelsToShow.add(context.progression.level); // Always include start level
            transitions.forEach(t => levelsToShow.add(t.level));

            // Sort levels for display
            const sortedLevels = Array.from(levelsToShow).sort((a, b) => a - b);

            const formattedValues = sortedLevels.map(level => {
                const val = values.find(v => v.level === level);
                if (!val) return `Level ${level}: Error - value not found`;

                // Create temporary entity with calculated value
                const tempEntity = this.createTempEntityWithValue(val.value, context);
                const tempConfig = { ...config };
                const tempContext = { ...context, metadata: { breakdown: val.breakdown } };

                const result = this.processEntity(tempEntity, tempConfig, tempContext);
                return result.success ? `Level ${level}: ${result.formattedValue}` : `Level ${level}: Error - ${result.error}`;
            });

            const progressionString = formattedValues.join('; ');
            const formattedValue = conditionPrefix ? `${conditionPrefix} - ${progressionString}` : progressionString;

            return {
                formattedValue,
                transitions: transitions.map(t => ({ level: t.level, type: 0, description: '', value: 0 })),
                success: true
            };
        }
    }

    protected processNonProgressionFormula(
        formulaParams: FormulaParamsData,
        formulaDef: FormulaDefinition,
        config: ProcessingConfig,
        context: ProcessingContext,
        conditionPrefix?: string
    ): ProcessingResult {
        const params = this.buildFormulaParams(formulaParams, context.progression.level, context.progression.level, context.context, (context.progression.modifiers?.[0] as FeatureModifier)?.value);

        if (config.isCharacterDependent) {
            const displayString = formulaDef.getDisplayString(params);
            const formattedValue = conditionPrefix ? `${conditionPrefix} - ${displayString}` : displayString;

            return {
                formattedValue,
                success: true
            };
        } else {
            const calculatedValue = formulaDef.calculate(params);
            const valueString = typeof calculatedValue === 'number' ? calculatedValue.toString() : calculatedValue;
            const formattedValue = conditionPrefix ? `${conditionPrefix} - ${valueString}` : valueString;

            return {
                formattedValue,
                success: true
            };
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
        return FEATURE_MODIFIER_CONDITION_TYPES[conditionType]?.name || 'Unknown';
    }

    protected getConditionValueName(conditionType: number, conditionValue: number | string): string {
        switch (conditionType) {
            case FeatureModifierConditionType.character_size:
                return SIZE_MAP[conditionValue as number]?.name || `Size ${conditionValue}`;
            case FeatureModifierConditionType.spell_school:
                return SPELL_SCHOOL_MAP[conditionValue as number]?.name || `Spell School ${conditionValue}`;
            case FeatureModifierConditionType.attack_type:
                return ATTACK_TYPES[conditionValue as number]?.name || `Attack Type ${conditionValue}`;
            default:
                return `Value ${conditionValue}`;
        }
    }

    protected buildFormulaParams(
        formula: { interval?: number; formulaStartLevel?: number; abilityId?: number; thresholds?: number[]; values?: Array<string | number> },
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

        const formulaCalculator = calculatorRegistry.getDefaultFormulaCalculator();
        const calculationContext: CalculationContext = {
            level: progression.level,
            progressionLevel: progression.level,
            characterLevel: context?.currentLevel || progression.level,
            character: context?.character
        };
        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            20,
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

        const formulaCalculator = calculatorRegistry.getDefaultFormulaCalculator();
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
            levelEntries.push({
                level: progression.level,
                description: `Level ${progression.level}`,
                items: result.formattedValue ? [{
                    featureId: progression.featureId,
                    formattedValue: result.formattedValue,
                    breakdown: result.breakdown
                }] : []
            });
        }

        return levelEntries;
    }


}

export class DetailPageDisplayStrategy extends DisplayStrategyBase {
    /**
     * Override to customize transition display for detail pages
     */
    protected formatTransitionInfo(
        baseResult: string,
        transitions: Array<{ level: number; type: number; description: string; value: number; previousValue?: number }>,
        _progression: FeatureProgression,
        _context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): string {
        // Detail pages show transition levels in parentheses
        const transitionLevels = transitions.map(t => t.level).join(', ');
        return `${baseResult} (transitions at levels: ${transitionLevels})`;
    }
    formatProgressions(
        progressions: FeatureProgression[],
        _context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): LevelEntry[] {
        // Group by level, then by feature
        const groupedByLevel = this.groupByLevel(progressions);
        const levelEntries: LevelEntry[] = [];

        for (const [level, levelProgressions] of groupedByLevel) {
            // Group by feature within each level
            const groupedByFeature = this.groupByFeature(levelProgressions);
            const formattedItems: LevelFormattedItem[] = [];

            for (const [featureId, featureProgressions] of groupedByFeature) {
                const formattedValue = this.formatFeatureGroup(featureProgressions, _context, _metadata);
                formattedItems.push({
                    featureId,
                    formattedValue,
                    breakdown: undefined // Detail pages don't need breakdowns
                });
            }

            levelEntries.push({
                level,
                description: `Level ${level}`,
                items: formattedItems
            });
        }

        return levelEntries;
    }

    private groupByLevel(progressions: FeatureProgression[]): Map<number, FeatureProgression[]> {
        const grouped = new Map<number, FeatureProgression[]>();

        for (const progression of progressions) {
            const level = progression.level;
            if (!grouped.has(level)) {
                grouped.set(level, []);
            }
            grouped.get(level)!.push(progression);
        }

        return grouped;
    }

    private groupByFeature(progressions: FeatureProgression[]): Map<number, FeatureProgression[]> {
        const grouped = new Map<number, FeatureProgression[]>();

        for (const progression of progressions) {
            const featureId = progression.featureId;
            if (!grouped.has(featureId)) {
                grouped.set(featureId, []);
            }
            grouped.get(featureId)!.push(progression);
        }

        return grouped;
    }

    private formatFeatureGroup(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        if (progressions.length === 1) {
            const result = this.orchestrateFormatting(progressions[0], context, metadata);
            return result.formattedValue;
        }

        // Multiple progressions for same feature - combine them
        const formattedParts: string[] = [];

        for (const progression of progressions) {
            const result = this.orchestrateFormatting(progression, context, metadata);
            if (result.formattedValue) {
                formattedParts.push(result.formattedValue);
            }
        }

        return formattedParts.join(', ');
    }
}

export class CharacterSheetDisplayStrategy extends DisplayStrategyBase {
    /**
     * Override to customize transition display for character sheets
     */
    protected formatTransitionInfo(
        baseResult: string,
        transitions: Array<{ level: number; type: number; description: string; value: number; previousValue?: number }>,
        _progression: FeatureProgression,
        context?: DisplayContext,
        _metadata?: FormatterMetadata
    ): string {
        // Character sheets show current value with transition levels
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formulaModifier = _progression.modifiers?.find(m => m.formulaParams?.formulaId);
        if (!formulaModifier?.formulaParams) {
            return baseResult;
        }

        const formulaCalculator = calculatorRegistry.getDefaultFormulaCalculator();
        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            _progression.level,
            currentLevel,
            undefined, // context
            undefined, // modifierValue
            formulaCalculator
        );
        const currentValue = values[values.length - 1]?.value || 0;
        const transitionLevels = transitions.map(t => t.level).join(', ');

        return `+${currentValue} (changes at levels: ${transitionLevels})`;
    }
    formatProgressions(
        progressions: FeatureProgression[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): LevelEntry[] {
        // Character sheet shows current level values only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formattedItems: LevelFormattedItem[] = [];

        for (const progression of progressions) {
            // Use orchestration for character sheet display
            const result = this.orchestrateFormatting(progression, context, metadata);
            if (result.formattedValue) {
                formattedItems.push({
                    featureId: progression.featureId,
                    formattedValue: result.formattedValue,
                    breakdown: result.breakdown
                });
            }
        }

        return [{
            level: currentLevel,
            description: `Level ${currentLevel}`,
            items: formattedItems
        }];
    }

    private processCharacterSheetEntities(
        entities: Array<FeatureModifier | FeatureChoice | FeatureSpecialEffect>,
        context: ProcessingContext,
        currentLevel: number
    ): string {
        // Handle modifiers with formulas
        const formulaModifiers = entities.filter(e => 'formulaParams' in e && e.formulaParams?.formulaId) as FeatureModifier[];
        if (formulaModifiers.length > 0) {
            // Use base class method for current value with transitions
            return this.getCurrentValueWithTransitions(context.progression, currentLevel, context.context, context.metadata);
        }

        // Handle choices
        const choices = entities.filter(e => 'behavior' in e) as FeatureChoice[];
        if (choices.length > 0) {
            const choiceDescriptions = choices.map(choice => {
                const formatter = formatterRegistry.getFormatter(FeatureType.Choice, choice.type) as ChoiceFormatter;
                return formatter ? formatter.formatChoice(choice, context.metadata) : `Choice: ${choice.type}`;
            });
            return choiceDescriptions.join(', ');
        }

        // Handle effects
        const effects = entities.filter(e => 'effectType' in e) as FeatureSpecialEffect[];
        if (effects.length > 0) {
            return effects.map(effect => {
                const config: ProcessingConfig = {
                    hasFormula: false,
                    isCharacterDependent: false,
                    hasProgression: false,
                    isConditional: false,
                    entityType: FeatureType.Effect,
                    subType: effect.effectType
                };
                const formatter = formatterRegistry.getFormatter(config.entityType, config.subType!, config.subTypeId);
                if (formatter) {
                    return (formatter as EffectFormatter).format(effect, currentLevel);
                }
                return `${effect.key}: ${effect.value}`;
            }).join(', ');
        }

        return '';
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
