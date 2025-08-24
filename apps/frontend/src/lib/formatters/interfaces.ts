import type {
  FormatterMetadata,
  DisplayContext,
  CalculationContext,
  CalculationResult,
  FeatureProgressionWithRelations,
  DisplayResult,
  EditPageDisplayResult,
  FeatureChoiceInQueryResponse,
  FormulaParamsData,
  ProgressionValue,
  TransitionPoint,
  FormattedItem,
  FeatureModifierInQueryResponse,
  ConditionalValue,
  CharacterContext
} from '@shared/schema';
import type { ModifierAppliesToType, DisplayType } from '@shared/static-data';

export interface BaseFormatter {
  format(value: number, metadata?: FormatterMetadata): string;
}

export interface ChoiceFormatter {
  formatChoice(choice: FeatureChoiceInQueryResponse, context?: DisplayContext): string;
}

export interface FormulaCalculator {
  calculate(formula: FormulaParamsData, level: number, context?: CalculationContext): CalculationResult;
}

export interface ProgressionGenerator {
  generateValues(formula: FormulaParamsData, startLevel: number, endLevel: number, context?: CalculationContext): Array<ProgressionValue>;
}

export interface TransitionDetector {
  findTransitions(values: Array<ProgressionValue>): Array<TransitionPoint>;
}

export interface GroupingStrategy {
  group(items: Array<FormattedItem>): string;
}

export interface DisplayStrategy {
  formatProgression?(progression: FeatureProgressionWithRelations, context?: DisplayContext): EditPageDisplayResult;
  formatProgressions?(progressions: FeatureProgressionWithRelations[], context?: DisplayContext): DisplayResult;
}

export interface FormatterOrchestrator {
  formatProgressionForEdit(progression: FeatureProgressionWithRelations, context?: DisplayContext): EditPageDisplayResult;
  formatProgressionsForDetail(progressions: FeatureProgressionWithRelations[], context?: DisplayContext): DisplayResult;
  formatProgressionsForCharacterSheet(progressions: FeatureProgressionWithRelations[], context?: DisplayContext): DisplayResult;
  formatProgressions(progressions: FeatureProgressionWithRelations[], displayType: DisplayType, context?: DisplayContext): DisplayResult | EditPageDisplayResult[];
  getDisplayStrategy(displayType: DisplayType): DisplayStrategy;
  formatValue(value: number, appliesToType: ModifierAppliesToType, metadata?: FormatterMetadata): string;
  formatChoice(choice: FeatureChoiceInQueryResponse, context?: DisplayContext): string;
  generateProgressionValues(formula: FormulaParamsData, startLevel: number, endLevel: number, context?: CalculationContext): ProgressionValue[];
  findTransitions(values: ProgressionValue[]): TransitionPoint[];
  getCurrentValue(progression: FeatureProgressionWithRelations, targetLevel: number, context?: DisplayContext): number;
  getMaxValue(progression: FeatureProgressionWithRelations, maxLevel: number, context?: DisplayContext): number;
  hasTransitions(progression: FeatureProgressionWithRelations, maxLevel: number, context?: DisplayContext): boolean;
  getTransitionLevels(progression: FeatureProgressionWithRelations, maxLevel: number, context?: DisplayContext): number[];
}

export interface ConditionalValueDetector {
  detectConditionals(modifiers: FeatureModifierInQueryResponse[], context?: CharacterContext): Array<ConditionalValue>;
}
