# Architecture Decisions

## Overview

This document captures the key architectural decisions made during the comprehensive refactoring of the Feature Formatting System in August 2024 and the subsequent groupingId integration. These decisions form the foundation for the current implementation and future extensibility.

The formatting system is used by multiple other systems in the D&D Tools project, including the [Class System](../class-system/README.md) and [Race System](../race-system/README.md), to display feature progressions in a consistent and user-friendly manner.

## Key Architectural Decisions

### **1. Registry Pattern for Calculator Management**

#### **Decision**: Implement centralized registry pattern for all calculator and formatter access

**Context**: The system needed to support multiple calculator implementations while maintaining clean separation of concerns and enabling future extensibility.

**Options Considered**:
1. **Direct Singleton Imports**: Import singleton instances directly
2. **Factory Pattern**: Create new instances for each use
3. **Registry Pattern**: Centralized management with registration/lookup

**Chosen Solution**: Registry Pattern

**Rationale**:
- **Extensibility**: Easy to add different implementations for different formula types
- **Consistency**: All calculator access follows the same pattern
- **Type Safety**: Proper TypeScript interfaces ensure type safety
- **Maintainability**: Centralized calculator management
- **Testing**: Easy to mock and test different implementations

**Implementation**: The registry pattern is implemented in `frontend/src/lib/formatters/calculator-registry.ts` and provides centralized management of all calculator types through a unified interface.

**Benefits Achieved**:
- ✅ **Future Extensibility**: Easy to add specialized implementations
- ✅ **Consistency**: All access follows the same pattern
- ✅ **Type Safety**: Proper interfaces ensure type safety
- ✅ **Maintainability**: Centralized management
- ✅ **Testing**: Easy to mock and test

### **2. Type System Consolidation**

#### **Decision**: Create base interfaces and eliminate duplicate types

**Context**: The system had multiple duplicate interfaces that were causing maintenance issues and type inconsistencies.

**Options Considered**:
1. **Keep Duplicate Interfaces**: Maintain separate interfaces for similar purposes
2. **Partial Consolidation**: Consolidate some but not all duplicates
3. **Complete Consolidation**: Create base interfaces and eliminate all duplicates

**Chosen Solution**: Complete Consolidation

**Rationale**:
- **Reduced Duplication**: Eliminate redundant interface definitions
- **Type Safety**: Clear inheritance hierarchy with proper extensions
- **Maintainability**: Single source of truth for common properties
- **Consistency**: All types follow the same patterns
- **Developer Experience**: Better IntelliSense and error messages

**Implementation**: Base interfaces are defined in `frontend/src/lib/formatters/types.ts` and provide common properties for all related types. Extended interfaces inherit from these base interfaces to ensure consistency.

**Consolidated Types**:
- **`GroupedLevelItem`**: Replaces multiple duplicate interfaces for grouped items with level information
- **`FormattedItemWithBreakdown`**: Replaces duplicate interfaces for formatted items with breakdown information
- **`BaseProcessingResult`**: Extends base formatted value for consistent structure

**Benefits Achieved**:
- ✅ **Reduced Maintenance**: Single source of truth for common properties
- ✅ **Type Safety**: Clear inheritance hierarchy prevents errors
- ✅ **Consistency**: All types follow same patterns
- ✅ **Developer Experience**: Better IntelliSense and error messages

### **3. Enum Usage for Constants**

#### **Decision**: Replace magic numbers with proper enums

**Context**: The system used hardcoded magic numbers throughout the codebase, making it difficult to maintain and prone to errors.

**Options Considered**:
1. **Keep Magic Numbers**: Continue using hardcoded values
2. **String Constants**: Use string constants instead of numbers
3. **Proper Enums**: Use TypeScript enums with numeric values

**Chosen Solution**: Proper Enums

**Rationale**:
- **Type Safety**: Prevent invalid values and improve IntelliSense
- **Maintainability**: Centralized constants that are easy to update
- **Readability**: Self-documenting code with meaningful names
- **Consistency**: All constants follow the same pattern
- **Performance**: Numeric enums are more efficient than string constants

**Implementation**: Enums are defined in `frontend/src/lib/formatters/types.ts` and provide type-safe constants for calculator types, transition types, and other system constants.

**Benefits Achieved**:
- ✅ **Type Safety**: Proper TypeScript enums prevent invalid values
- ✅ **Maintainability**: Centralized constants
- ✅ **Readability**: Self-documenting code
- ✅ **Consistency**: All constants follow same pattern
- ✅ **Performance**: Numeric enums are efficient

### **4. GroupingId-Based Grouping**

#### **Decision**: Replace entity type-based grouping with groupingId-based grouping

**Context**: The system was using entity type and subtype classifications for grouping, which led to incorrect groupings and false transitions in complex feature scenarios like "Inspire Greatness".

**Options Considered**:
1. **Keep Entity Type Grouping**: Continue using the existing entity type-based approach
2. **Hybrid Approach**: Use both entity type and groupingId for grouping
3. **Complete GroupingId Replacement**: Replace entity type grouping entirely with groupingId-based grouping

**Chosen Solution**: Complete GroupingId Replacement

**Rationale**:
- **Logical Grouping**: GroupingId provides logical grouping based on content administrator intent
- **Accurate Transitions**: Prevents false transitions by using logical rather than arbitrary groupings
- **Admin Control**: Content administrators have full control over feature grouping
- **Maintained Architecture**: Preserves all architectural principles and phase separation
- **Enhanced Accuracy**: Correctly handles complex feature scenarios without false transitions

**Implementation**: The groupingId integration is implemented across multiple components:
- **Type System**: `FormattedItemWithBreakdown` and `EntityGroupKey` interfaces now include `groupingId`
- **Grouping Strategies**: `ModifierGroupingStrategy` now groups by `groupingId` instead of entity type
- **Display Strategies**: `groupWithinLevel` and `detectTransitions` methods now use `groupingId`-based grouping
- **Phase 3**: Within-level grouping now uses `groupingId` instead of entity type/subtype
- **Phase 4**: Transition detection now works with `groupingId`-based groups

**Benefits Achieved**:
- ✅ **Accurate Grouping**: Entities are now grouped logically rather than by arbitrary type classifications
- ✅ **Correct Transition Detection**: Transitions are detected based on logical grouping, preventing false positives
- ✅ **Admin Control**: Content administrators can control grouping through the `groupingId` field
- ✅ **Maintained Architecture**: All architectural principles and phase separation remain intact
- ✅ **Enhanced User Experience**: Feature displays are now more accurate and user-friendly

### **5. Centralized QueryClient Accessor**

#### **Decision**: Implement centralized QueryClient accessor as single source of truth

**Context**: The formatting system needed queryClient to resolve entity names from cache, but passing it through every function call was error-prone and required every caller to remember to pass it. This led to "Unknown Skill" and similar issues when queryClient was forgotten.

**Options Considered**:
1. **Continue Parameter Passing**: Keep passing queryClient as optional parameter through all functions
2. **Fallback Pattern**: Use centralized accessor as fallback when queryClient not provided
3. **Centralized Accessor Only**: Make centralized accessor the only way to access queryClient

**Chosen Solution**: Centralized Accessor Only

**Rationale**:
- **Eliminates Boilerplate**: No need to pass queryClient anywhere
- **Single Source of Truth**: QueryClient defined once in QueryProvider
- **Impossible to Forget**: Formatters always have access via accessor
- **Cleaner APIs**: Fewer parameters to manage
- **Type Safety**: TypeScript ensures proper usage
- **Consistency**: All formatters access queryClient the same way

**Implementation**: The centralized accessor is implemented in:
- **QueryProvider**: Exports queryClient instance as named export
- **Accessor Module**: `queryClientAccessor.ts` provides `getQueryClient()` function
- **Cache Helpers**: All cache helpers use accessor internally, removing queryClient parameter
- **Labelers**: All labelers use cache helpers that use accessor internally
- **Formatters**: All formatters use cache helpers that use accessor internally
- **DisplayContext**: Removed queryClient field from interface

**Benefits Achieved**:
- ✅ **Eliminated Boilerplate**: No queryClient parameters needed anywhere
- ✅ **Single Source of Truth**: QueryClient defined once in QueryProvider
- ✅ **Impossible to Forget**: Formatters always have access via accessor
- ✅ **Cleaner APIs**: Fewer parameters to manage
- ✅ **Type Safety**: Full TypeScript support maintained
- ✅ **Consistency**: All formatters work the same way

### **6. Future Extensibility Architecture**

#### **Decision**: Set up architecture to support multiple calculator implementations

**Context**: The system needed to support future enhancements while maintaining clean separation of concerns.

**Options Considered**:
1. **Single Implementation**: One implementation per calculator type
2. **Multiple Implementations**: Support multiple implementations per type
3. **Plugin Architecture**: Full plugin system for calculators

**Chosen Solution**: Multiple Implementations via Registry

**Rationale**:
- **Flexibility**: Support different implementations for different use cases
- **Scalability**: Easy to add new calculator types
- **Maintainability**: Clear separation of concerns
- **Testing**: Easy to mock and test different implementations
- **Performance**: Can optimize specific implementations for specific use cases

**Implementation**: The registry pattern supports multiple implementations per calculator type, with default implementations registered with type `0` and specialized implementations using unique type identifiers.

**Benefits Achieved**:
- ✅ **Flexibility**: Support different implementations
- ✅ **Scalability**: Easy to add new calculator types
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Testing**: Easy to mock and test
- ✅ **Performance**: Can optimize for specific use cases

## Future Extensibility Considerations

### **1. Choice Calculator Implementation**

**Current Status**: Reserved for future implementation

**Future Enhancement**: Implement specialized choice calculators

**Rationale**:
- **Different Choice Types**: Different choice types may need different calculation logic
- **Complex Choices**: Some choices may have complex calculation requirements
- **Performance**: Specialized calculators may be more efficient
- **Maintainability**: Clear separation of choice calculation logic

**Implementation Plan**: Specialized choice calculators would be implemented for different choice types such as skill choices, feat choices, and other complex choice scenarios. These would be registered with unique type identifiers in the calculator registry.

**Benefits**:
- **Specialized Logic**: Each choice type can have optimized calculation logic
- **Performance**: More efficient calculations for specific choice types
- **Maintainability**: Clear separation of choice calculation concerns
- **Extensibility**: Easy to add new choice types

### **2. Conditional Value Detector Implementation**

**Current Status**: Reserved for future implementation

**Future Enhancement**: Implement specialized conditional value detectors

**Rationale**:
- **Different Condition Types**: Different condition types may need different detection logic
- **Complex Conditions**: Some conditions may have complex detection requirements
- **Performance**: Specialized detectors may be more efficient
- **Maintainability**: Clear separation of conditional detection logic

**Implementation Plan**: Specialized conditional detectors would be implemented for different condition types such as modifier conditions, choice conditions, and other complex conditional scenarios. These would be registered with unique type identifiers in the calculator registry.

**Benefits**:
- **Specialized Detection**: Each condition type can have optimized detection logic
- **Performance**: More efficient detection for specific condition types
- **Maintainability**: Clear separation of conditional detection concerns
- **Extensibility**: Easy to add new condition types

### **3. Specialized Progression Generators**

**Current Status**: Single default implementation

**Future Enhancement**: Implement specialized progression generators

**Rationale**:
- **Different Formula Types**: Different formula types may need different progression logic
- **Complex Progressions**: Some progressions may have complex generation requirements
- **Performance**: Specialized generators may be more efficient
- **Maintainability**: Clear separation of progression generation logic

**Implementation Plan**: Specialized progression generators would be implemented for different formula types such as conditional scaling formulas, choice-based formulas, and other complex progression scenarios. These would be registered with unique type identifiers in the calculator registry.

**Benefits**:
- **Specialized Generation**: Each formula type can have optimized progression logic
- **Performance**: More efficient generation for specific formula types
- **Maintainability**: Clear separation of progression generation concerns
- **Extensibility**: Easy to add new formula types

### **4. Specialized Transition Detectors**

**Current Status**: Single default implementation

**Future Enhancement**: Implement specialized transition detectors

**Rationale**:
- **Different Entity Types**: Different entity types may need different transition detection logic
- **Complex Transitions**: Some transitions may have complex detection requirements
- **Performance**: Specialized detectors may be more efficient
- **Maintainability**: Clear separation of transition detection logic

**Implementation Plan**: Specialized transition detectors would be implemented for different entity types such as modifiers, choices, effects, and other complex transition scenarios. These would be registered with unique type identifiers in the calculator registry.

**Benefits**:
- **Specialized Detection**: Each entity type can have optimized transition detection logic
- **Performance**: More efficient detection for specific entity types
- **Maintainability**: Clear separation of transition detection concerns
- **Extensibility**: Easy to add new entity types

## Lessons Learned

### **1. Registry Pattern Value**

**Lesson**: Registry pattern provides significant extensibility benefits

**Impact**:
- **Future Flexibility**: Easy to add specialized implementations
- **Testing**: Easy to mock and test different implementations
- **Consistency**: All access follows same pattern
- **Maintainability**: Centralized management

**Application**: Will use registry pattern for future calculator types

### **2. Type Consolidation Benefits**

**Lesson**: Consolidating duplicate types significantly improves maintainability

**Impact**:
- **Reduced Maintenance**: Single source of truth for common properties
- **Type Safety**: Clear inheritance hierarchy prevents errors
- **Consistency**: All types follow same patterns
- **Developer Experience**: Better IntelliSense and error messages

**Application**: Will continue to consolidate types in future refactoring

### **3. Enum Usage Importance**

**Lesson**: Replacing magic numbers with proper enums improves code quality

**Impact**:
- **Type Safety**: Proper TypeScript enums prevent invalid values
- **Maintainability**: Centralized constants
- **Readability**: Self-documenting code
- **Consistency**: All constants follow same pattern

**Application**: Will continue to use enums for all constants

### **4. GroupingId Integration Benefits**

**Lesson**: Replacing entity type-based grouping with groupingId-based grouping significantly improves accuracy

**Impact**:
- **Accurate Grouping**: Entities are now grouped logically rather than by arbitrary type classifications
- **Correct Transitions**: Transitions are detected based on logical grouping, preventing false positives
- **Admin Control**: Content administrators have full control over feature grouping
- **Maintained Architecture**: All architectural principles remain intact

**Application**: Will continue to use groupingId-based grouping for all feature grouping operations

### **5. Centralized Accessor Benefits**

**Lesson**: Centralized accessor pattern eliminates boilerplate and prevents errors

**Impact**:
- **Reduced Boilerplate**: No need to pass queryClient through function parameters
- **Error Prevention**: Impossible to forget to pass queryClient
- **Consistency**: All formatters access queryClient the same way
- **Maintainability**: Single source of truth for queryClient access

**Application**: Will use centralized accessor pattern for other cross-cutting concerns

### **6. Future Extensibility Planning**

**Lesson**: Planning for future extensibility from the start pays dividends

**Impact**:
- **Flexibility**: Easy to add new implementations
- **Scalability**: Architecture supports growth
- **Maintainability**: Clear separation of concerns
- **Testing**: Easy to test different implementations

**Application**: Will continue to design for extensibility in future features

## Integration with Other Systems

The formatting system is used by multiple other systems in the D&D Tools project:

### **Class System Integration**
The [Class System](../class-system/README.md) uses the formatting system to display class feature progressions. Class features with multiple levels and complex progression patterns are formatted consistently using the 6-phase process with the new groupingId-based grouping.

### **Race System Integration**
The [Race System](../race-system/README.md) uses the formatting system to display racial feature progressions. Racial features with level-based scaling and conditional modifiers are formatted using the same patterns as class features, now with improved groupingId-based grouping.

### **Feature System Integration**
The main [Feature System](../README.md) uses the formatting system for feature detail displays and editing interfaces. This ensures consistent formatting across all feature-related displays in the application, with the new groupingId approach providing more accurate and logical grouping.

### **7. Spell Formatting Consolidation**

#### **Decision**: Create centralized spell formatters in frontend, remove from static-data

**Context**: Spell formatting logic was duplicated across multiple locations:
- `static-data/SpellData.ts` - Pure ID-to-name functions (`SpellSchoolNameList`, `SpellSubschoolNameList`, `SpellComponentAbbrList`, `SpellDescriptorNameList`)
- `spellcastingUtils.ts` - Spell object formatters with bracket notation
- `characterPdfService.ts` - Local helper functions

**Options Considered**:
1. **Keep in spellcastingUtils.ts**: Minimal change but maintains duplication
2. **Extend static-data functions**: Adds presentation logic to data package
3. **Create lib/formatters/spell-formatters.ts**: Centralized, follows existing patterns
4. **Extend FormattedCharacterResult**: Over-engineering for simple formatting

**Chosen Solution**: Option C - Create `lib/formatters/spell-formatters.ts`

**Rationale**:
- **Separation of Concerns**: Presentation formatting belongs in frontend, not static-data
- **Backend Independence**: Backend does not need spell formatting - it returns raw data
- **Follows Existing Patterns**: Consistent with `pure-formatters.ts` approach
- **Flexibility**: Options parameter supports both abbreviations and full names
- **Discoverability**: Centralized in formatters directory

**Implementation**:
- Created `spell-formatters.ts` with unified formatting functions:
  - `formatSpellSchool()` - Formats school and subschool with options for abbreviation and bracket style
  - `formatSpellComponents()` - Formats component IDs to names or abbreviations
  - `formatSpellDescriptors()` - Formats descriptor IDs to names
- Removed formatting helper functions from `static-data/SpellData.ts`:
  - `SpellSchoolNameList`, `SpellSubschoolNameList`, `SpellComponentAbbrList`, `SpellDescriptorNameList`
- Kept static data maps in `static-data/SpellData.ts`:
  - `SPELL_SCHOOL_MAP`, `SPELL_SUBSCHOOL_MAP`, `SPELL_COMPONENT_MAP`, `SPELL_DESCRIPTOR_MAP`
- Updated all callers to use new formatters
- **Note**: Source formatting functions (`formatSpellSource`, `getSpellSourceDisplay`) were later moved to `services/cache/CacheFunctions.ts` as part of source formatting consolidation (see section 8)

**Benefits Achieved**:
- ✅ **Single Source of Truth**: All spell formatting in one location
- ✅ **Separation of Concerns**: Data in static-data, presentation in formatters
- ✅ **Flexibility**: Options support both abbreviations and full names
- ✅ **Reduced Bundle Size**: Removed unused functions from shared package
- ✅ **Discoverability**: Formatters are in the expected location

---

### **8. Source Formatting Consolidation**

#### **Decision**: Consolidate all source book reference formatting into unified functions in `services/cache/CacheFunctions.ts`

**Context**: Source book reference formatting was duplicated across multiple locations:
- `services/cache/CacheFunctions.ts` - `getSourceDisplay()` with parentheses format `"PHB (pg 123)"`
- `lib/formatters/spell-formatters.ts` - `formatSpellSource()` and `getSpellSourceDisplay()` with space format `"PHB 123"`
- Inconsistent formats across 15+ files

**Key Findings**:
1. **sourceBookInfo Structure**: Contains only `sourceBookId` and `pageNumber` - no sourcebook names/abbreviations. All formatting must use `getSourceBookFromCache()`.
2. **Array Usage**: Arrays support items appearing in multiple sourcebooks (e.g., spell in both PHB and supplement).
3. **Format Inconsistency**: Two different formats used (`"PHB (pg 123)"` vs `"PHB 123"`).

**Options Considered**:
1. **Keep both formats with options**: Maintains flexibility but adds complexity
2. **Standardize on parentheses format**: Most common but less compact
3. **Standardize on space format**: More compact, cleaner appearance
4. **Keep separate functions**: Maintains duplication

**Chosen Solution**: Option 3 - Create unified functions with standardized space format

**Rationale**:
- **Single Source of Truth**: All source formatting in one location (`services/cache/CacheFunctions.ts`)
- **Consistency**: Standardized format (`"PHB 123"`) across entire application
- **Compactness**: Space format is more compact and cleaner
- **Simplicity**: No format options needed, reduces complexity
- **Cache Integration**: Functions use `getSourceBookFromCache()` internally, leveraging existing infrastructure
- **Flexibility**: Supports single source, arrays, and objects with `sourceBookInfo` property

**Implementation**:
- Created unified formatting functions in `services/cache/CacheFunctions.ts`:
  - `formatSourceReference()` - Format single source reference
  - `formatSourceReferences()` - Format multiple sources (comma-separated)
  - `formatSourceFromObject()` - Convenience function for objects with `sourceBookInfo`
- Updated `getSourceDisplay()` to use unified functions internally (backward compatible signature)
- Removed redundant functions from `spell-formatters.ts`:
  - `formatSpellSource()` - Replaced by `formatSourceFromObject()`
  - `getSpellSourceDisplay()` - Replaced by `formatSourceReference()`
- Standardized format: Changed from `"PHB (pg 123)"` to `"PHB 123"` everywhere
- Updated all callers (15+ files) to use unified functions

**Format Standardization**:
- **Decision**: Use space format (`"PHB 123"`) everywhere
- **Impact**: All existing `getSourceDisplay()` callers changed format (visual change only)
- **Benefits**: Consistent, compact appearance across tables, detail pages, and PDFs

**Benefits Achieved**:
- ✅ **Single Source of Truth**: All source formatting in one location
- ✅ **Consistency**: Standardized format across entire application
- ✅ **Flexibility**: Support multiple input formats (single source, array, object)
- ✅ **Maintainability**: One place to update formatting logic
- ✅ **Type Safety**: Proper TypeScript types for all input formats
- ✅ **Simplified API**: No format options needed (standardized on space format)
- ✅ **Leverages Cache**: Uses existing `getSourceBookFromCache` infrastructure
- ✅ **Clear Structure**: `sourceBookInfo` only contains IDs - formatting always uses cache

---

## Conclusion

The architectural decisions made during the refactoring and groupingId integration have created a solid foundation for the Feature Formatting System:

- **Registry Pattern**: Provides extensibility and consistency
- **Type Consolidation**: Improves maintainability and type safety
- **Enum Usage**: Enhances code quality and readability
- **GroupingId Integration**: Provides accurate and logical feature grouping
- **Centralized QueryClient Accessor**: Eliminates boilerplate and prevents errors
- **Spell Formatting Consolidation**: Separates presentation from data, reduces duplication
- **Source Formatting Consolidation**: Unified source book reference formatting with standardized format
- **Future Extensibility**: Enables growth and evolution

These decisions ensure that the system can evolve gracefully as new requirements emerge while maintaining clean separation of concerns and high code quality. The groupingId integration specifically addresses the complex feature scenarios that were problematic with the old entity type-based approach, providing content administrators with full control over feature grouping while maintaining the system's architectural integrity.

## Related Documentation

- **[README.md](./README.md)** - Architecture overview and navigation
- **[Final Implementation Summary](./final-implementation-summary.md)** - Current implementation status
- **[Refactoring Strategy](./refactoring-strategy.md)** - Design decisions and architecture rationale
- **[Usage Guidelines](./usage-guidelines.md)** - Development guidelines and patterns
- **[QueryClient Accessor](./queryclient-accessor.md)** - Centralized QueryClient access pattern
- **[Entity Precaching](./entity-precaching.md)** - Entity precaching system
- **[Class System](../class-system/README.md)** - Class system documentation
- **[Race System](../race-system/README.md)** - Race system documentation
- **[Feature System Overview](../README.md)** - Main feature system documentation
