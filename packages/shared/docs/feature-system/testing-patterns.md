# Testing Patterns

*Testing strategies for validating D&D feature implementations using the unified FeatureEntity approach.*

## 📋 **Overview**

This document provides comprehensive testing strategies for validating D&D feature implementations using the feature system's unified entity approach. These testing patterns ensure that features are implemented correctly and behave as intended in all scenarios.

**Related Documentation:**
- **[Examples](examples.md)** - Comprehensive implementation examples
- **[Common Pitfalls](common-pitfalls.md)** - Common mistakes and how to avoid them
- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas

## 🎯 **Core Testing Principles**

### **Test Both Positive and Negative Cases**
Always test that features apply when they should AND don't apply when they shouldn't. This ensures that conditional entities work correctly and don't have unintended side effects.

### **Test Edge Cases**
Validate behavior at boundaries, with missing data, and unusual conditions. This includes testing at level boundaries, with exhausted resources, and with unusual character configurations.

### **Test Integration**
Ensure features work together correctly, especially with stacking rules. This includes testing how multiple features interact and ensuring that D&D stacking rules are properly implemented.

### **Test Cross-System Integration**
Verify that features work correctly with other systems, including the character system, item system, and spell system.

## 🧪 **Feature Validation Tests**

### **Barbarian Rage Testing**

**Test Objective**: Verify that the barbarian rage feature provides correct bonuses when active and no bonuses when inactive.

**Test Cases**:
1. **Active Rage**: Verify that all rage bonuses apply when rage is active
2. **Inactive Rage**: Verify that no rage bonuses apply when rage is inactive
3. **Resource Tracking**: Verify that rage uses are properly tracked and consumed
4. **Level Scaling**: Verify that rage bonuses scale correctly with level

**Key Validations**:
- Strength and Constitution bonuses apply only when rage is active
- Will save bonus applies only when rage is active
- AC penalty applies only when rage is active
- Uses per day are properly tracked and consumed
- Higher-level rage provides enhanced bonuses

**Source File**: See actual test implementation in `apps/backend/src/features/featureSystem/featureSystemService.test.ts`

### **Fighter Bonus Feats Testing**

**Test Objective**: Verify that the fighter bonus feat feature provides correct feat choices at appropriate levels.

**Test Cases**:
1. **Feat Availability**: Verify that feats are available at correct levels
2. **Feat Selection**: Verify that players can select from appropriate feat lists
3. **Feat Application**: Verify that selected feats are properly applied to characters
4. **Level Progression**: Verify that feat choices scale correctly with level

**Key Validations**:
- Feats are available at levels 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, and 20
- Only fighter bonus feats are available for selection
- Selected feats are properly applied to characters
- Formula integration works correctly for level-based availability

**Source File**: See actual test implementation in `apps/backend/src/features/featureSystem/featureSystemService.test.ts`

## 🎯 **Entity Type Testing**

### **Bonus Entity Testing**

**Test Objective**: Verify that bonus entities provide correct numeric bonuses and penalties.

**Test Cases**:
1. **Basic Bonuses**: Verify that simple bonuses apply correctly
2. **Conditional Bonuses**: Verify that conditional bonuses apply only when conditions are met
3. **Bonus Stacking**: Verify that different bonus types stack correctly
4. **Bonus Types**: Verify that same bonus types don't stack (highest applies)

**Key Validations**:
- Bonuses apply to correct targets
- Conditional bonuses apply only when conditions are met
- Different bonus types stack according to D&D rules
- Same bonus types don't stack (highest applies)

### **Quantity Entity Testing**

**Test Objective**: Verify that quantity entities provide correct counts and amounts.

**Test Cases**:
1. **Resource Tracking**: Verify that resources are properly tracked
2. **Resource Consumption**: Verify that resources are properly consumed
3. **Resource Restoration**: Verify that resources are properly restored
4. **Level Scaling**: Verify that quantities scale correctly with level

**Key Validations**:
- Resources are properly tracked and displayed
- Resources are consumed when used
- Resources are restored at appropriate intervals
- Quantities scale correctly with character level

### **Choice Entity Testing**

**Test Objective**: Verify that choice entities provide correct player selection options.

**Test Cases**:
1. **Choice Availability**: Verify that choices are available at correct times
2. **Choice Options**: Verify that appropriate options are available
3. **Choice Selection**: Verify that selections are properly recorded
4. **Choice Dependencies**: Verify that dependent entities work correctly

**Key Validations**:
- Choices are available at appropriate levels
- Appropriate options are available for selection
- Selections are properly recorded and applied
- Dependent entities work correctly with choices

## 🔧 **Condition Testing**

### **Trigger Condition Testing**

**Test Objective**: Verify that trigger conditions work correctly for activatable abilities.

**Test Cases**:
1. **Active Triggers**: Verify that entities apply when triggers are active
2. **Inactive Triggers**: Verify that entities don't apply when triggers are inactive
3. **Multiple Triggers**: Verify that multiple triggers work correctly together
4. **Trigger Dependencies**: Verify that trigger dependencies work correctly

**Key Validations**:
- Entities apply only when triggers are active
- Entities don't apply when triggers are inactive
- Multiple triggers work correctly together
- Trigger dependencies are properly handled

### **Attack Type Condition Testing**

**Test Objective**: Verify that attack type conditions work correctly for combat bonuses.

**Test Cases**:
1. **Specific Attack Types**: Verify that bonuses apply only to specific attack types
2. **Multiple Attack Types**: Verify that bonuses apply to multiple attack types when specified
3. **Attack Type Combinations**: Verify that complex attack type conditions work correctly
4. **Edge Cases**: Verify that edge cases are handled correctly

**Key Validations**:
- Bonuses apply only to specified attack types
- Multiple attack types work correctly
- Complex conditions are properly evaluated
- Edge cases are handled appropriately

## 📊 **Formula Integration Testing**

### **Linear Scaling Testing**

**Test Objective**: Verify that linear scaling formulas work correctly.

**Test Cases**:
1. **Basic Scaling**: Verify that values scale linearly with level
2. **Start Level**: Verify that scaling begins at correct level
3. **Scaling Value**: Verify that scaling value is applied correctly
4. **Boundary Conditions**: Verify that boundary conditions are handled correctly

**Key Validations**:
- Values scale linearly with level
- Scaling begins at correct level
- Scaling value is applied correctly
- Boundary conditions are handled appropriately

### **Conditional Scaling Testing**

**Test Objective**: Verify that conditional scaling formulas work correctly.

**Test Cases**:
1. **Threshold Values**: Verify that values change at correct thresholds
2. **Threshold Transitions**: Verify that transitions between thresholds work correctly
3. **Multiple Thresholds**: Verify that multiple thresholds work correctly
4. **Edge Cases**: Verify that edge cases are handled correctly

**Key Validations**:
- Values change at correct thresholds
- Threshold transitions work correctly
- Multiple thresholds are properly handled
- Edge cases are handled appropriately

## 🔗 **Cross-System Integration Testing**

### **Character System Integration**

**Test Objective**: Verify that features integrate correctly with the character system.

**Test Cases**:
1. **Character Creation**: Verify that features are applied during character creation
2. **Level Advancement**: Verify that features are applied during level advancement
3. **Character Calculation**: Verify that features are included in character calculations
4. **Character Display**: Verify that features are displayed correctly on character sheets

**Key Validations**:
- Features are applied during character creation
- Features are applied during level advancement
- Features are included in character calculations
- Features are displayed correctly

### **Item System Integration**

**Test Objective**: Verify that features integrate correctly with the item system.

**Test Cases**:
1. **Item Bonuses**: Verify that item bonuses work correctly with features
2. **Item Requirements**: Verify that item requirements are properly handled
3. **Item Interactions**: Verify that item interactions work correctly
4. **Item Display**: Verify that item information is displayed correctly

**Key Validations**:
- Item bonuses work correctly with features
- Item requirements are properly handled
- Item interactions work as intended
- Item information is displayed correctly

## 🎯 **Performance Testing**

### **Load Testing**

**Test Objective**: Verify that the feature system performs well under load.

**Test Cases**:
1. **Large Character Sets**: Verify that the system handles large numbers of characters
2. **Complex Features**: Verify that the system handles complex features efficiently
3. **Concurrent Access**: Verify that the system handles concurrent access correctly
4. **Memory Usage**: Verify that memory usage is reasonable

**Key Validations**:
- System handles large numbers of characters efficiently
- Complex features are processed efficiently
- Concurrent access is handled correctly
- Memory usage is within acceptable limits

## 🔗 **Related Documentation**

- **[Examples](examples.md)** - Comprehensive implementation examples
- **[Common Pitfalls](common-pitfalls.md)** - Common mistakes and how to avoid them
- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Formula System](formula-system.md)** - Formula system reference
