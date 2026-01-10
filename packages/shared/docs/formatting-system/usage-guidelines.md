# Formatter System Usage Guidelines for Agents

## Overview

This document provides comprehensive guidelines for agents working with the D&D Tools formatter system. The formatter system implements a **6-layer clean architecture** with **registry pattern** that must be used correctly to maintain proper separation of concerns and avoid architectural violations.

The formatting system is used by multiple other systems in the D&D Tools project, including the [Class System](../class-system/README.md) and [Race System](../race-system/README.md), to display feature progressions in a consistent and user-friendly manner.

## 🆕 **Recent GroupingId Integration**

The formatting system has been updated to use **`groupingId`-based grouping** instead of the previous entity type-based grouping approach. This change improves the accuracy of feature grouping and transition detection by using logical grouping identifiers rather than entity type classifications.

### **Key Changes for Agents**

1. **Grouping Logic**: Entities are now grouped by their `groupingId` value rather than by entity type and subtype
2. **Transition Detection**: Transition detection now works with logical grouping rather than entity type grouping
3. **Maintained Architecture**: All changes preserve the 6-layer architecture and 6-phase processing flow
4. **Enhanced Accuracy**: The new approach correctly handles complex feature scenarios without false transitions

### **GroupingId Behavior**

- **`groupingId = 0`**: Represents ungrouped entities that are formatted individually
- **`groupingId > 0`**: Represents logically grouped entities that are formatted together as a unit
- **Default Value**: All entities have a `groupingId` that defaults to 0 if not explicitly set
- **No Validation Required**: The system assumes `groupingId` is always present and valid

## 🏗️ **Architecture Principles**

For complete architecture overview and layer descriptions, see **[README.md](./README.md)**.

### **Critical Architecture Rules**

#### ✅ **CORRECT: Proper Dependency Flow**
- **High-level layers** (6) depend on **abstractions** (interfaces)
- **Low-level layers** (1-5) implement **abstractions**
- **Display Strategies orchestrate** all lower layers through the 6-phase process
- **Registry pattern** handles calculator and formatter access
- **Display Strategies handle workflow** - input validation, layer coordination, result processing
- **Each layer has single responsibility** - pure formatting, calculation, grouping, etc.

#### ❌ **WRONG: Architecture Inversions**
- **Never** create layers above Display Strategies (Layer 6)
- **Never** create circular dependencies between layers
- **Never** mix coordination and object creation responsibilities
- **Never** violate single responsibility principle
- **Never** create wrapper functions that bypass display strategies
- **Never** access lower layers directly from consumer code
- **Never** use direct imports of calculator instances

## 🎯 **Usage Patterns**

### **1. Using Display Strategies Directly**

#### ✅ **CORRECT: Use display strategies for complete formatting workflow**
The formatting system provides a factory pattern for accessing display strategies. Each display type (Edit, Detail, CharacterSheet) has its own strategy that orchestrates the complete 6-phase formatting process.

Display strategies handle the complete workflow from input validation through final result processing, ensuring proper separation of concerns and maintaining the architectural integrity of the system.

#### ❌ **WRONG: Don't create wrapper functions or orchestrators**
Avoid creating wrapper functions that simply call display strategies, as this adds unnecessary layers and violates the single responsibility principle. Display strategies are already designed to handle the complete formatting workflow.

Similarly, avoid creating orchestrators above display strategies, as this violates the 6-layer architecture and creates circular dependencies.

### **2. Using Registry Pattern (Internal Use Only)**

#### ✅ **CORRECT: Use registry pattern for internal calculator and formatter access**
The registry pattern provides centralized management of all calculator and formatter implementations. This approach ensures consistency, type safety, and extensibility while maintaining proper separation of concerns.

For internal use within display strategies, calculators and formatters should be accessed through their respective registries. This provides several benefits including centralized management, easy testing through mocking, and support for multiple implementations per type.

#### ❌ **WRONG: Don't access calculators or formatters from consumer code**
Consumer code should never directly access calculators or formatters through the registry. This bypasses the display strategy orchestration and violates the architectural principles of the system.

All formatting operations should go through display strategies, which handle the complete 6-phase process including proper error handling, context management, and result formatting.

### **3. Type System Usage**

#### ✅ **CORRECT: Use consolidated types and base interfaces**
The formatting system uses a clean type hierarchy with base interfaces that provide common properties for all related types. This approach eliminates duplication and ensures consistency across the type system.

When working with formatted items, use the consolidated types that extend base interfaces. This provides type safety, consistency, and maintainability while avoiding the deprecated duplicate interfaces that were eliminated during the refactoring.

#### ❌ **WRONG: Don't use deprecated or duplicate types**
Avoid using the deprecated types that were consolidated during the refactoring. These include the old transition detection input types, grouped item types, and progression grouped item types that have been replaced with unified interfaces.

Similarly, avoid creating new duplicate interfaces that replicate functionality already provided by the base interfaces. Instead, extend the existing base interfaces to add new functionality.

### **4. Enum Usage**

#### ✅ **CORRECT: Use proper enums instead of magic numbers**
The formatting system uses proper TypeScript enums for all constants and type identifiers. This provides type safety, prevents invalid values, and improves code readability and maintainability.

When working with calculator types, transition types, or other constants, use the appropriate enums rather than hardcoded numeric values. This ensures consistency and prevents errors from typos or incorrect values.

#### ❌ **WRONG: Don't use magic numbers**
Avoid using hardcoded numeric values for calculator types, transition types, or other constants. These magic numbers make the code difficult to maintain, prone to errors, and violate the principle of self-documenting code.

### **5. GroupingId Usage**

#### ✅ **CORRECT: Use groupingId for all grouping operations**
The formatting system now uses `groupingId` as the primary criterion for grouping entities. This provides logical grouping based on content administrator intent rather than arbitrary entity type classifications.

When working with grouping operations:
- **Phase 3**: Use `groupingId` for within-level grouping
- **Phase 4**: Use `groupingId` for transition detection
- **Type System**: Ensure all relevant interfaces include the `groupingId` field
- **Grouping Strategies**: Implement grouping logic based on `groupingId` values

#### ❌ **WRONG: Don't use entity type-based grouping**
Avoid using the old entity type and subtype-based grouping approach. This approach was replaced because it led to incorrect groupings and false transitions in complex feature scenarios.

The new `groupingId` approach provides more accurate and logical grouping that better reflects the intended feature organization.

## 🔧 **Development Patterns**

### **1. Adding New Calculator Types**

#### ✅ **CORRECT: Use registry pattern for new calculator types**
When adding new calculator implementations, use the registry pattern to register them with unique type identifiers. This ensures proper integration with the existing system while maintaining extensibility.

New calculator implementations should implement the appropriate interface and be registered with a unique type ID to avoid conflicts with existing implementations. This approach allows for specialized calculators for specific use cases while maintaining the overall architecture.

#### ❌ **WRONG: Don't replace default implementations without proper consideration**
Avoid replacing the default implementations (registered with type `0`) without thorough testing and consideration of the impact on existing functionality. Default implementations are used throughout the system and changing them can have widespread effects.

### **2. Adding New Formatter Types**

#### ✅ **CORRECT: Use formatter registry for new formatter types**
New formatters should be implemented according to the appropriate interface and registered through the formatter registry. This ensures consistency with existing formatters and proper integration with the display strategy orchestration.

### **3. Error Handling**

#### ✅ **CORRECT: Handle missing calculators and formatters gracefully**
Always check for missing calculators and formatters before using them. The registry pattern may return undefined for unregistered types, so proper null checking is essential for robust error handling.

When calculators or formatters are missing, provide meaningful error messages and appropriate fallback behavior. This ensures the system continues to function even when expected components are not available.

#### ❌ **WRONG: Don't assume calculators or formatters exist**
Never assume that a calculator or formatter exists without checking. This can lead to runtime errors and poor user experience when expected components are not available.

### **4. GroupingId Integration**

#### ✅ **CORRECT: Follow groupingId integration patterns**
When working with the new groupingId system:

1. **Respect the Core Principle**: Only change Phase 3 grouping logic, maintain all other phases and behavior
2. **Use groupingId for Grouping**: All grouping operations should use `groupingId` instead of entity type
3. **Maintain Delimiters**: Keep all existing delimiters (modifiers: `', '`, choices: `' | '`, effects: `', '`)
4. **Preserve Display Behavior**: Maintain DisplayType.Edit and DisplayType.Detail behavior exactly as before
5. **Update Type Interfaces**: Ensure all relevant interfaces include the `groupingId` field

#### ❌ **WRONG: Don't violate groupingId integration principles**
Avoid these common mistakes:

1. **Changing Delimiters**: Don't modify the existing delimiter behavior
2. **Changing Display Types**: Don't alter how DisplayType.Edit or DisplayType.Detail work
3. **Bypassing Phases**: Don't skip or modify phases other than Phase 3 and Phase 4
4. **Ignoring groupingId**: Don't fall back to entity type-based grouping

## 🧪 **Testing Patterns**

### **1. Unit Testing**

#### ✅ **CORRECT: Test individual components with proper mocking**
The registry pattern makes unit testing straightforward by allowing easy mocking of calculator and formatter implementations. Mock implementations can be registered with the registry to test specific scenarios without affecting the overall system.

When testing display strategies, mock the calculators and formatters they depend on to isolate the strategy logic from the implementation details of the calculators and formatters.

### **2. Integration Testing**

#### ✅ **CORRECT: Test complete workflow with real data**
Integration testing should verify that the complete formatting workflow functions correctly with real data. This includes testing the 6-phase process, proper error handling, and correct output formatting.

Test with actual feature progressions from the [Class System](../class-system/README.md) and [Race System](../race-system/README.md) to ensure the formatting system works correctly with real-world data.

### **3. GroupingId Testing**

#### ✅ **CORRECT: Test groupingId integration thoroughly**
When testing the new groupingId system:

1. **Test Grouping Logic**: Verify that entities with the same `groupingId` are grouped together
2. **Test Transition Detection**: Ensure transitions are detected correctly using `groupingId` grouping
3. **Test Complex Scenarios**: Use complex features like "Inspire Greatness" to test edge cases
4. **Test Display Types**: Verify that all display types work correctly with the new grouping
5. **Test Delimiters**: Ensure all delimiters are preserved and working correctly

## 🚫 **Anti-Patterns to Avoid**

### **1. Architecture Violations**

#### ❌ **WRONG: Creating layers above Display Strategies**
Avoid creating orchestrators or wrapper functions above display strategies. Display strategies are the highest layer in the 6-layer architecture and should not be wrapped by additional layers.

#### ❌ **WRONG: Direct access to lower layers**
Consumer code should never directly access calculators or formatters. All formatting operations should go through display strategies to maintain proper architectural boundaries.

### **2. Type System Violations**

#### ❌ **WRONG: Using deprecated types**
Avoid using the deprecated types that were consolidated during the refactoring. These types have been replaced with unified interfaces that provide better type safety and consistency.

#### ❌ **WRONG: Creating duplicate interfaces**
Avoid creating new interfaces that duplicate functionality already provided by the base interfaces. Instead, extend the existing base interfaces to add new functionality.

### **3. Registry Pattern Violations**

#### ❌ **WRONG: Direct imports of calculator instances**
Avoid importing calculator instances directly from their source files. All calculator access should go through the registry to maintain consistency and support the extensibility features.

#### ❌ **WRONG: Replacing default implementations without testing**
Avoid replacing default implementations without thorough testing. Default implementations are used throughout the system and changing them can have widespread effects.

### **4. GroupingId Integration Violations**

#### ❌ **WRONG: Mixing old and new grouping approaches**
Avoid mixing the old entity type-based grouping with the new `groupingId` approach. This can lead to inconsistent behavior and incorrect results.

#### ❌ **WRONG: Changing non-grouping aspects**
Avoid modifying delimiters, display type behavior, or other aspects that should remain unchanged. The groupingId integration only affects the grouping logic, not the formatting or display behavior.

### **5. Entity Precaching Violations**

#### ❌ **WRONG: Formatting without precaching**
Never format feature progressions without ensuring entities are precached first. This will result in "name not found" errors and poor user experience.

#### ❌ **WRONG: Ignoring loading states**
Don't ignore the `isComplete` state from the precaching hook. Always check completion before formatting to ensure data is available.

## 📋 **Best Practices**

### **1. Registry Usage**
- **Always use registry pattern** for calculator and formatter access
- **Check for missing calculators/formatters** before using them
- **Use unique type IDs** for new implementations
- **Test thoroughly** before replacing default implementations

### **2. Type System**
- **Use consolidated types** that extend base interfaces
- **Extend base interfaces** for new types rather than creating duplicates
- **Use proper enums** instead of magic numbers
- **Avoid deprecated types**
- **Include groupingId** in all relevant interfaces

### **3. Error Handling**
- **Handle missing calculators/formatters** gracefully
- **Provide meaningful error messages**
- **Use fallback values** when appropriate
- **Log warnings** for debugging

### **4. Testing**
- **Mock registry** for unit testing
- **Test complete workflows** for integration testing
- **Test error conditions** thoroughly
- **Use real data** for integration tests
- **Test groupingId scenarios** specifically

### **5. GroupingId Integration**
- **Follow the core principle**: Only change Phase 3 grouping logic
- **Use groupingId consistently**: Apply groupingId-based grouping throughout Phase 3 and Phase 4
- **Maintain existing behavior**: Preserve all delimiters and display type behavior
- **Test thoroughly**: Verify that complex scenarios work correctly
- **Document changes**: Update documentation to reflect the new approach

### **6. Entity Precaching Requirements**

#### ✅ **CORRECT: Always precache before formatting**

Entity names (feats, features, spells, domains, classes, skills, races) must be available in the TanStack Query cache when formatters need them. Formatters use synchronous cache access and cannot trigger fetches, so entities must be precached before formatting.

**React Component Pattern**:
```tsx
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';
import { displayStrategyFactory } from '@/lib/formatters';
import { useQueryClient } from '@tanstack/react-query';

function FeatureDisplay({ progressions }: { progressions: FeatureProgression[] }) {
    const queryClient = useQueryClient();
    
    // Precache all entities referenced in progressions
    const { isComplete } = usePrecacheFeatureEntities(progressions);
    
    // Show loading state while precaching
    if (!isComplete) {
        return <div>Loading features...</div>;
    }
    
    // Format after precaching completes
    const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
    const result = strategy.format(progressions, { queryClient });
    
    return <div>{/* Render formatted features */}</div>;
}
```

**Imperative Pattern**:
```typescript
import { DisplayStrategyBase } from '@/lib/formatters';

// Precache entities before formatting
await DisplayStrategyBase.precacheEntities(progressions, queryClient);

// Now safe to format
const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
const result = strategy.format(progressions, { queryClient });
```

#### ❌ **WRONG: Formatting without precaching**

Never format feature progressions without ensuring entities are precached first. This will result in "name not found" errors:

```tsx
// ❌ WRONG: Formatting without precaching
const strategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
const result = strategy.format(progressions, { queryClient });
// May show "243 (feat name not found)" instead of actual feat name
```

#### ✅ **CORRECT: Show loading states during precaching**

Always provide user feedback during precaching:

```tsx
const { isPrecaching, isComplete } = usePrecacheFeatureEntities(progressions);

if (isPrecaching || !isComplete) {
    return <div>Loading features...</div>;
}
```

#### ❌ **WRONG: No loading state**

Don't leave users wondering what's happening:

```tsx
// ❌ WRONG: No loading state
const { isComplete } = usePrecacheFeatureEntities(progressions);
// User sees nothing while precaching
```

#### ✅ **CORRECT: Handle errors gracefully**

The precaching system handles errors gracefully, but components should handle error states:

```tsx
const { isComplete, error } = usePrecacheFeatureEntities(progressions);

if (error) {
    console.error('Precaching error:', error);
    // Continue with fallback or show error message
}

if (!isComplete) {
    return <div>Loading...</div>;
}
```

#### **Precaching Best Practices**

1. **Always Precache**: Never format without precaching first
2. **Show Loading States**: Provide feedback during precaching
3. **Handle Errors**: Gracefully handle precaching errors
4. **Check Completion**: Always check `isComplete` before formatting
5. **Pass QueryClient**: Ensure `queryClient` is passed to display strategies

For comprehensive precaching documentation, see **[Entity Precaching System](./entity-precaching.md)**.

## Integration with Other Systems

The formatting system is used by multiple other systems in the D&D Tools project:

### **Class System Integration**
The [Class System](../class-system/README.md) uses the formatting system to display class feature progressions. Class features with multiple levels and complex progression patterns are formatted consistently using the 6-phase process with the new groupingId-based grouping.

### **Race System Integration**
The [Race System](../race-system/README.md) uses the formatting system to display racial feature progressions. Racial features with level-based scaling and conditional modifiers are formatted using the same patterns as class features, now with improved groupingId-based grouping.

### **Feature System Integration**
The main [Feature System](../README.md) uses the formatting system for feature detail displays and editing interfaces. This ensures consistent formatting across all feature-related displays in the application, with the new groupingId approach providing more accurate and logical grouping.

## Related Documentation

- **[README.md](./README.md)** - Architecture overview and navigation
- **[Entity Precaching System](./entity-precaching.md)** - Entity precaching architecture and usage
- **[Final Implementation Summary](./final-implementation-summary.md)** - Current implementation status
- **[Refactoring Strategy](./refactoring-strategy.md)** - Design decisions and architecture rationale
- **[Architecture Decisions](./architecture-decisions.md)** - Key architectural decisions and future extensibility
- **[Class System](../class-system/README.md)** - Class system documentation
- **[Race System](../race-system/README.md)** - Race system documentation
- **[Feature System Overview](../README.md)** - Main feature system documentation

