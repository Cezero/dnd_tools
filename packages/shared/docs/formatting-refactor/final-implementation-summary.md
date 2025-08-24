# Formatter System Refactoring - Final Implementation Summary

## Executive Summary

This document provides the final implementation plan for refactoring the formatter system to achieve clean separation of concerns, proper name resolution, and support for future character sheet integration.

## Key Decisions Made

### 1. Data Structure Changes ✅ APPROVED

#### Formula Parameters (thresholds/values)
- **Change**: Convert from comma-separated strings to arrays in Zod schemas
- **Backend**: Transform between string/array in database layer only
- **Frontend**: Update `FeatureProgressionDetailEdit.tsx` to handle arrays
- **Benefits**: Better validation, clearer threshold/value pairing, easier manipulation

#### Condition Values
- **Change**: Make `FeatureModifierCondition.conditionValue` mandatory (not nullable)
- **Impact**: Simplifies conditional detection logic
- **Implementation**: Update database schema and Zod validation

### 2. Name Resolution Strategy ✅ APPROVED

#### Priority Order (3-tier system)
1. **Passed-in Names**: Use names provided in context (from calling component)
2. **Static Data Lookup**: Use `shared/static-data` package constants and maps
3. **ID Fallback**: Display ID with warning if name cannot be resolved

#### Formatter Responsibility
- **NO API Calls**: Formatter should never make API calls or handle caching
- **Caller Responsibility**: Caller must provide names or ensure static-data coverage
- **Future Strategy**: Increase static-data coverage or update callers to provide missing data

### 3. Architecture Design ✅ APPROVED

#### 6-Layer Clean Architecture
1. **Pure Formatters**: Format individual values (damage, healing, choices, etc.)
2. **Value Calculation**: Calculate formula values with breakdown
3. **Progression Generation**: Generate progression values for all levels
4. **Transition Detection**: Detect when values change
5. **Grouping Strategies**: Group by context (edit, detail, character sheet)
6. **Display Orchestration**: Coordinate all layers for final output

#### Display Context Requirements
- **xxxEdit Pages**: 1:1 relationship between `FeatureProgression` and display string
- **xxxDetail Pages**: Group by feature and level, never mix feature values
- **Character Sheet**: Context-specific, minimal grouping

## Implementation Phases

### Phase 1: Data Structure Updates
**Goal**: Update schemas and database layer to support new data structures

**Tasks**:
- [x] Update database schema to make `conditionValue` mandatory (not nullable) ✅ **COMPLETED**
- [ ] Update Zod schemas to use arrays for `thresholds` and `values`
- [ ] Update backend to transform between string/array in database layer
- [ ] Update `FeatureProgressionDetailEdit.tsx` to handle arrays
- [ ] Test data structure changes

**Deliverables**:
- Updated Zod schemas
- Updated backend transformation logic
- Updated frontend dialog
- Test coverage for data structure changes

### Phase 2: Core Infrastructure
**Goal**: Create the core infrastructure and data types

**Tasks**:
- [ ] Create base interfaces and types (`types.ts`)
- [ ] Implement pure formatters (`pure-formatters.ts`)
- [ ] Implement schema-based conditional value detector (`conditional-detector.ts`)
- [ ] Create context interfaces with name lookup tables

**Deliverables**:
- Core data types matching actual schema
- Pure formatters for all modifier types
- Choice formatters with name resolution
- Conditional value detection

### Phase 3: Value Calculation Layer
**Goal**: Implement value calculation with breakdown support

**Tasks**:
- [ ] Implement formula calculators for all formula types
- [ ] Implement choice-based calculators
- [ ] Implement conditional value calculations
- [ ] Create calculation result interfaces with breakdown

**Deliverables**:
- All formula types have pure calculators
- Choice-based calculations working
- Conditional value detection implemented
- Comprehensive unit tests

### Phase 4: Progression Generation and Transition Detection
**Goal**: Generate progressions and detect transitions

**Tasks**:
- [ ] Implement progression generators for all formula types
- [ ] Implement choice-based generators
- [ ] Implement transition detection
- [ ] Create transition point interfaces

**Deliverables**:
- All formula types have progression generators
- Choice-based generators implemented
- Transition detection working correctly
- Comprehensive unit tests

### Phase 5: Grouping and Display Strategies
**Goal**: Implement context-specific grouping and display

**Tasks**:
- [ ] Implement EditPageStrategy (1:1 relationship enforcement)
- [ ] Implement DetailPageStrategy (feature + level grouping)
- [ ] Implement CharacterSheetStrategy (context-aware display)
- [ ] Implement boundary validation

**Deliverables**:
- All display strategies implemented
- Boundary validation working
- Choice grouping with proper name resolution
- Comprehensive unit tests

### Phase 6: Integration and Error Handling
**Goal**: Integrate all layers and implement error handling

**Tasks**:
- [ ] Implement formatter orchestrator
- [ ] Implement error handling with fallbacks
- [ ] Implement legacy formatter adapter
- [ ] Performance optimization

**Deliverables**:
- Complete formatter pipeline
- Robust error handling
- Legacy compatibility
- Performance benchmarks

### Phase 7: Character Sheet Integration Framework
**Goal**: Design interfaces for future character sheet integration

**Tasks**:
- [ ] Define character sheet calculation input interfaces
- [ ] Implement choice-based calculation interfaces
- [ ] Create breakdown display components
- [ ] Design conditional display components

**Deliverables**:
- Character sheet integration interfaces
- Choice-based calculation framework
- Breakdown display components
- Future-ready architecture

## Critical Success Criteria

### Data Structure Requirements
- [ ] Formula parameters (thresholds/values) converted to arrays in Zod schemas
- [x] Condition values made mandatory (not nullable) ✅ **COMPLETED**
- [ ] Enum handling uses numeric IDs with z.nativeEnum() validation
- [ ] Size mapping uses static-data directly (no custom mapping needed)
- [ ] Frontend dialog updated to handle array-based formula parameters

### Name Resolution Requirements
- [ ] Priority 1: Use passed-in names from context
- [ ] Priority 2: Use static-data package constants and maps
- [ ] Priority 3: Display ID with warning if name cannot be resolved
- [ ] NO API calls from formatter - caller must provide names
- [ ] Console warnings when names cannot be resolved

### Display Requirements
- [ ] xxxEdit pages maintain 1:1 FeatureProgression to display string relationship
- [ ] xxxDetail pages group by feature and level, never mix feature values
- [ ] All displays use actual names/abbreviations, never IDs
- [ ] Choice formatting uses proper name resolution from static-data
- [ ] Conditional values display correctly with explanations

### Performance Requirements
- [ ] Formatter system handles 100+ progressions without performance issues
- [ ] Name resolution primarily uses static-data (no performance impact)
- [ ] No API calls from formatter - all name resolution from static-data or passed context
- [ ] Conditional detection doesn't impact performance

## Risk Mitigation

### Technical Risks
1. **Frontend Dialog Changes**: Array handling more complex than string input
   - **Mitigation**: Design intuitive UI for array manipulation
2. **Name Resolution Gaps**: Some names may not be available in static-data
   - **Mitigation**: Increase static-data coverage and update callers

### Timeline Risks
1. **Scope Creep**: Adding features beyond core formatter functionality
   - **Mitigation**: Strict adherence to phase boundaries
2. **Integration Complexity**: Coordinating changes across multiple layers
   - **Mitigation**: Comprehensive testing at each phase

## Future Considerations

### Character Sheet Integration
- Framework designed to evolve with character sheet development
- Interfaces ready for external calculation functions
- Breakdown display components for "show your work" functionality

### Performance Optimization
- Static-data lookups have no performance impact
- No API calls from formatter keeps performance predictable
- Caching can be added at caller level if needed

### Extensibility
- Clean architecture allows easy addition of new formula types
- Pure formatters can be extended for new modifier types
- Grouping strategies can be adapted for new display contexts

## Conclusion

This refactoring will create a clean, maintainable, and extensible formatter system that properly separates concerns, handles name resolution efficiently, and provides a solid foundation for future character sheet development. The phased approach ensures manageable implementation with clear deliverables and success criteria at each stage.
