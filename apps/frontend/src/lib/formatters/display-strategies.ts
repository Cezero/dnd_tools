import type {
    FeatureProgressionWithRelations,
    FeatureModifierInQueryResponse,
    FeatureChoiceInQueryResponse,
    FormulaParamsData,
    FeatureSpecialEffectInQueryResponse
} from '@shared/schema';
import { DisplayType, FORMULA_MAP, FEATURE_MODIFIER_CONDITION_TYPES, SIZE_MAP, SPELL_SCHOOL_MAP, ATTACK_TYPES, FeatureModifierConditionType } from '@shared/static-data';

import { formatterOrchestrator } from './formatter-orchestrator';
import { formatterRegistry } from './formatter-registry';
import { ModifierGroupingStrategy } from './grouping-strategies';
import { progressionGenerator, transitionDetector } from './progression-generators';
import type {
    DisplayContext,
    DisplayResult,
    EditPageDisplayResult,
    LevelEntry,
    LevelFormattedItem,
    FormattedItemWithBreakdown,
    GroupingStrategy,
    DisplayStrategy,
    ProgressionValue,
    FormatterMetadata,
    FormulaDefinition,
    ProcessingConfig,
    ProcessingContext,
    ProcessingResult,
    BaseFormatter,
    ChoiceFormatter,
    EffectFormatter
} from './types';
import { FeatureType } from './types';

abstract class DisplayStrategyBase implements DisplayStrategy {
    abstract formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult;

    protected processWithStrategy(
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
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
        entity: FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse,
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
        entity: FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse,
        formatter: BaseFormatter | ChoiceFormatter | EffectFormatter,
        context: ProcessingContext
    ): string {
        switch (context.entityType) {
            case FeatureType.Modifier: {
                const modifier = entity as FeatureModifierInQueryResponse;
                return (formatter as BaseFormatter).format(modifier.value, modifier, context.metadata);
            }
            case FeatureType.Choice: {
                const choice = entity as FeatureChoiceInQueryResponse;
                return (formatter as ChoiceFormatter).formatChoice(choice, context.metadata);
            }
            case FeatureType.Effect: {
                const effect = entity as FeatureSpecialEffectInQueryResponse;
                return (formatter as EffectFormatter).format(effect, context.level || 1);
            }
            default:
                return `Unknown entity type: ${context.entityType}`;
        }
    }

    protected createTempEntityWithValue(value: number, context: ProcessingContext): FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse {
        // This is a simplified approach - in practice, we'd need to handle different entity types
        // For now, assume we're dealing with modifiers since that's the most common case
        return {
            ...context.progression.modifiers![0],
            value
        } as FeatureModifierInQueryResponse;
    }

    protected formatProgressionDisplayStrings(displayStrings: string[], startLevel: number): string {
        return displayStrings.map((displayString, index) => `Level ${startLevel + index}: ${displayString}`).join('; ');
    }



    protected isConditionalModifiersWithFormulas(entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>): boolean {
        return entities.length > 0 &&
            entities.every(e => 'conditions' in e && e.conditions && e.conditions.length > 0) &&
            entities.every(e => 'formulaParams' in e && e.formulaParams?.formulaId);
    }

    protected isConditionalModifiersWithoutFormulas(entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>): boolean {
        return entities.length > 0 &&
            entities.every(e => 'conditions' in e && e.conditions && e.conditions.length > 0) &&
            entities.every(e => !('formulaParams' in e) || !e.formulaParams?.formulaId);
    }

    protected isNonConditionalModifiersWithFormulas(entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>): boolean {
        return entities.length > 0 &&
            entities.every(e => !('conditions' in e) || !e.conditions || e.conditions.length === 0) &&
            entities.every(e => 'formulaParams' in e && e.formulaParams?.formulaId);
    }

    protected isNonConditionalModifiersWithoutFormulas(entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>): boolean {
        return entities.length > 0 &&
            entities.every(e => !('conditions' in e) || !e.conditions || e.conditions.length === 0) &&
            entities.every(e => !('formulaParams' in e) || !e.formulaParams?.formulaId);
    }

    protected isChoices(entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>): boolean {
        return entities.length > 0 && entities.every(e => 'behavior' in e);
    }

    protected isEffects(entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>): boolean {
        return entities.length > 0 && entities.every(e => 'effectType' in e);
    }

    protected processConditionalModifiersWithFormulas(
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifierInQueryResponse[];
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
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifierInQueryResponse[];
        return modifiers.map(modifier => {
            const conditionPrefix = this.formatConditionPrefix(modifier);
            const formattedValue = formatterOrchestrator.formatModifier(modifier.value, modifier.appliesTo, modifier, context.metadata);
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
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifierInQueryResponse[];
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
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
        context: ProcessingContext
    ): string {
        const modifiers = entities as FeatureModifierInQueryResponse[];
        const modifierGroupingStrategy = new ModifierGroupingStrategy();
        const items = modifiers.map(modifier => {
            const formattedValue = formatterOrchestrator.formatModifier(modifier.value, modifier.appliesTo, modifier, context.metadata);
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
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
        context: ProcessingContext
    ): string {
        const choices = entities as FeatureChoiceInQueryResponse[];
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
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
        context: ProcessingContext
    ): string {
        const effects = entities as FeatureSpecialEffectInQueryResponse[];
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
            const values = progressionGenerator.generateProgressionValues(
                formulaParams,
                context.progression.level,
                20,
                undefined,
                (context.progression.modifiers?.[0] as FeatureModifierInQueryResponse)?.value
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
        const params = this.buildFormulaParams(formulaParams, context.progression.level, context.progression.level, context.context, (context.progression.modifiers?.[0] as FeatureModifierInQueryResponse)?.value);

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

    protected formatConditionPrefix(modifier: FeatureModifierInQueryResponse): string {
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
        progression: FeatureProgressionWithRelations,
        baseResult: string,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams?.formulaId);
        if (!formulaModifier?.formulaParams) {
            return baseResult;
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            20
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
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        // Default implementation: append transition levels in parentheses
        const transitionLevels = transitions.map(t => t.level).join(', ');
        return `${baseResult} (transitions at levels: ${transitionLevels})`;
    }

    /**
     * Get current value and transition information for character sheet display
     */
    protected getCurrentValueWithTransitions(
        progression: FeatureProgressionWithRelations,
        currentLevel: number,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams?.formulaId);
        if (!formulaModifier?.formulaParams) {
            return '';
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            currentLevel
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
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        // Edit page processes each progression individually
        const levelEntries: LevelEntry[] = [];

        for (const progression of progressions) {
            const formattedValue = this.formatSingleProgression(progression, context, metadata);
            if (formattedValue) {
                levelEntries.push({
                    level: progression.level,
                    description: `Level ${progression.level}`,
                    items: [{
                        featureId: progression.featureId,
                        formattedValue,
                        breakdown: undefined
                    }]
                });
            }
        }

        return {
            formattedValue: "Edit Page Display",
            breakdown: { components: [] },
            showBreakdown: true,
            components: [],
            levelEntries
        };
    }

    formatProgression(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): EditPageDisplayResult {
        // Each FeatureProgression produces exactly one formatted string
        const formattedValue = this.formatSingleProgression(progression, context, metadata);

        // Find formula params in modifiers
        const formulaModifier = progression.modifiers?.find(m => m.formulaParams);
        const breakdown = formulaModifier?.formulaParams ? {
            components: []
        } : undefined;

        return {
            progressionId: progression.id,
            formattedValue,
            breakdown
        };
    }

    private formatSingleProgression(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        console.log('formatSingleProgression called with:', {
            level: progression.level,
            hasModifiers: progression.modifiers && progression.modifiers.length > 0,
            hasChoices: progression.choices && progression.choices.length > 0,
            hasEffects: progression.effects && progression.effects.length > 0,
            effects: progression.effects
        });

        // Only return early if there are no modifiers, choices, or effects
        if ((!progression.modifiers || progression.modifiers.length === 0) &&
            (!progression.choices || progression.choices.length === 0) &&
            (!progression.effects || progression.effects.length === 0)) {
            return '';
        }

        // Create processing context
        const processingContext: ProcessingContext = {
            progression,
            context,
            metadata,
            level: progression.level,
            entityType: FeatureType.Modifier // Will be overridden by strategy
        };

        // Collect all entities for unified processing
        const allEntities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse> = [
            ...(progression.modifiers || []),
            ...(progression.choices || []),
            ...(progression.effects || [])
        ];

        // Use shared utility for unified processing
        if (allEntities.length > 0) {
            return this.processWithStrategy(allEntities, processingContext);
        }

        // Simple progression
        console.log('Falling back to simple progression for level:', progression.level);
        return `Level ${progression.level}`;
    }
}

export class DetailPageDisplayStrategy extends DisplayStrategyBase {
    /**
     * Override to customize transition display for detail pages
     */
    protected formatTransitionInfo(
        baseResult: string,
        transitions: Array<{ level: number; type: number; description: string; value: number; previousValue?: number }>,
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        // Detail pages show transition levels in parentheses
        const transitionLevels = transitions.map(t => t.level).join(', ');
        return `${baseResult} (transitions at levels: ${transitionLevels})`;
    }
    formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        // Group by level, then by feature
        const groupedByLevel = this.groupByLevel(progressions);
        const levelEntries: LevelEntry[] = [];

        for (const [level, levelProgressions] of groupedByLevel) {
            // Group by feature within each level
            const groupedByFeature = this.groupByFeature(levelProgressions);
            const formattedItems: LevelFormattedItem[] = [];

            for (const [featureId, featureProgressions] of groupedByFeature) {
                const formattedValue = this.formatFeatureGroup(featureProgressions, context, metadata);
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

        return {
            formattedValue: "Detail Page Display",
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries
        };
    }

    private groupByLevel(progressions: FeatureProgressionWithRelations[]): Map<number, FeatureProgressionWithRelations[]> {
        const grouped = new Map<number, FeatureProgressionWithRelations[]>();

        for (const progression of progressions) {
            const level = progression.level;
            if (!grouped.has(level)) {
                grouped.set(level, []);
            }
            grouped.get(level)!.push(progression);
        }

        return grouped;
    }

    private groupByFeature(progressions: FeatureProgressionWithRelations[]): Map<number, FeatureProgressionWithRelations[]> {
        const grouped = new Map<number, FeatureProgressionWithRelations[]>();

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
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        if (progressions.length === 1) {
            return this.formatSingleProgression(progressions[0], context, metadata);
        }

        // Multiple progressions for same feature - combine them
        const formattedParts: string[] = [];

        for (const progression of progressions) {
            const formattedPart = this.formatSingleProgression(progression, context, metadata);
            if (formattedPart) {
                formattedParts.push(formattedPart);
            }
        }

        return formattedParts.join(', ');
    }

    private formatSingleProgression(
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        // Create processing context
        const processingContext: ProcessingContext = {
            progression,
            context,
            metadata,
            level: progression.level,
            entityType: FeatureType.Modifier // Will be overridden by strategy
        };

        // Collect all entities for unified processing
        const allEntities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse> = [
            ...(progression.modifiers || []),
            ...(progression.choices || []),
            ...(progression.effects || [])
        ];

        // Use strategy pattern for unified processing
        if (allEntities.length > 0) {
            const result = this.processWithStrategy(allEntities, processingContext);

            // Use base class method for enhanced transition formatting
            return this.formatFormulaProgressionWithTransitions(progression, result, context, metadata);
        }

        return '';
    }
}

export class CharacterSheetDisplayStrategy extends DisplayStrategyBase {
    /**
     * Override to customize transition display for character sheets
     */
    protected formatTransitionInfo(
        baseResult: string,
        transitions: Array<{ level: number; type: number; description: string; value: number; previousValue?: number }>,
        progression: FeatureProgressionWithRelations,
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): string {
        // Character sheets show current value with transition levels
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formulaModifier = progression.modifiers?.find(m => m.formulaParams?.formulaId);
        if (!formulaModifier?.formulaParams) {
            return baseResult;
        }

        const values = progressionGenerator.generateProgressionValues(
            formulaModifier.formulaParams,
            progression.level,
            currentLevel
        );
        const currentValue = values[values.length - 1]?.value || 0;
        const transitionLevels = transitions.map(t => t.level).join(', ');

        return `+${currentValue} (changes at levels: ${transitionLevels})`;
    }
    formatProgressions(
        progressions: FeatureProgressionWithRelations[],
        context?: DisplayContext,
        metadata?: FormatterMetadata
    ): DisplayResult {
        // Character sheet shows current level values only
        const currentLevel = context?.character?.classLevels ?
            Math.max(...Object.values(context.character.classLevels)) : 1;

        const formattedItems: LevelFormattedItem[] = [];

        for (const progression of progressions) {
            // Create processing context
            const processingContext: ProcessingContext = {
                progression,
                context,
                metadata,
                level: currentLevel,
                entityType: FeatureType.Modifier // Will be overridden by strategy
            };

            // Collect all entities for unified processing
            const allEntities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse> = [
                ...(progression.modifiers || []),
                ...(progression.choices || []),
                ...(progression.effects || [])
            ];

            // Use unified processing for character sheet display
            if (allEntities.length > 0) {
                const formattedValue = this.processCharacterSheetEntities(allEntities, processingContext, currentLevel);
                if (formattedValue) {
                    formattedItems.push({
                        featureId: progression.featureId,
                        formattedValue,
                        breakdown: undefined // Character sheet doesn't show breakdowns
                    });
                }
            }
        }

        return {
            formattedValue: "Character Sheet Display",
            breakdown: { components: [] },
            showBreakdown: false,
            components: [],
            levelEntries: [{
                level: currentLevel,
                description: `Level ${currentLevel}`,
                items: formattedItems
            }]
        };
    }

    private processCharacterSheetEntities(
        entities: Array<FeatureModifierInQueryResponse | FeatureChoiceInQueryResponse | FeatureSpecialEffectInQueryResponse>,
        context: ProcessingContext,
        currentLevel: number
    ): string {
        // Handle modifiers with formulas
        const formulaModifiers = entities.filter(e => 'formulaParams' in e && e.formulaParams?.formulaId) as FeatureModifierInQueryResponse[];
        if (formulaModifiers.length > 0) {
            // Use base class method for current value with transitions
            return this.getCurrentValueWithTransitions(context.progression, currentLevel, context.context, context.metadata);
        }

        // Handle choices
        const choices = entities.filter(e => 'behavior' in e) as FeatureChoiceInQueryResponse[];
        if (choices.length > 0) {
            const choiceDescriptions = choices.map(choice =>
                formatterOrchestrator.formatChoice(choice, context.metadata)
            );
            return choiceDescriptions.join(', ');
        }

        // Handle effects
        const effects = entities.filter(e => 'effectType' in e) as FeatureSpecialEffectInQueryResponse[];
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

export class DisplayStrategyFactory {
    static createStrategy(displayType: DisplayType): DisplayStrategy {
        switch (displayType) {
            case DisplayType.Edit:
                return new EditPageDisplayStrategy();
            case DisplayType.Detail:
                return new DetailPageDisplayStrategy();
            case DisplayType.CharacterSheet:
                return new CharacterSheetDisplayStrategy();
            default:
                throw new Error(`Unknown display type: ${displayType}`);
        }
    }
}

export const editPageStrategy = new EditPageDisplayStrategy();
export const detailPageStrategy = new DetailPageDisplayStrategy();
export const characterSheetStrategy = new CharacterSheetDisplayStrategy();

export const displayStrategyFactory = DisplayStrategyFactory;
