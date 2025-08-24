# Pain Points and Issues Analysis

## Overview

This document identifies and analyzes the specific pain points and issues in the current formatter system based on recent development experience and code analysis.

## Recent Issues from Development Experience

### 1. Unarmed Strike Display Issues

**Problem Description**:
- Unarmed damage showing "0" instead of "1d6" at level 1 in `ClassDetail.tsx`
- Full progression showing at every transition level for all three sizes (small, medium, large)
- Different behavior between `ClassDetail.tsx`, `ClassEdit.tsx`, and `FeatureProgressionDetailEdit.tsx`

**Root Cause Analysis**:
- Multiple conditional modifiers for different creature sizes
- Context-dependent behavior not handled consistently
- Special case handling for damage dice formatters
- Formula calculation mixed with display logic

**Impact**:
- Inconsistent user experience across different pages
- Debugging complexity due to multiple code paths
- Hard to maintain and extend

### 2. Healing Modifier Issues

**Problem Description**:
- Wholeness of Body showing entire progression at Level 7 in `ClassDetail.tsx`
- Different behavior between contexts (with/without character)
- Formula calculation mixed with display logic

**Root Cause Analysis**:
- Formula-based healing modifiers handled differently than other modifiers
- Context handling scattered across multiple layers
- Special case logic for healing formatters

**Impact**:
- Inconsistent display behavior
- Hard to predict how new healing features will display
- Maintenance complexity

### 3. Choice System Issues

**Problem Description**:
- Monk bonus feats displaying "label" instead of feat name
- Multiple choices showing as full progression
- Context-dependent choice display
- Mixed logic for different choice types

**Root Cause Analysis**:
- Choice formatters handle context differently than modifier formatters
- Special case logic for different choice types
- Context handling mixed with choice processing

**Impact**:
- Poor user experience with unclear choice descriptions
- Inconsistent behavior across different choice types
- Hard to add new choice types

### 4. Damage Dice Issues

**Problem Description**:
- Level 1 showing "0" instead of "1d6"
- Full progression patterns showing inappropriately
- Special case handling for damage dice formatters

**Root Cause Analysis**:
- Damage dice formatters have special logic for formula handling
- Context-dependent behavior not handled consistently
- Mixed calculation and display logic

**Impact**:
- Incorrect display of damage values
- User confusion about actual damage values
- Hard to debug and fix

## Architectural Issues

### 1. Mixed Responsibilities

**Problem**: Each layer is doing multiple jobs
- Formatters handle both formatting AND calculation
- Context handling mixed with display logic
- Transition detection mixed with formatting

**Examples**:
```typescript
// In createDamageFormatter - mixed formatting and calculation
export function createDamageFormatter(label: string) {
    return fmt((valueInt, appliesToId, bonusType, character, modifier, progression) => {
        // Check if this is a replacement modifier with formula (damage dice)
        if (modifier?.type === ModifierType.Replacement && modifier?.formulaParams?.formulaId) {
            return formatDamageDice(modifier, character, undefined, progression?.level);
        }
        // ... rest of formatting logic
    });
}
```

**Impact**:
- Hard to test individual responsibilities
- Changes to one responsibility affect others
- Difficult to understand and maintain

### 2. Scattered Context Handling

**Problem**: Context handling is spread across multiple layers
- Different formatters handle context differently
- Context logic mixed with formatting logic
- Inconsistent behavior across different modifier types

**Examples**:
```typescript
// Context handling in multiple places
// In processFormulaModifiers
if (!character) {
    // Skip conditional modifiers when there's no character context
    if (modifier.appliesIfChoiceKey || modifier.appliesIfChoiceValue) {
        continue;
    }
}

// In formatDamageDice
if (character) {
    calculationLevel = Object.values(character.classLevels).reduce((sum, level) => sum + level, 0);
} else if (previewLevel !== undefined) {
    calculationLevel = previewLevel;
} else if (currentLevel !== undefined) {
    calculationLevel = currentLevel;
}
```

**Impact**:
- Hard to add new contexts
- Inconsistent behavior across different contexts
- Debugging complexity

### 3. Duplicated Logic

**Problem**: Similar patterns repeated for different modifier types
- Context handling logic duplicated across layers
- Formula calculation logic mixed with display logic
- Special case handling for different types

**Examples**:
```typescript
// Similar logic repeated for different modifier types
// In processFormulaModifiers
if (modifier.appliesTo === ModifierAppliesToType.Damage && modifier.type === ModifierType.Replacement) {
    // Special handling for damage
}

// In processModifier
if (isDamageDiceReplacementModifier(modifier)) {
    // Similar special handling for damage
}
```

**Impact**:
- Code duplication
- Inconsistent behavior
- Hard to maintain

### 4. Inconsistent Interfaces

**Problem**: Different formatters expect different parameters
- Some formatters get character context, others don't
- Some formatters handle formulas, others don't
- Inconsistent parameter passing

**Examples**:
```typescript
// Different parameter patterns
createDamageFormatter(label: string) // Takes label
createHealingFormatter() // Takes no parameters
createAttributeFormatter(label: string) // Takes label
createUsesFormatter() // Takes no parameters
```

**Impact**:
- Hard to create new formatters
- Inconsistent behavior
- Difficult to understand and use

### 5. Tight Coupling

**Problem**: Changes to one layer affect others
- Adding new modifier types requires changes in multiple places
- Context changes require updates across multiple files
- Formula changes affect display logic

**Examples**:
```typescript
// Changes in one place affect others
// Adding a new modifier type requires:
// 1. Adding to PROGRESSION_FORMATTERS
// 2. Adding special case handling in processModifier
// 3. Adding special case handling in processFormulaModifiers
// 4. Adding special case handling in formatProgression
```

**Impact**:
- High maintenance cost
- Risk of breaking changes
- Hard to extend the system

## Performance Issues

### 1. Repeated Calculations

**Problem**: Formula calculations are repeated unnecessarily
- Same formulas calculated multiple times
- No caching of calculated values
- Inefficient for complex formulas

**Impact**:
- Performance degradation with complex features
- Unnecessary CPU usage
- Poor user experience

### 2. Complex Data Flow

**Problem**: Data flows through multiple layers with transformations
- Each layer adds complexity
- Hard to trace data transformations
- Difficult to optimize

**Impact**:
- Hard to debug performance issues
- Difficult to optimize specific paths
- Poor maintainability

## Debugging Issues

### 1. Complex Error Tracing

**Problem**: Errors are hard to trace through the system
- Multiple layers of processing
- Mixed responsibilities make it unclear where issues originate
- Context-dependent behavior makes testing difficult

**Examples**:
```typescript
// Error could originate from multiple places
formatProgression() // Entry point
    ↓
processFormulaModifiers() // Could be here
    ↓
getFormulaProgressionPattern() // Or here
    ↓
FormulaCalculator.calculateModifierValue() // Or here
    ↓
calculateFormula() // Or here
```

**Impact**:
- Long debugging sessions
- Hard to identify root causes
- Poor developer experience

### 2. Context-Dependent Testing

**Problem**: Testing is difficult due to context dependencies
- Different behavior with/without character context
- Hard to test all scenarios
- Complex test setup required

**Impact**:
- Incomplete test coverage
- Bugs in edge cases
- Poor code quality

## Maintenance Issues

### 1. Hard to Extend

**Problem**: Adding new features requires changes in multiple places
- New modifier types need changes across layers
- New contexts require updates throughout the system
- New formula types need special handling

**Examples**:
```typescript
// Adding a new modifier type requires:
// 1. Add to ModifierAppliesToType enum
// 2. Add formatter to formatterFactories.ts
// 3. Add to PROGRESSION_FORMATTERS
// 4. Add special case handling in processModifier
// 5. Add special case handling in processFormulaModifiers
// 6. Add special case handling in formatProgression
// 7. Update documentation
```

**Impact**:
- High development cost for new features
- Risk of introducing bugs
- Poor developer experience

### 2. Documentation Gaps

**Problem**: Current system is hard to document
- Mixed responsibilities make documentation complex
- Context-dependent behavior hard to explain
- Special cases scattered throughout

**Impact**:
- Hard for new developers to understand
- Poor maintainability
- Knowledge silos

## User Experience Issues

### 1. Inconsistent Display

**Problem**: Same data displays differently in different contexts
- Different behavior between pages
- Context-dependent formatting
- Special case handling

**Impact**:
- User confusion
- Poor user experience
- Reduced trust in the system

### 2. Unclear Error Messages

**Problem**: When things go wrong, users get unclear feedback
- Raw values shown instead of formatted values
- No indication of what went wrong
- Poor error handling

**Impact**:
- User frustration
- Support burden
- Poor user experience

## Business Impact

### 1. Development Velocity

**Problem**: Complex system slows down development
- Long debugging sessions
- High maintenance cost
- Hard to add new features

**Impact**:
- Slower feature delivery
- Higher development costs
- Reduced team productivity

### 2. Code Quality

**Problem**: Complex system leads to poor code quality
- Hard to test thoroughly
- High risk of regressions
- Poor maintainability

**Impact**:
- More bugs in production
- Higher support costs
- Reduced system reliability

### 3. Technical Debt

**Problem**: System has accumulated significant technical debt
- Mixed responsibilities
- Duplicated logic
- Tight coupling

**Impact**:
- Increasing maintenance costs
- Reduced system flexibility
- Higher risk of system failure

## Conclusion

The current formatter system has significant issues that impact:

1. **Developer Experience**: Complex debugging, hard to extend, poor maintainability
2. **User Experience**: Inconsistent display, unclear error messages
3. **Business Impact**: Slower development, higher costs, reduced reliability

The refactoring needs to address these issues by:

1. **Clean Layer Separation**: Each layer should have a single, clear responsibility
2. **Centralized Context Handling**: Context should be handled at the highest layer
3. **Consistent Interfaces**: All modifier types should use the same higher-level logic
4. **Pure Functions**: Lower layers should be pure and testable
5. **Extensible Architecture**: Adding new types should only require changes to the lowest layer
6. **Robust Error Handling**: Graceful fallbacks with clear error logging
7. **Performance Optimization**: Caching and efficient calculations
