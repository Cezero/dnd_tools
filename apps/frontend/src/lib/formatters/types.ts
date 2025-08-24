import type {
    FeatureChoiceType,
    FeatureChoiceBehavior,
    ModifierType,
    FeatureBonusType,
    ModifierAppliesToType,
    FeatureModifierConditionType,
    FeatureSpecialEffectType
} from '@shared/static-data';

// Import inferred types from shared schema
import type {
    FeatureChoiceInQueryResponse as ChoiceData,
    FeatureModifierInQueryResponse as ModifierData,
    FeatureSpecialEffectInQueryResponse as EffectData,
    FeatureProgressionWithRelations as ProgressionData,
    FeatureModifierConditionInQueryResponse as ModifierConditionData,
    FormulaParamsData,
    CharacterContext,
    DisplayContext,
    CalculationContext,
    BreakdownComponent,
    CalculationBreakdown,
    ConditionalValue,
    CalculationResult,
    ProgressionValue,
    TransitionPoint,
    ConditionalDisplay,
    DisplayResult,
    EditPageDisplayResult,
    CharacterSheetCalculationInput,
    ChoiceBasedCalculation,
    FormatterMetadata,
    FormattedItem
} from '@shared/schema';

// All types are now imported from @shared/schema
// No additional interface definitions needed
