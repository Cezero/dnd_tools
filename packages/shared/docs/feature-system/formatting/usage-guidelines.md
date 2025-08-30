# Formatter System Usage Guidelines for Agents

## Overview

This document provides comprehensive guidelines for agents working with the D&D Tools formatter system. The formatter system implements a **6-layer clean architecture** with **registry pattern** that must be used correctly to maintain proper separation of concerns and avoid architectural violations.

The formatting system is used by multiple other systems in the D&D Tools project, including the [Class System](../class-system/README.md) and [Race System](../race-system/README.md), to display feature progressions in a consistent and user-friendly manner.

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

## 🧪 **Testing Patterns**

### **1. Unit Testing**

#### ✅ **CORRECT: Test individual components with proper mocking**
The registry pattern makes unit testing straightforward by allowing easy mocking of calculator and formatter implementations. Mock implementations can be registered with the registry to test specific scenarios without affecting the overall system.

When testing display strategies, mock the calculators and formatters they depend on to isolate the strategy logic from the implementation details of the calculators and formatters.

### **2. Integration Testing**

#### ✅ **CORRECT: Test complete workflow with real data**
Integration testing should verify that the complete formatting workflow functions correctly with real data. This includes testing the 6-phase process, proper error handling, and correct output formatting.

Test with actual feature progressions from the [Class System](../class-system/README.md) and [Race System](../race-system/README.md) to ensure the formatting system works correctly with real-world data.

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

## Integration with Other Systems

The formatting system is used by multiple other systems in the D&D Tools project:

### **Class System Integration**
The [Class System](../class-system/README.md) uses the formatting system to display class feature progressions. Class features with multiple levels and complex progression patterns are formatted consistently using the 6-phase process.

### **Race System Integration**
The [Race System](../race-system/README.md) uses the formatting system to display racial feature progressions. Racial features with level-based scaling and conditional modifiers are formatted using the same patterns as class features.

### **Feature System Integration**
The main [Feature System](../README.md) uses the formatting system for feature detail displays and editing interfaces. This ensures consistent formatting across all feature-related displays in the application.

## Related Documentation

- **[README.md](./README.md)** - Architecture overview and navigation
- **[Final Implementation Summary](./final-implementation-summary.md)** - Current implementation status
- **[Refactoring Strategy](./refactoring-strategy.md)** - Design decisions and architecture rationale
- **[Architecture Decisions](./architecture-decisions.md)** - Key architectural decisions and future extensibility
- **[Class System](../class-system/README.md)** - Class system documentation
- **[Race System](../race-system/README.md)** - Race system documentation
- **[Feature System Overview](../README.md)** - Main feature system documentation

