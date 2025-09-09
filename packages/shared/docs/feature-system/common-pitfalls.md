# Common Pitfalls and Solutions

*Common mistakes when implementing D&D features using the unified FeatureEntity approach and how to avoid them.*

## 📋 **Overview**

This document identifies common mistakes when implementing D&D features using the feature system's unified entity approach and provides solutions to avoid these issues. Understanding these pitfalls helps ensure that features are implemented correctly and behave as intended.

**Related Documentation:**
- **[Examples](examples.md)** - Comprehensive implementation examples
- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Static Data](static-data.md)** - Feature system enums and types

## 🚨 **Common Pitfalls**

### **1. Bonus Type Conflicts**

#### **❌ Problem: Multiple Enhancement Bonuses**
When creating multiple bonus entities that apply to the same attribute, using the same bonus type will prevent them from stacking properly.

**Issue**: Two enhancement bonus entities both applying to Strength will not stack - only the highest value will apply, even if both should be active.

**Solution**: Use different bonus types that stack according to D&D stacking rules.

**Example**: An enhancement bonus (from a magic item) and a morale bonus (from rage) will stack because they are different bonus types.

#### **D&D Stacking Rules**
- **Same type bonuses don't stack** (highest applies)
- **Different type bonuses stack** (add together)
- **Circumstance bonuses stack** with everything
- **Dodge bonuses stack** with other dodge bonuses

### **2. Condition Specificity Issues**

#### **❌ Problem: Overly Broad Conditions**
When creating `FeatureEntityCondition` objects, overly broad conditions can cause entities to apply in unintended situations.

**Issue**: A condition that applies to all melee attacks might trigger when the feature should only apply to specific types of melee attacks.

**Solution**: Use specific, well-defined conditions that clearly indicate when the entity should apply.

**Example**: Instead of a broad "melee attack" condition, use specific conditions like "sneak attack" combined with "target denied Dexterity bonus" to ensure the entity only applies to sneak attacks against flat-footed opponents.

### **3. Choice Dependencies**

#### **❌ Problem: Missing Choice Validation**
When creating choice entities, failing to properly link dependent entities can cause issues when players make different choices.

**Issue**: Entities that depend on player choices might not be properly connected to the choice system, leading to incorrect application of effects.

**Solution**: Ensure that choice entities and their dependent entities are properly linked through the unified entity system.

**Example**: For a favored enemy feature, create a choice entity that allows players to select creature types, and ensure that the bonus entities are properly linked to apply only to the chosen creature types.

### **4. Progression Override Issues**

#### **❌ Problem: Multiple Progressions for Same Feature**
Creating multiple feature progressions for the same feature instead of using formula-based scaling can lead to maintenance issues and incorrect behavior.

**Issue**: Creating separate progressions for each level of a scaling feature (like sneak attack damage) creates multiple separate features instead of one that scales properly.

**Solution**: Use a single feature progression with formula-based scaling to handle level-dependent progression.

**Example**: Instead of creating separate progressions for each level of sneak attack damage, use a single progression with `FeatureFormulaParams` that scales the damage based on character level.

### **5. Resource Tracking Mistakes**

#### **❌ Problem: Using Wrong Entity Type for Resources**
Using bonus entities for resource tracking instead of quantity entities can lead to confusion and incorrect behavior.

**Issue**: A bonus entity with a value of 3 might be interpreted as a +3 bonus rather than 3 uses per day.

**Solution**: Use quantity entities for resource tracking to clearly indicate that the value represents a count or amount.

**Example**: For a feature that grants 3 uses per day, use a quantity entity with `EntityType.Quantity` and `EntityAppliesToType.Uses` to clearly indicate this is a resource count.

### **6. Formula Integration Errors**

#### **❌ Problem: Incorrect Formula Parameters**
Using incorrect formula parameters can cause features to scale incorrectly or not at all.

**Issue**: Setting up formula parameters with wrong thresholds or values can result in features that don't progress as intended.

**Solution**: Carefully configure formula parameters to match the intended progression pattern.

**Example**: For a feature that improves every 4 levels, ensure the formula parameters are set to trigger at levels 4, 8, 12, 16, and 20 with the correct values for each threshold.

### **7. Cross-System Integration Issues**

#### **❌ Problem: Incorrect Applies-To Types**
Using incorrect `EntityAppliesToType` values can cause entities to apply to the wrong targets or not apply at all.

**Issue**: An entity intended to grant a feat might use the wrong applies-to type, causing it to not function properly.

**Solution**: Ensure that the applies-to type correctly identifies the target of the entity's effect.

**Example**: For direct feat grants, use `EntityAppliesToType.Feat` to ensure the entity correctly grants the specified feat.

### **8. Conditional Logic Errors**

#### **❌ Problem: Missing or Incorrect Conditions**
Failing to include necessary conditions or using incorrect condition types can cause entities to apply when they shouldn't or not apply when they should.

**Issue**: A rage bonus that should only apply when raging might apply all the time if the condition is missing or incorrect.

**Solution**: Carefully review and test all conditions to ensure they work as intended.

**Example**: For a rage bonus, ensure the condition uses `FeatureEntityConditionType.trigger` with the correct trigger value to indicate when rage is active.

## 🎯 **Best Practices to Avoid Pitfalls**

### **Entity Type Selection**
- **Use Bonus Entities** for numeric bonuses and penalties
- **Use Quantity Entities** for counts, amounts, and resources
- **Use Replacement Entities** for replacing existing values
- **Use Choice Entities** for player selections
- **Use Other Entities** for special abilities and proficiencies

### **Conditional Application**
- **Use Specific Conditions**: Ensure conditions are specific and well-defined
- **Test Edge Cases**: Verify that conditions work correctly in all scenarios
- **Avoid Overly Broad Conditions**: Use conditions that clearly define when entities should apply

### **Formula Integration**
- **Verify Formula Parameters**: Ensure formula parameters are correctly configured
- **Test Progression**: Verify that features scale correctly with level
- **Use Appropriate Formula Types**: Choose the right formula type for the progression pattern

### **Cross-System Integration**
- **Use Correct Applies-To Types**: Ensure entities target the correct systems
- **Verify Integration**: Test that entities work correctly with other systems
- **Follow System Conventions**: Use established patterns for cross-system integration

### **Resource Management**
- **Use Quantity Entities for Resources**: Clearly indicate when values represent counts
- **Implement Proper Tracking**: Ensure resources are properly tracked and consumed
- **Handle Edge Cases**: Consider what happens when resources are exhausted

## 🔧 **Testing Strategies**

### **Validation Testing**
- **Test All Entity Types**: Verify that each entity type works correctly
- **Test All Conditions**: Ensure conditions apply and don't apply as intended
- **Test Formula Integration**: Verify that formulas calculate correctly
- **Test Cross-System Integration**: Ensure entities work with other systems

### **Edge Case Testing**
- **Test Boundary Conditions**: Verify behavior at level boundaries
- **Test Resource Exhaustion**: Ensure proper behavior when resources are used up
- **Test Choice Dependencies**: Verify that choices work correctly with dependent entities
- **Test Stacking Rules**: Ensure bonus stacking follows D&D rules

### **Integration Testing**
- **Test Feature Combinations**: Verify that multiple features work together correctly
- **Test System Interactions**: Ensure features work correctly with other systems
- **Test User Interface**: Verify that features display correctly in the UI
- **Test Data Persistence**: Ensure features are saved and loaded correctly

## 🔗 **Related Documentation**

- **[Examples](examples.md)** - Comprehensive implementation examples
- **[Database Schema](database-schema.md)** - Feature system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Feature system validation rules and schemas
- **[Static Data](static-data.md)** - Feature system enums and types
- **[Testing Patterns](testing-patterns.md)** - Testing strategies for feature implementations
- **[Formula System](formula-system.md)** - Formula system reference
