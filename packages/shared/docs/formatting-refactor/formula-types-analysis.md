# Formula Types and Display Requirements Analysis

## Overview

This document analyzes all formula types in the system and their specific display requirements. Understanding these requirements is crucial for designing the refactored formatter architecture.

## Formula Types Analysis

### 1. LINEAR_SCALING (ID: 1)

**Formula**: `(level - startLevel + 1) × scalingValue`

**Usage Examples**:
- Features that scale based on how long they've been active
- Continuous progression since feature started

**Current Display Behavior**:
- **With Character Context**: Shows calculated value for current level
- **Without Character Context**: Shows calculated value for current level

**Display Requirements**:
- **Single Value Display**: Show calculated value for current level
- **No Progression Pattern**: This formula doesn't need to show all levels

**Example Output**:
- Level 5: "+15" (if scalingValue = 3, startLevel = 1)

### 2. EVERY_N_LEVELS (ID: 2)

**Formula**: Increases every N levels starting from formulaStartLevel

**Usage Examples**:
- Fighter bonus feats (every 2 levels starting at level 2)
- Monk bonus feats (every 4 levels starting at level 2)
- Wizard bonus feats (every 5 levels starting at level 5)

**Current Display Behavior**:
- **With Character Context**: Shows full progression pattern
- **Without Character Context**: Should show single value for current level

**Display Requirements**:
- **Progression Pattern Display**: Show all levels where the feature increases
- **Single Value Display**: Show calculated value for current level when no character context

**Example Output**:
- **Progression Pattern**: "Level 2 (Fighter Bonus), Level 4 (Fighter Bonus), Level 6 (Fighter Bonus)..."
- **Single Value**: "Fighter Bonus" (for current level)

### 3. CONDITIONAL_SCALING (ID: 3)

**Formula**: Different values based on level thresholds

**Usage Examples**:
- Unarmed strike damage dice (1d6 at level 1, 1d8 at level 4, 1d10 at level 8, etc.)
- Size-based scaling for different creature sizes

**Current Display Behavior**:
- **With Character Context**: Shows calculated value for current level
- **Without Character Context**: Shows full progression pattern

**Display Requirements**:
- **Progression Pattern Display**: Show all transition points
- **Single Value Display**: Show calculated value for current level when no character context
- **Conditional Handling**: Handle multiple conditional modifiers (small, medium, large creatures)

**Example Output**:
- **Progression Pattern**: "Level 1: 1d6, Level 4: 1d8, Level 8: 1d10, Level 12: 2d6..."
- **Single Value**: "1d8" (for level 4)

### 4. DICE_SCALING (ID: 5)

**Formula**: Dice scaling (e.g., +1d6 every N levels)

**Usage Examples**:
- Sneak attack damage (1d6 at level 1, 2d6 at level 3, 3d6 at level 5, etc.)
- Spell damage scaling

**Current Display Behavior**:
- **With Character Context**: Shows full progression pattern
- **Without Character Context**: Should show single value for current level

**Display Requirements**:
- **Progression Pattern Display**: Show all levels where dice increase
- **Single Value Display**: Show calculated dice for current level when no character context

**Example Output**:
- **Progression Pattern**: "Level 1: 1d6, Level 3: 2d6, Level 5: 3d6, Level 7: 4d6..."
- **Single Value**: "3d6" (for level 5)

### 5. ATTRIBUTE_BASED (ID: 6)

**Formula**: `baseValue + attributeModifier`

**Usage Examples**:
- Skill bonuses
- Saving throw bonuses
- Attribute-dependent bonuses

**Current Display Behavior**:
- **With Character Context**: Shows calculated value
- **Without Character Context**: Shows formula structure

**Display Requirements**:
- **Calculated Value Display**: Show actual calculated value when character context available
- **Formula Structure Display**: Show formula structure when no character context

**Example Output**:
- **With Character**: "+5" (if baseValue = 2, attributeModifier = 3)
- **Without Character**: "2 + STR"

### 6. ATTRIBUTE_MODIFIER (ID: 7)

**Formula**: Just attribute modifier

**Usage Examples**:
- Pure attribute-based bonuses
- Attribute-dependent features

**Current Display Behavior**:
- **With Character Context**: Shows calculated value
- **Without Character Context**: Shows formula structure

**Display Requirements**:
- **Calculated Value Display**: Show actual calculated value when character context available
- **Formula Structure Display**: Show formula structure when no character context

**Example Output**:
- **With Character**: "+3" (if attributeModifier = 3)
- **Without Character**: "+STR"

### 7. LEVEL_TIMES_ATTRIBUTE (ID: 8)

**Formula**: `level × attributeModifier`

**Usage Examples**:
- Scaling attribute-based features
- Level-dependent attribute bonuses

**Current Display Behavior**:
- **With Character Context**: Shows calculated value
- **Without Character Context**: Shows formula structure

**Display Requirements**:
- **Calculated Value Display**: Show actual calculated value when character context available
- **Formula Structure Display**: Show formula structure when no character context

**Example Output**:
- **With Character**: "+15" (if level = 5, attributeModifier = 3)
- **Without Character**: "level × STR"

### 8. LEVEL_TIMES_VALUE (ID: 9)

**Formula**: `level × baseValue`

**Usage Examples**:
- Monk Wholeness of Body healing (2 × level hit points per day)
- Level-based healing features

**Current Display Behavior**:
- **With Character Context**: Shows calculated value
- **Without Character Context**: Shows calculated value for current level

**Display Requirements**:
- **Single Value Display**: Show calculated value for current level
- **No Progression Pattern**: This formula doesn't need to show all levels

**Example Output**:
- Level 7: "14 hit points per day" (if baseValue = 2)

### 9. VALUE_PLUS_LEVEL (ID: 10)

**Formula**: `baseValue + level`

**Usage Examples**:
- Spell Resistance (10 + level)
- Level-based features with fixed base

**Current Display Behavior**:
- **With Character Context**: Shows calculated value
- **Without Character Context**: Shows calculated value for current level

**Display Requirements**:
- **Single Value Display**: Show calculated value for current level
- **No Progression Pattern**: This formula doesn't need to show all levels

**Example Output**:
- Level 5: "15" (if baseValue = 10)

### 10. LEVEL_PLUS_ATTRIBUTE (ID: 11)

**Formula**: `level + attributeModifier`

**Usage Examples**:
- Wild Empathy (level + CHA modifier)
- Skill analogs (level + attribute modifier)

**Current Display Behavior**:
- **With Character Context**: Shows calculated value
- **Without Character Context**: Shows formula structure

**Display Requirements**:
- **Calculated Value Display**: Show actual calculated value when character context available
- **Formula Structure Display**: Show formula structure when no character context

**Example Output**:
- **With Character**: "8" (if level = 5, attributeModifier = 3)
- **Without Character**: "level + CHA"

## Display Pattern Analysis

### Pattern 1: Single Value Display
**Formula Types**: LINEAR_SCALING, LEVEL_TIMES_VALUE, VALUE_PLUS_LEVEL
**Behavior**: Always show calculated value for current level
**Context Handling**: Same behavior with or without character context

### Pattern 2: Progression Pattern Display
**Formula Types**: EVERY_N_LEVELS, CONDITIONAL_SCALING, DICE_SCALING
**Behavior**: Show all levels where values change
**Context Handling**: 
- With character context: Show full progression pattern
- Without character context: Show single value for current level

### Pattern 3: Attribute-Dependent Display
**Formula Types**: ATTRIBUTE_BASED, ATTRIBUTE_MODIFIER, LEVEL_TIMES_ATTRIBUTE, LEVEL_PLUS_ATTRIBUTE
**Behavior**: Show calculated value or formula structure
**Context Handling**:
- With character context: Show calculated value
- Without character context: Show formula structure

## Special Cases

### 1. Conditional Modifiers
**Example**: Unarmed strike with different damage dice for different creature sizes
**Issue**: Multiple conditional modifiers create complex display requirements
**Solution**: Only process base modifier when no character context

### 2. Choice Modifiers
**Example**: Fighter bonus feats, Monk bonus feats
**Issue**: Choices need different display logic than regular modifiers
**Solution**: Special handling for choice modifiers in progression pattern generation

### 3. Damage Dice Replacement
**Example**: Unarmed strike damage dice replacement
**Issue**: Special formatting requirements for dice notation
**Solution**: Special formatter for damage dice with level context

## Context Handling Requirements

### With Character Context (Character Sheets)
1. **Show calculated values** using actual character data
2. **Display full progression patterns** for progression-based formulas
3. **Handle conditional modifiers** based on character choices
4. **Show actual attribute values** for attribute-dependent formulas

### Without Character Context (ClassDetail.tsx, ClassEdit.tsx)
1. **Show calculated values** for current level only
2. **Display formula structures** for attribute-dependent formulas
3. **Skip conditional modifiers** (can't determine which applies)
4. **Show single values** instead of progression patterns

## Implications for Refactoring

### 1. Formula Classification
Formulas can be classified into three categories:
- **Single Value**: Always show calculated value for current level
- **Progression Pattern**: Show all transition points or single value based on context
- **Attribute-Dependent**: Show calculated value or formula structure based on context

### 2. Context Handling Strategy
- **Highest Layer**: Determine display strategy based on context
- **Middle Layers**: Pass context down to calculation layers
- **Lowest Layers**: Accept optional context and handle gracefully

### 3. Formatter Requirements
- **Pure Formatters**: Convert calculated values to display strings
- **Context-Aware Calculators**: Handle context-dependent calculations
- **Progression Generators**: Generate progression patterns when needed

### 4. Error Handling
- **Fallback to Raw Values**: When calculations fail, show raw values
- **Console Logging**: Log errors for debugging
- **Graceful Degradation**: Continue processing other modifiers when one fails

## Conclusion

The analysis reveals that formula types have distinct display requirements that can be categorized into three main patterns. The refactoring should:

1. **Classify formulas** by their display pattern requirements
2. **Centralize context handling** at the highest layer
3. **Create pure formatters** for the lowest layer
4. **Implement context-aware calculators** for the middle layers
5. **Design consistent interfaces** across all formula types
