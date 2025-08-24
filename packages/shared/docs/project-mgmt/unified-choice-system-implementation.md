# Unified Choice System Implementation

This document provides comprehensive documentation of the unified choice system implementation, including technical details, examples, and formatting logic.

## Overview

The unified choice system provides a consistent architecture for handling player choices in feature progressions, supporting both filtered choices (e.g., "Fighter Bonus Feats") and specific choices (e.g., "Improved Grapple or Stunning Fist"). The system integrates seamlessly with the formula system for dynamic progression patterns.

## Architecture

### Database Schema

#### FeatureChoice Model
```prisma
model FeatureChoice {
  id                Int      @id @default(autoincrement())
  progressionId     Int
  label             String
  pickCount         Int      @default(1)
  type              Int      // References FeatureChoiceType enum
  behavior          Int      // References FeatureChoiceBehavior enum
  featId            Int?     // For specific feat selection
  featureId         Int?     // For specific feature selection
  filterType        Int?     // References FeatureFeatChoiceFilter enum
  formulaParamsId   Int?     // For formula-based choices
  formulaParams     FeatureFormulaParams? @relation(fields: [formulaParamsId], references: [id])
  
  progression       FeatureProgression @relation(fields: [progressionId], references: [id], onDelete: Cascade)
}
```

#### Static Data Enums
```typescript
// FeatureChoiceType (in @shared/static-data)
enum FeatureChoiceType {
  Feat = 0,
  Feature = 1,
  CreatureType = 2
}

// FeatureChoiceBehavior (in @shared/static-data)
enum FeatureChoiceBehavior {
  Single = 0,
  Multiple = 1,
  Allocation = 2
}

// FeatureFeatChoiceFilter (in @shared/static-data)
enum FeatureFeatChoiceFilter {
  Any = 0,
  FighterBonus = 1,
  MetamagicOrItemCreation = 2
}
```

### Formula Integration

The choice system integrates with the formula system through `FeatureFormulaParams`, allowing dynamic progression patterns:

```typescript
// Example: Fighter bonus feats every 2 levels starting at level 2
{
  type: FeatureChoiceType.Feat,
  behavior: FeatureChoiceBehavior.Single,
  filterType: FeatureFeatChoiceFilter.FighterBonus,
  formulaParams: {
    formulaId: FormulaId.EVERY_N_LEVELS,
    interval: 2,
    formulaStartLevel: 2
  }
}
```

## Implementation Examples

### Fighter Bonus Feats

**Configuration:**
- **Type**: Feat
- **Behavior**: Single
- **Filter Type**: FighterBonus
- **Formula**: EVERY_N_LEVELS (interval: 2, startLevel: 2)

**Display Logic:**
- **ClassEdit.tsx**: "Level 1 (Fighter Bonus), Level 2 (Fighter Bonus), Level 4 (Fighter Bonus), ..."
- **ClassDetail.tsx**: "Fighter Bonus" at Level 1, individual entries for Levels 2, 4, 6, etc.

**Implementation Details:**
```typescript
// Original progression (Level 1) - non-formula choice
{
  level: 1,
  choices: [{
    type: FeatureChoiceType.Feat,
    behavior: FeatureChoiceBehavior.Single,
    filterType: FeatureFeatChoiceFilter.FighterBonus,
    formulaParamsId: null
  }]
}

// Synthetic entries (Levels 2, 4, 6, etc.) - formula-based choices
{
  level: 2,
  choices: [{
    type: FeatureChoiceType.Feat,
    behavior: FeatureChoiceBehavior.Single,
    filterType: FeatureFeatChoiceFilter.FighterBonus,
    formulaParamsId: null // Formula context removed for display
  }]
}
```

### Wizard Bonus Feats

**Configuration:**
- **Type**: Feat
- **Behavior**: Single
- **Filter Type**: MetamagicOrItemCreation
- **Formula**: EVERY_N_LEVELS (interval: 5, startLevel: 5)

**Display Logic:**
- **ClassEdit.tsx**: "Level 5 (Metamagic or Item Creation), Level 10 (Metamagic or Item Creation), Level 15 (Metamagic or Item Creation), Level 20 (Metamagic or Item Creation)"
- **ClassDetail.tsx**: "Metamagic or Item Creation" at Level 5, individual entries for Levels 10, 15, 20

**Implementation Details:**
```typescript
// Original progression (Level 5) - formula-based choice with context removed
{
  level: 5,
  choices: [{
    type: FeatureChoiceType.Feat,
    behavior: FeatureChoiceBehavior.Single,
    filterType: FeatureFeatChoiceFilter.MetamagicOrItemCreation,
    formulaParamsId: null // Formula context removed for simple display
  }]
}

// Synthetic entries (Levels 10, 15, 20) - formula-based choices
{
  level: 10,
  choices: [{
    type: FeatureChoiceType.Feat,
    behavior: FeatureChoiceBehavior.Single,
    filterType: FeatureFeatChoiceFilter.MetamagicOrItemCreation,
    formulaParamsId: null // Formula context removed for display
  }]
}
```

### Rogue Special Abilities

**Configuration:**
- **Type**: Feat
- **Behavior**: Single
- **Filter Type**: Any (or specific feat selection)
- **Formula**: EVERY_N_LEVELS (interval: 3, startLevel: 10)

**Display Logic:**
- **ClassEdit.tsx**: "Level 10 (Special Ability), Level 13 (Special Ability), Level 16 (Special Ability), Level 19 (Special Ability)"
- **ClassDetail.tsx**: Individual "Special Ability" entries for Levels 10, 13, 16, 19

## Display System Architecture

### Formatter System

The display system uses a sophisticated formatter architecture to handle different display contexts:

#### PROGRESSION_FORMATTERS
```typescript
const PROGRESSION_FORMATTERS = {
  [ModifierAppliesToType.Choice]: createUnifiedChoiceFormatter(),
  // ... other formatters
};
```

#### createUnifiedChoiceFormatter
```typescript
function createUnifiedChoiceFormatter() {
  return {
    value: (valueInt: number, appliesToId: number, bonusType: number | null, character: CharacterContext | undefined, modifier: any, progression: any) => {
      // Handle choice formatting logic
      const choices = progression.choices || [];
      const choiceLabels = choices.map(choice => {
        if (choice.filterType !== null && choice.filterType !== undefined) {
          const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType);
          return filterOption?.label || choice.label;
        }
        return choice.label;
      }).filter(Boolean);
      
      return choiceLabels.join('|');
    }
  };
}
```

### expandFormulaProgressions Function

This function creates synthetic progression entries for formula-based features:

```typescript
export function expandFormulaProgressions(progressions: FeatureProgressionWithRelations[]): FeatureProgressionWithRelations[] {
  const expanded: FeatureProgressionWithRelations[] = [];

  for (const progression of progressions) {
    const hasFormulaChoices = progression.choices?.some(choice => 
      choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId)
    );

    if (!hasFormulaChoices) {
      expanded.push(progression);
      continue;
    }

    // Check if this is a mixed progression (both formula and non-formula choices)
    const hasNonFormulaChoices = progression.choices?.some(choice =>
      !choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)
    ) || false;

    if (hasNonFormulaChoices) {
      // For mixed progressions (like Fighter), only include non-formula choices in original
      const nonFormulaChoices = progression.choices?.filter(choice =>
        !choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)
      ).map(choice => ({
        ...choice,
        formulaParamsId: null,
        formulaParams: null
      })) || [];

      expanded.push({
        ...progression,
        choices: nonFormulaChoices
      });
    } else {
      // For formula-only progressions (like Wizard), remove formula context from original
      const originalProgression = {
        ...progression,
        choices: progression.choices?.map(choice => ({
          ...choice,
          formulaParamsId: null,
          formulaParams: null
        })) || []
      };
      expanded.push(originalProgression);
    }

    // Create synthetic entries for formula-based levels
    const transitionLevels = getFormulaTransitionLevels(progression);
    for (const level of transitionLevels) {
      if (level === progression.level) continue;
      
      // Create synthetic entry with formula context removed
      const expandedProgression = {
        ...progression,
        id: progression.id + level * 1000,
        level: level,
        choices: progression.choices?.filter(choice => {
          const hasFormula = choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId);
          return hasFormula;
        }).map(choice => ({
          ...choice,
          id: choice.id + level * 1000,
          formulaParamsId: null,
          formulaParams: null
        })) || []
      };
      expanded.push(expandedProgression);
    }
  }

  return expanded;
}
```

### formatProgression Function

This function handles the actual formatting of individual progressions:

```typescript
export function formatProgression(progression: FeatureProgressionWithRelations, character?: CharacterContext): { label: string; value: string; note?: string } {
  const hasFormulaChoices = progression.choices?.some(choice => 
    choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId)
  ) || false;

  if (hasFormulaChoices && progression.choices && progression.choices.length > 0) {
    // Handle formula-based choices
    const nonFormulaChoices = progression.choices.filter(choice =>
      !choice.formulaParamsId && !(choice.formulaParams && choice.formulaParams.formulaId)
    );

    const formulaChoices = progression.choices.filter(choice =>
      choice.formulaParamsId || (choice.formulaParams && choice.formulaParams.formulaId)
    );

    const parts: string[] = [];

    // Add non-formula choices
    if (nonFormulaChoices.length > 0) {
      const nonFormulaLabels = nonFormulaChoices.map(choice => {
        if (choice.filterType !== null && choice.filterType !== undefined) {
          const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType);
          return filterOption?.label || choice.label;
        }
        return choice.label;
      }).filter(Boolean);

      if (nonFormulaLabels.length > 0) {
        parts.push(`Level ${progression.level} (${nonFormulaLabels.join('|')})`);
      }
    }

    // Add formula pattern
    if (formulaChoices.length > 0) {
      const choiceLabels = formulaChoices.map(choice => {
        if (choice.filterType !== null && choice.filterType !== undefined) {
          const filterOption = FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST.find(opt => opt.value === choice.filterType);
          return filterOption?.label || choice.label;
        }
        return choice.label;
      }).filter(Boolean);

      if (choiceLabels.length > 0) {
        const isSyntheticEntry = progression.id > 10000;
        
        if (isSyntheticEntry) {
          // For synthetic entries, generate full formula pattern
          const firstChoice = formulaChoices[0];
          const pattern = getFormulaProgressionPattern(firstChoice, progression.level, character, progression);
          if (pattern) {
            const combinedChoiceText = choiceLabels.join('|');
            const combinedPattern = pattern.replace(/\([^)]+\)/g, `(${combinedChoiceText})`);
            parts.push(combinedPattern);
          }
        } else {
          // For original entries, generate full formula pattern (for ClassEdit.tsx)
          const firstChoice = formulaChoices[0];
          const pattern = getFormulaProgressionPattern(firstChoice, progression.level, character, progression);
          if (pattern) {
            const combinedChoiceText = choiceLabels.join('|');
            const combinedPattern = pattern.replace(/\([^)]+\)/g, `(${combinedChoiceText})`);
            parts.push(combinedPattern);
          }
        }
      }
    }

    if (parts.length > 0) {
      return {
        label: '',
        value: parts.join(', '),
        note: undefined
      };
    }
  }

  // Fallback to unified formatter for other cases
  const unifiedFormatter = createUnifiedChoiceFormatter();
  const choiceOptions = unifiedFormatter.value(0, 0, null, undefined, {}, progression);
  
  if (choiceOptions && choiceOptions !== 'choice' && choiceOptions !== progression?.feature?.name) {
    return {
      label: '',
      value: choiceOptions,
      note: undefined
    };
  }

  return {
    label: progression.feature?.name || `Feature ${progression.featureId}`,
    value: '',
    note: undefined
  };
}
```

## UI Components

### FeatureProgressionDetailEdit.tsx

The main UI component for editing feature progressions includes comprehensive choice support:

#### Choice Detail Form
```typescript
function ChoiceDetailForm({ index }: ChoiceDetailFormProps) {
  // Main choice fields in a compact grid
  <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-3">
    <ValidatedCustomSelect
      field={`choices.${index}.type`}
      label="Type"
      options={choiceTypeOptions}
    />
    <ValidatedCustomSelect
      field={`choices.${index}.formulaParams.formulaId`}
      label="Formula"
      options={FORMULA_SELECT_LIST}
    />
    <ValidatedInput
      field={`choices.${index}.label`}
      label="Label"
      placeholder="e.g., Bonus Feat"
    />
  </div>

  {/* Feat-specific fields */}
  {isFeatChoice && (
    <div className="grid grid-cols-2 gap-3">
      <ValidatedCustomSelect
        field={`choices.${index}.filterType`}
        label="Feat Filter Type"
        options={FEATURE_FEAT_CHOICE_FILTER_SELECT_LIST}
      />
      <ValidatedCustomSelect
        field={`choices.${index}.featId`}
        label="Specific Feat (Optional)"
        options={availableFeats.map(feat => ({ value: feat.id, label: feat.name }))}
      />
    </div>
  )}
}
```

#### Formula Preview Component
```typescript
function FormulaPreview({ modifier, progressionLevel }: { modifier: any; progressionLevel: number }) {
  const isChoice = modifier.type !== undefined && modifier.behavior !== undefined &&
    typeof modifier.type === 'number' && typeof modifier.behavior === 'number';
  const appliesTo = isChoice ? ModifierAppliesToType.Choice : modifier.appliesTo;

  const formatter = PROGRESSION_FORMATTERS[appliesTo];
  if (!formatter) {
    return <p className="text-xs text-red-600 dark:text-red-400">No formatter for type</p>;
  }

  const progressionPattern = getFormulaProgressionPattern(modifier, progressionLevel, undefined, progressionData);

  return (
    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
      <div className="font-medium mb-1">Formula Preview:</div>
      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
        {progressionPattern}
      </div>
    </div>
  );
}
```

## Legacy System Cleanup

### Removed Components

The following legacy components were removed during the unification:

1. **ModifierAppliesToType.Choice**: Deprecated choice system using FeatureModifier
2. **Legacy choice formatters**: Old formatters that handled choice modifiers
3. **Redundant UI components**: Choice-specific UI that was replaced by unified system

### Migration Process

The migration involved:

1. **Database Updates**: Converting existing choice modifiers to FeatureChoice records
2. **Schema Updates**: Updating Zod schemas to use new enum types
3. **UI Updates**: Updating all UI components to use unified choice system
4. **Formatter Updates**: Enhancing formatters to handle both original and synthetic entries
5. **Testing**: Verifying all existing functionality continues to work

## Success Criteria

The unified choice system implementation is considered complete when:

- ✅ All core classes (Fighter, Wizard, Rogue) display correctly in both ClassEdit.tsx and ClassDetail.tsx
- ✅ Formula-based choices work seamlessly with EVERY_N_LEVELS formula
- ✅ Filtered choices (FighterBonus, MetamagicOrItemCreation) display with proper labels
- ✅ Legacy choice system has been completely removed
- ✅ All UI components support the unified choice system
- ✅ Formatters handle both original and synthetic progression entries correctly
- ✅ Formula previews work correctly for choice-based features

## Future Enhancements

The unified choice system provides a solid foundation for future enhancements:

1. **Additional Filter Types**: New filter types for different feat categories
2. **Complex Choice Logic**: Support for choice-dependent modifiers and effects
3. **Character Sheet Integration**: Direct integration with character choice selection
4. **Validation Rules**: Enhanced validation for choice combinations and prerequisites
5. **Export Support**: Support for exporting choice configurations to character sheets
