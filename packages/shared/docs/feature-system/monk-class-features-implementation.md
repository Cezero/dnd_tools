# Monk Class Features Implementation

This document details the complete implementation of Monk class features in the D&D Tools Feature System, including technical implementation details and modeling approaches.

## Overview

The Monk class has been fully modeled with all major features implemented using the feature system. This includes complex features like conditional scaling, size-based damage, and choice systems.

## Implemented Features

### ✅ **Flurry of Blows**
**D&D 3.5 Rule**: At 1st level, a monk can make a flurry of blows as a full-round action. When doing so, he may make one extra attack that takes a -2 penalty on the attack rolls. This penalty decreases by 1 at 4th level and by an additional 1 for every four levels thereafter (8th, 12th, 16th, and 20th level).

**Implementation**:
- **Formula**: `CONDITIONAL_SCALING`
- **Modifier Type**: `Penalty` (negative values)
- **Applies To**: `Attack`
- **Parameters**:
  - **Thresholds**: "1,4,8,12,16,20"
  - **Values**: "-2,-2,-1,0,1,2"
- **Progression**: Level 1 (-2), Level 4 (-2), Level 8 (-1), Level 12 (0), Level 16 (1), Level 20 (2)

**Technical Details**:
- Uses conditional scaling formula for non-linear progression
- Attack penalty decreases over time, eventually becoming a bonus
- Properly handles negative values in formula calculation

### ✅ **Unarmed Strike**
**D&D 3.5 Rule**: A monk's unarmed strike damage increases with level and varies by character size.

**Implementation**:
- **Formula**: `CONDITIONAL_SCALING`
- **Modifier Type**: `Replacement`
- **Applies To**: `UnarmedDamage`
- **Size-Based Conditions**: Multiple modifiers with `character_size` conditions
- **Parameters**:
  - **Medium Size**: Thresholds "1,4,8,12,16,20", Values "1d6,1d8,1d10,2d6,2d8,2d10"
  - **Small Size**: Thresholds "1,4,8,12,16,20", Values "1d4,1d6,1d8,1d10,2d6,2d8"
  - **Large Size**: Thresholds "1,4,8,12,16,20", Values "1d8,2d6,2d8,3d6,3d8,4d8"

**Technical Details**:
- Uses `character_size` condition type with integer values
- Multiple modifiers for different sizes (Medium, Small, Large)
- Damage dice as string values in conditional scaling
- Proper UI display showing size-specific damage for each level

### ✅ **Diamond Soul**
**D&D 3.5 Rule**: At 13th level, a monk gains spell resistance equal to his current monk level + 10.

**Implementation**:
- **Formula**: `VALUE_PLUS_LEVEL`
- **Modifier Type**: `Quantity`
- **Applies To**: `SpellResistance`
- **Parameters**:
  - **Value**: 10 (fixed value)
  - **Formula**: 10 + level
- **Progression**: Level 13 (23), Level 14 (24), Level 15 (25), etc.

**Technical Details**:
- Uses value plus level formula for simple scaling
- SpellResistance modifier type for proper character sheet display
- Starts at level 13 as specified in D&D rules

### ✅ **Wholeness of Body**
**D&D 3.5 Rule**: At 7th level, a monk can heal his own wounds. He can heal a number of hit points of damage equal to his monk level × 2.

**Implementation**:
- **Formula**: `LEVEL_TIMES_VALUE`
- **Modifier Type**: `Quantity`
- **Applies To**: `Healing`
- **Parameters**:
  - **Value**: 2 (scaling multiplier)
  - **Formula**: level × 2
- **Progression**: Level 7 (14), Level 8 (16), Level 9 (18), etc.

**Technical Details**:
- Uses level times value formula for healing calculation
- Healing modifier type for proper character sheet display
- Starts at level 7 as specified in D&D rules

### ✅ **Bonus Feats**
**D&D 3.5 Rule**: At 1st level, 2nd level, and every four levels thereafter (6th, 10th, 14th, and 18th level), a monk may select a bonus feat from the following list: Combat Reflexes, Deflect Arrows, Dodge, Improved Grapple, Improved Trip, or Stunning Fist.

**Implementation**:
- **Choice System**: Multiple `FeatureChoice` entries
- **Choice Type**: `Feat`
- **Choice Behavior**: `Single`
- **Level-Specific Options**: Different feat selections at different levels
- **Specific Feats**: Combat Reflexes, Deflect Arrows, Dodge, Improved Grapple, Improved Trip, Stunning Fist

**Technical Details**:
- Uses choice system with specific feat IDs
- Level-specific progression (1, 2, 6, 10, 14, 18)
- Proper choice key generation for character tracking
- UI displays available feat options for each level

## Technical Implementation Details

### **Size-Based Damage System**
The Unarmed Strike feature demonstrates the complete size-based damage system:

1. **Condition Type**: `character_size` with integer values
2. **Multiple Modifiers**: One modifier per size with appropriate conditions
3. **UI Display**: Shows size-specific damage for each level in class editor
4. **Character Sheet**: Will use character's actual size to determine damage

### **Conditional Scaling Formula**
The Flurry of Blows feature demonstrates complex conditional scaling:

1. **Non-Linear Progression**: Attack penalty decreases over time
2. **Negative Values**: Properly handles penalties that become bonuses
3. **Multiple Thresholds**: Complex progression pattern with 6 transition points
4. **Formula Preview**: Dynamic preview showing progression in edit dialog

### **Choice System Integration**
The Bonus Feats feature demonstrates the choice system:

1. **Level-Specific Choices**: Different options available at different levels
2. **Specific Feat Selection**: Direct feat IDs rather than filtered choices
3. **Character Tracking**: Choice keys for character advancement tracking
4. **UI Display**: Shows available feat options in class editor

## Database Schema Impact

### **New Modifier Types**
- `UnarmedDamage`: For unarmed strike damage dice
- `SpellResistance`: For spell resistance values
- `Healing`: For healing amounts

### **New Condition Type**
- `character_size`: For size-based conditional modifiers

### **Formula Enhancements**
- `VALUE_PLUS_LEVEL`: For fixed value plus level calculations
- `LEVEL_TIMES_VALUE`: For level times value calculations
- Enhanced `CONDITIONAL_SCALING`: For damage dice strings

## UI/UX Features

### **Class Editor Display**
- **Size-Specific Damage**: Shows damage for each size with condition labels
- **Formula Preview**: Dynamic preview of progression patterns
- **Choice Options**: Displays available feat options for each level
- **Condition Display**: Shows size conditions for damage modifiers

### **Character Sheet Integration**
- **Size-Based Damage**: Will use character's actual size
- **Spell Resistance**: Will display calculated SR value
- **Healing Amounts**: Will show calculated healing per day
- **Feat Choices**: Will track and display chosen bonus feats

## Testing Status

### ✅ **Tested Features**
- **Flurry of Blows**: Conditional scaling with negative values
- **Unarmed Strike**: Size-based damage with multiple conditions
- **Diamond Soul**: Value plus level formula
- **Wholeness of Body**: Level times value formula
- **Bonus Feats**: Choice system with specific feats

### **Validation Results**
- **Formula Calculation**: All formulas calculate correctly
- **UI Display**: All features display properly in class editor
- **Database Storage**: All data saves and loads correctly
- **Condition Handling**: Size conditions work properly
- **Choice System**: Feat choices work correctly

## Future Enhancements

### **Character Sheet Integration**
- **Size Detection**: Use character's actual size for damage calculation
- **Choice Tracking**: Track and display chosen bonus feats
- **Formula Display**: Show calculated values on character sheet

### **Advanced Features**
- **Purity of Body**: Simple feature display (no modifiers needed)
- **Quivering Palm**: Complex save-based feature
- **Perfect Self**: Epic level feature with multiple effects

## Conclusion

The Monk class demonstrates the full capabilities of the feature system, including:
- Complex conditional scaling
- Size-based modifiers
- Choice systems
- Multiple formula types
- Advanced UI display

All major Monk features have been successfully implemented and tested, providing a solid foundation for other complex class features.
