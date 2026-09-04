# D&D 3.5 Character System Development Roadmap

*High-level project overview for AI agents. Detailed implementation tasks are tracked in the Cursor TODO system.*

## Project Goal
**D&D 3.5 Character Generation and Management System** - Complete character creation with printable character sheet for between-session use.

## Current Status
**Phase**: Formatter System Integration Issues
**Progress**: ~75% complete

## Key Deliverables
- ✅ Basic character creation workflow
- ✅ Class/race management with feature association
- ✅ Feature system data structures and UI
- ✅ Formula definitions library
- ✅ **Unified Choice System Complete** - All core classes modeled with proper choice system integration
- ✅ **Direct Feat Grant Support Complete** - Proper feat name display across all components
- ✅ **Standalone Feature Creation UI Complete** - Features can be created without class/race association
- ⚠️ **Formatter System Partially Complete** - All layers implemented but not properly connected
- ❌ **Critical Integration Issues** - Display strategies not using pure formatters, system shows raw numbers
- ⏳ Formula integration (CRITICAL GAP)
- ⏳ Feature resolution service (CRITICAL GAP)
- ⏳ Character sheet generation and export
- ⏳ Character level-up workflow with feature integration
- ⏳ D&D 3.5 rule validation

## Current Focus
**Task**: Fix formatter system integration issues
**Status**: All 6 layers implemented but not connected, system shows "Level X (Level X)" instead of proper formatting
**Next**: Connect pure formatters to display strategies in display-strategies.ts

## Formula System Architecture

### Where Formulas Live
- **Formula Definitions**: `shared/static-data/src/FormulaDefinitions.ts`
- **Formula Functions**: `calculateFormula()`, `getDefaultParameters()`, `previewFormula()`
- **Formula Categories**: Simple, Medium, Complex formulas with D&D 3.5 patterns
- **Formula Parameters**: Level-based, ability score, and context variables

### Hybrid Evaluation Approach
- **Frontend Calculation**: For class/race editing (maintains current UX)
- **Backend Calculation**: For character sheets (secure, consistent)
- **Shared Logic**: Same formula definitions used in both contexts

## Development Phases

### Phase 1: Formula Integration ⚠️ **PARTIALLY COMPLETE**
1. **Frontend Formula Integration**
   - ✅ Connect formulaId to formula definitions in UI
   - ✅ Implement formula parameter handling
   - ✅ Add formula preview functionality
   - ❌ **CRITICAL ISSUE**: Display strategies not using pure formatters
2. **Backend Formula Integration**
   - ✅ Add formula calculation service
   - ✅ Implement formula parameter validation
   - ✅ Add formula-based feature resolution
   - ❌ **CRITICAL ISSUE**: Not connected to frontend formatter system

### Phase 2: Feature Resolution Service ❌ **NOT STARTED**
1. **Runtime Feature Calculation**
   - Create service to calculate which features apply to character
   - Implement formula evaluation with character context
   - Add conditional feature evaluation
2. **Character Integration**
   - Connect feature resolution to character stats
   - Implement feature prerequisite validation
   - Add feature-based choice processing

### Phase 3: Character Sheet Integration ❌ **NOT STARTED**
1. **Character Sheet Display**
   - Display calculated feature values
   - Show feature progression patterns
   - Implement feature breakdown display
2. **Character Export**
   - Generate printable character sheet
   - Export character data for external tools
   - Add character backup/restore functionality

### Phase 4: Advanced Features ❌ **NOT STARTED**
1. **Equipment Integration**
   - Connect features to character inventory
   - Implement equipment-based feature activation
   - Add magic item feature integration
2. **Companion System**
   - Implement familiar and animal companion features
   - Add companion progression and abilities
   - Integrate companion management UI

## Current Implementation Status

### ✅ **COMPLETED: Core Infrastructure (100%)**
- **Database Schema**: All feature system models implemented and working
- **Formula System**: Complete implementation with 5 formula types tested
- **Class Modeling**: All core classes (Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin) successfully modeled
- **Unified Choice System**: Complete implementation with proper choice system integration
- **FeatureProgressionDetailEdit UI**: Complete with formula input, conditions, choices, and dynamic preview
- **Backend Services**: Complete API endpoints and services for feature CRUD operations
- **Direct Feat Grant Support**: Complete implementation with proper feat name display
- **Standalone Feature Creation UI**: Complete implementation for creating features without class/race association

### ⚠️ **PARTIALLY IMPLEMENTED: Formatter System (80%)**
- **6-Layer Architecture**: All layers implemented but not properly connected
- **Pure Formatters**: Complete implementation for all modifier types
- **Formatter Registry**: Complete with all formatters registered
- **Display Strategies**: Complete implementation but not using pure formatters
- **Formatter Orchestrator**: Complete but not properly integrating layers
- **Critical Issue**: Display strategies generate raw numbers instead of properly formatted output

### ❌ **MISSING: Critical Integration Components (20%)**
- **Layer Integration**: Display strategies not connected to pure formatters
- **Metadata Passing**: Modifier metadata not reaching formatters
- **End-to-End Testing**: System not tested with real feature data
- **Character Integration**: No runtime feature calculation or character sheet integration
- **Feature Resolution Service**: No dynamic feature application to character stats

## Critical Issues

### 🔴 **CRITICAL: Formatter System Integration Failure**
**Issue**: Display strategies not using pure formatters, system shows raw numbers instead of formatted output
**Impact**: All feature display currently broken, shows "Level X (Level X)" instead of proper formatting
**Effort**: High - requires careful integration of 6 layers
**Priority**: HIGHEST - blocks all other feature work

### 🟡 **HIGH: Feature Resolution Service Missing**
**Issue**: No runtime feature calculation or character sheet integration
**Impact**: Character sheet cannot display calculated values
**Effort**: High - requires backend calculation service
**Priority**: HIGH - depends on formatter system integration

### 🟢 **MEDIUM: Character Integration Missing**
**Issue**: No character sheet display of calculated feature values
**Impact**: Character sheet displays raw values instead of calculated features
**Effort**: Medium - primarily frontend integration
**Priority**: MEDIUM - depends on feature resolution service

## Success Criteria

### Formatter System Integration
- [ ] Display strategies use pure formatters for all value formatting
- [ ] Modifier metadata properly passed to formatters
- [ ] System produces properly formatted output (e.g., "Dmg: +1d6" not "1")
- [ ] Integration tested with real feature data
- [ ] No "Level X (Level X)" display issues

### Character Integration
- [ ] Backend character calculation service implemented
- [ ] Feature resolution service implemented
- [ ] Character sheet displays calculated values
- [ ] Feature prerequisites validation working
- [ ] End-to-end testing with real character data

### Performance and Quality
- [ ] System handles 100+ progressions without performance issues
- [ ] All formatter types properly tested
- [ ] No console errors or warnings
- [ ] Comprehensive unit tests for all components
- [ ] Documentation matches actual implementation status

## Risk Assessment

### High Risk Items
1. **Formatter System Integration**: Complex 6-layer integration with multiple failure points
2. **Feature Resolution Service**: Backend calculation service with performance implications
3. **Character Integration**: End-to-end testing with real character data

### Medium Risk Items
1. **Language System**: Schema changes and data migration
2. **Companion System**: Complex data model with progression system
3. **Spellcasting Enhancements**: Domain and school specialization logic

### Low Risk Items
1. **Formula Calculation Tooltips**: UI enhancements only
2. **Documentation Updates**: No functional changes
3. **Code Cleanup**: Refactoring and optimization

## Next Steps

### Immediate (Next 1-2 weeks)
1. **Fix Formatter System Integration**: Connect pure formatters to display strategies
2. **Test with Real Data**: Validate system works with actual feature data
3. **Fix Metadata Passing**: Ensure all modifier metadata reaches formatters

### Short Term (Next 1-2 months)
1. **Feature Resolution Service**: Runtime feature calculation
2. **Character Integration**: Character sheet display of calculated values
3. **Feature Prerequisites Validation**: Enforcement logic for feature requirements

### Long Term (Next 3-6 months)
1. **Language System**: Complete language integration
2. **Companion System**: Familiar and animal companion implementation
3. **Spellcasting Enhancements**: Domain and school specialization systems
4. **Formula Calculation Tooltips**: UI enhancements for formula breakdown

## Conclusion

The project has made significant progress with **75% of core infrastructure complete**. The **formatter system refactoring** has implemented all 6 layers but has **critical integration issues** that must be resolved before any other feature work can proceed.

The immediate priority is to **fix the formatter system integration** to connect pure formatters with display strategies. Once this is resolved, the system will be ready for character integration and feature resolution service implementation.

The foundation is solid - only the final integration step remains to complete the core feature system and enable character sheet functionality.
