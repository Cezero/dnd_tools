# Feature Formatting System Call Tree Analysis

## Overview
This document traces the complete call tree for each DisplayType to identify dead code and understand why `CONDITIONAL_SCALING` with `valuesRepresent.AppliesToId` is not working.

## Key Finding: Dead Code Identified
The analysis reveals that several critical components are **never called**:
- `ProgressionGeneratorImpl.generateValues()`
- `ProgressionGeneratorImpl.createModifiedEntity()`
- `calculatorRegistry` (retrieved but never used)
- Cumulative logic in `ProgressionGeneratorImpl`

## Call Tree for Each DisplayType

### DisplayType.Edit

```
1. displayStrategyFactory.createStrategy(DisplayType.Edit)
   └── Returns: editPageStrategy (EditPageDisplayStrategy instance)

2. strategy.format(progression, context, showLabels)
   └── DisplayStrategyBase.format()
       └── this.formatProgressions([progression], context, showLabels)
           └── EditPageDisplayStrategy.formatProgressions()
               └── this.orchestrateFormatting(progressions[0], context, showLabels)
                   └── DisplayStrategyBase.orchestrateFormatting()
                       ├── Phase 1: this.generateValues(progression, context)
                       │   └── ValueGenerationPhase.generateValues()
                       │       ├── this.shouldGenerateProgression() → true (has formula entities)
                       │       ├── For each formulaEntity:
                       │       │   └── this.generateProgressionValuesForSingleEntity()
                       │       │       ├── calculatorRegistry.getDefaultProgressionGenerator() → **NEVER USED**
                       │       │       └── this.generateFormulaIntervalValues() ← **ACTUAL PATH**
                       │       │           ├── this.getFormulaIntervalLevels()
                       │       │           │   └── formulaDef.calculate() for each level
                       │       │           ├── For each [level, calculatedValue]:
                       │       │           │   ├── if (formulaDef.isCharacterDependent):
                       │       │           │   │   └── formulaDef.getDisplayString()
                       │       │           │   └── else:
                       │       │           │       └── singleValue = calculatedValue
                       │       │           │   └── Create CalculatedEntity: { ...formulaEntity, value: singleValue }
                       │       │           └── Return ProgressionValue[]
                       │       └── this.processStaticEntitiesAtLevel()
                       ├── Phase 2: this.formattingPhase.formatItems()
                       │   └── FormattingPhase.formatItems()
                       │       └── For each CalculatedValueWithLevel:
                       │           └── formatterRegistry.getFormatter() → formatter.format()
                       ├── Phase 3: this.groupingPhase.groupWithinLevel()
                       │   └── GroupingPhase.groupWithinLevel()
                       ├── Phase 4: this.progressionGroupingPhase.groupWithinProgression()
                       │   └── ProgressionGroupingPhase.groupWithinProgression()
                       └── Phase 5: this.createDisplayResult()
                           └── EditPageDisplayStrategy.createDisplayResult()
                               └── Return DisplayResult
```

### DisplayType.Detail

```
1. displayStrategyFactory.createStrategy(DisplayType.Detail)
   └── Returns: detailPageStrategy (DetailPageDisplayStrategy instance)

2. strategy.format(progression, context, showLabels)
   └── DisplayStrategyBase.format()
       └── this.formatProgressions([progression], context, showLabels)
           └── DetailPageDisplayStrategy.formatProgressions()
               └── this.orchestrateFormatting(progressions[0], context, showLabels)
                   └── DisplayStrategyBase.orchestrateFormatting()
                       ├── Phase 1: this.generateValues(progression, context)
                       │   └── **IDENTICAL TO DisplayType.Edit** ← Same ValueGenerationPhase path
                       ├── Phase 2: this.formattingPhase.formatItems()
                       ├── Phase 3: this.groupingPhase.groupWithinLevel()
                       ├── Phase 4: this.progressionGroupingPhase.groupWithinProgression()
                       └── Phase 5: this.createDisplayResult()
                           └── DetailPageDisplayStrategy.createDisplayResult()
                               └── Return DisplayResult
```

### DisplayType.CharacterSheet

```
1. displayStrategyFactory.createStrategy(DisplayType.CharacterSheet)
   └── Returns: characterSheetStrategy (CharacterSheetDisplayStrategy instance)

2. strategy.format(progression, context, showLabels)
   └── DisplayStrategyBase.format()
       └── this.formatProgressions([progression], context, showLabels)
           └── CharacterSheetDisplayStrategy.formatProgressions()
               └── this.orchestrateFormatting(progressions[0], context, showLabels)
                   └── DisplayStrategyBase.orchestrateFormatting()
                       ├── Phase 1: this.generateValues(progression, context)
                       │   └── **IDENTICAL TO DisplayType.Edit** ← Same ValueGenerationPhase path
                       ├── Phase 2: this.formattingPhase.formatItems()
                       ├── Phase 3: this.groupingPhase.groupWithinLevel()
                       ├── Phase 4: this.progressionGroupingPhase.groupWithinProgression()
                       └── Phase 5: this.createDisplayResult()
                           └── CharacterSheetDisplayStrategy.createDisplayResult()
                               └── Return CharacterSheetDisplayResult
```

## Dead Code Analysis

### 1. ProgressionGeneratorImpl (COMPLETELY UNUSED)
**Location**: `progression-generators.ts`
**Methods Never Called**:
- `ProgressionGeneratorImpl.generateValues()`
- `ProgressionGeneratorImpl.createModifiedEntity()` ← **CRITICAL FOR valuesRepresent.AppliesToId**
- `ProgressionGeneratorImpl.getApplicableValues()`
- `ProgressionGeneratorImpl.calculateSingleValue()`

**Evidence**: 
- Line 98 in `ValueGenerationPhase.ts`: `calculatorRegistry.getDefaultProgressionGenerator()` is called but result is never used
- Line 104: Immediately calls `this.generateFormulaIntervalValues()` instead
- TODO comment on line 97-98: "this code makes no sense, what is it doing?"

### 2. CalculatorRegistry (PARTIALLY UNUSED)
**Location**: `calculator-registry.ts`
**Status**: Registry is populated but never used for progression generation
**Evidence**: Retrieved in `generateProgressionValuesForSingleEntity()` but never called

### 3. Cumulative Logic (UNUSED)
**Location**: `ProgressionGeneratorImpl.getApplicableValues()`
**Impact**: Cumulative formulas don't work because this method is never called

## Root Cause of CONDITIONAL_SCALING Issue

### The Problem
`CONDITIONAL_SCALING` formulas with `valuesRepresent.AppliesToId` are not working because:

1. **Missing createModifiedEntity()**: The `createModifiedEntity()` method in `ProgressionGeneratorImpl` contains the logic to handle `valuesRepresent.AppliesToId`:
   ```typescript
   ...(valuesRepresent === CumulativeValueType.AppliesToId
       ? { appliesToId: value as number }
       : { value: value as number })
   ```

2. **Wrong Entity Creation**: Instead, `ValueGenerationPhase.generateFormulaIntervalValues()` creates `CalculatedEntity` by spreading the original `formulaEntity`:
   ```typescript
   const calculatedEntity: CalculatedEntity = {
       ...formulaEntity,  // ← Original appliesToId preserved, not overridden
       value: singleValue,
       calculatedValue: singleValue
   };
   ```

3. **No valuesRepresent Logic**: The `valuesRepresent` parameter is completely ignored in the current code path.

### The Fix Needed
The `ValueGenerationPhase.generateFormulaIntervalValues()` method needs to:
1. Check `formula.valuesRepresent`
2. If `valuesRepresent === CumulativeValueType.AppliesToId`, set `appliesToId: singleValue` instead of `value: singleValue`
3. If `valuesRepresent === CumulativeValueType.Value`, set `value: singleValue` (current behavior)

## Summary

**All DisplayTypes use the same code path** through `ValueGenerationPhase.generateFormulaIntervalValues()`, which:
- ✅ Correctly calculates formula values
- ✅ Handles character-dependent vs non-character-dependent formulas
- ❌ **Completely ignores `valuesRepresent` parameter**
- ❌ **Never calls `ProgressionGeneratorImpl.createModifiedEntity()`**

**Dead Code to Remove**:
- `ProgressionGeneratorImpl` class (entire file)
- `calculatorRegistry` usage in `ValueGenerationPhase`
- Cumulative logic (unless we want to implement it in `ValueGenerationPhase`)

**Required Fix**:
Add `valuesRepresent` handling logic to `ValueGenerationPhase.generateFormulaIntervalValues()` where `CalculatedEntity` is created.
