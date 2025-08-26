# Feature System Pending Tasks

## Critical Missing

### ✅ **Unified Choice System Implementation - COMPLETED**
- **Database Schema**: ✅ Converted Prisma enums to static-data enums (`ChoiceType`, `ChoiceBehavior`)
- **Formula System**: ✅ Renamed `FeatureModifierFormulaParams` to `FeatureFormulaParams` and extended to support both `FeatureModifier` and `FeatureChoice`
- **New Fields**: ✅ Added `filterType` and `formulaParamsId` to `FeatureChoice` for filtered choice support
- **Schema Updates**: ✅ Updated Zod schemas to use new enum types and support formula params for choices
- **Backend Services**: ✅ Updated all backend services to handle formula params for choices and use new field names
- **Frontend Components**: ✅ Updated all UI components to use new enum values and support new fields
- **Code Quality**: ✅ Fixed all linting warnings and ensured type safety
- **Data Migration**: ✅ User manually migrated existing enum values and formula references
- **Core Class Modeling**: ✅ COMPLETED - Successfully modeled all core classes with unified choice system
  - **Fighter Bonus Feats**: ✅ Complete implementation using FeatureChoice with filterType and EVERY_N_LEVELS formula
  - **Wizard Bonus Feats**: ✅ Complete implementation using FeatureChoice with MetamagicOrItemCreation filter and EVERY_N_LEVELS formula
  - **Rogue Special Abilities**: ✅ Complete implementation using FeatureChoice with formula support
- **Display System**: ✅ Complete display logic for both ClassEdit.tsx (full progression patterns) and ClassDetail.tsx (individual level entries)
- **Formula Integration**: ✅ Seamless integration with EVERY_N_LEVELS formula for bonus feat progression
- **Legacy System Cleanup**: ✅ Removed deprecated `ModifierAppliesToType.Choice` system and cleaned up related code
- **Formatter System**: ✅ Enhanced formatters to handle both original and synthetic progression entries
- **UI Components**: ✅ Updated FeatureProgressionDetailEdit.tsx with proper choice formatter support

### ✅ **Direct Feat Grant Support - COMPLETED**
- **Database Schema**: ✅ Added `ModifierAppliesToType.Feat` enum value (21)
- **UI Implementation**: ✅ Added direct feat grant configuration to FeatureProgressionDetailEdit.tsx
- **Dynamic Feat Loading**: ✅ Implemented feat loading in both ClassDisplay and ClassEdit
- **Feat Data Enhancement**: ✅ Implemented modifier enhancement with feat data
- **Testing**: ✅ Tested with Ranger Track and Endurance features - proper feat name display

### 🔴 **Phase 5: Formatter System Refactoring - CRITICAL INTEGRATION FAILURE**
1. **6-Layer Clean Architecture**: ✅ Implemented complete new formatter system with orchestrator, registry, strategies, calculators, generators, and utilities
2. **Data Structure Updates**: ✅ Converted formula parameters to arrays and made condition values mandatory
3. **Component Migration**: ✅ All frontend components migrated from old system to new formatter orchestrator
4. **Old System Removal**: ✅ Completely removed old Formatters.ts and related files
5. **Integration Complete**: ❌ **FAILED** - Layers implemented but never connected, system shows "Level X (Level X)" instead of proper formatting
6. **Documentation**: ✅ Updated all documentation to reflect actual broken status

**CRITICAL ISSUE**: The formatter system displays "Level X (Level X)" for all features because the display strategies never use the pure formatters. The system generates raw numbers instead of properly formatted feature information.

**IMMEDIATE ACTION REQUIRED**: Fix layer integration in `display-strategies.ts` to connect pure formatters with display strategies.

### ✅ **Phase 6: Standalone Feature Creation UI - COMPLETED**
1. **Create Standalone Feature Creation UI**: ✅ File: `frontend/src/components/feature-system/FeatureEdit.tsx`
   - Allow creating features without class/race association ✅
   - Support for feature descriptions, prerequisites, and metadata ✅
   - Integration with existing feature system ✅
2. **Create Standalone FeatureProgression UI**: ✅ File: `frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx`
   - Allow creating FeatureProgression records without classId/raceId ✅
   - Reuse existing FeatureProgressionDetailEdit components ✅
   - Support for modifiers, choices, and effects ✅
3. **Add Feature Management Navigation**: ✅ File: `frontend/src/features/admin/features/feature-system/FeatureList.tsx`
   - List all standalone features ✅
   - Search and filter capabilities ✅
   - Link to feature editing ✅
4. **Update Backend Services**: ✅ File: `backend/src/features/feature/featureService.ts`
   - Support for standalone feature CRUD operations ✅
   - Support for standalone FeatureProgression CRUD operations ✅
   - Proper validation and error handling ✅
5. **Ranger Combat Style Implementation**: ✅ Create "Archery Combat Style" and "Two-Weapon Combat Style" features
6. **Test Standalone Feature System**: ✅ Verify features can be created and referenced by choices

### 🔴 **Phase 5.5: Fix Formatter System Integration - CRITICAL PRIORITY**
1. **Fix EditPageDisplayStrategy**: Connect pure formatters to display strategies in `display-strategies.ts`
2. **Fix DetailPageDisplayStrategy**: Same integration fixes for detail page formatting
3. **Fix CharacterSheetDisplayStrategy**: Same integration fixes for character sheet display
4. **Test with Real Data**: Load real feature data and verify proper formatting
5. **Validate Metadata Passing**: Ensure all modifier metadata reaches formatters correctly
6. **End-to-End Testing**: Test with Bard's Inspire Greatness, Fighter's Weapon Specialization, etc.

**CRITICAL**: This must be completed before any other feature work can proceed, as the formatter system is currently non-functional.

### 🟡 **Phase 7: Feature Resolution Service - FUTURE ENHANCEMENT**
1. **Runtime Feature Resolution**: Service to dynamically calculate which features apply to a character
2. **Equipment Integration**: Connect feature resolution to character inventory (e.g., Ring of Evasion)
3. **Conditional Evaluation**: Implement runtime condition checking (e.g., Trap Sense, Dwarven Giant Fighting)
4. **Performance Optimization**: Cache resolved features for performance
5. **Character Sheet Integration**: Display conditional bonuses (e.g., "AC: 15 (17 vs traps)")
6. **Backend Character Calculation**: Formula evaluation and feature resolution for character stats
7. **Feature Prerequisites Validation**: Enforcement logic for feature requirements

### 🟡 **Phase 8: Feature-Based Choice System - MEDIUM PRIORITY**
1. **Add FeatureModifierConditionType.feature**: Add new condition type (6)
2. **Create Standalone Features**: Create features for choice options (Archery Combat Style, Two-Weapon Combat Style, etc.)
3. **Update Choice UI**: Consolidate choice configuration and simplify choice entries
4. **Implement Feature Condition Evaluation**: Check if character has acquired specific features
5. **Ranger Combat Style Implementation**: Model Ranger combat style choices using the feature-based system
6. **Rogue Special Abilities Implementation**: Model Rogue special ability choices using the feature-based system
7. **Character Calculation Integration**: Include feature-based conditions in modifier calculations

### 🟡 **Phase 9: Language System - MEDIUM PRIORITY**
1. **Add ModifierAppliesToType.Language**: Add Language type to enum
2. **Create LanguageService**: Utility functions for language extraction and management
3. **Update RaceEdit.tsx**: Use FeatureModifier approach for languages
4. **Update FeatureProgressionDetailEdit.tsx**: Support language modifiers
5. **Test Race Language Features**: Verify automatic and bonus language creation
6. **Implement getClassBonusLanguages()**: Scan class features for bonus languages
7. **Update ClassService**: Support class-granted bonus languages
8. **Test Class Language Features**: Verify class language expansion works
9. **Character Creation Integration**: Combine racial and class bonus languages

### 🟡 **Phase 10: Companion System Implementation - MEDIUM PRIORITY**
1. **Design Companion Data Model**: Familiar and animal companion data structures
2. **Design Companion Progression System**: Level-based companion advancement
3. **Design Companion Choice System**: Companion selection and customization
4. **Design Companion Ability Scaling**: Companion abilities that scale with character level
5. **Implement Companion Schema**: Prisma models for companion data
6. **Implement Familiar System**: Choice, progression, and abilities for familiars
7. **Implement Animal Companion System**: Extension, progression, and abilities for animal companions
8. **Character Sheet Integration**: Display companion statistics and abilities
9. **Companion Management UI**: User interface for managing companion details

### 🟡 **Phase 11: Spellcasting Enhancements - MEDIUM PRIORITY**
1. **Design Domain System**: Choice, ability grants, and spell access for cleric domains
2. **Implement School Specialization**: Choice, benefits, and restrictions for wizard schools
3. **Implement Metamagic System**: Feat-based spell modification and cost calculation
4. **Domain System Implementation**: Cleric domain choice and ability grants
5. **School Specialization Implementation**: Wizard school benefits and restrictions
6. **Metamagic System Implementation**: Spell modification and cost calculation

### 🟢 **Phase 12: Formula Calculation Tooltips - LOW PRIORITY**
1. **UI Integration**: Add tooltip display to calculated values in character sheet
2. **Tooltip Generation**: Create functions to show formula breakdown and calculation steps
3. **Character Context**: Pass character data to tooltip functions for accurate calculations

## Current Implementation Status

### ✅ **COMPLETED: Core Infrastructure (100%)**
- **Database Schema**: All feature system models implemented and working
- **Formula System**: Complete implementation with 5 formula types tested
- **Class Modeling**: All core classes (Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin) successfully modeled
- **Unified Choice System**: Complete implementation with proper choice system integration
- **FeatureProgressionDetailEdit UI**: Complete with formula input, conditions, choices, and dynamic preview
- **Backend Services**: Complete API endpoints and services for feature CRUD operations
- **Direct Feat Grant Support**: Complete implementation with proper feat name display

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

## Implementation Priority Matrix

### 🔴 **CRITICAL PRIORITY (Must Complete First)**
1. **Fix Formatter System Integration**: Connect pure formatters to display strategies
2. **Test with Real Data**: Validate system works with actual feature data
3. **Fix Metadata Passing**: Ensure all modifier metadata reaches formatters

### 🟡 **HIGH PRIORITY (After Formatter Fix)**
1. **Feature Resolution Service**: Runtime feature calculation
2. **Character Integration**: Character sheet display of calculated values
3. **Feature Prerequisites Validation**: Enforcement logic for feature requirements

### 🟢 **MEDIUM PRIORITY (Future Enhancements)**
1. **Language System**: Complete language integration
2. **Companion System**: Familiar and animal companion implementation
3. **Spellcasting Enhancements**: Domain and school specialization systems
4. **Formula Calculation Tooltips**: UI enhancements for formula breakdown

## Critical Path Dependencies

### Formatter System Integration (Blocking All Other Work)
- **Dependency**: Must fix layer integration before any other feature work
- **Impact**: All feature display currently broken
- **Effort**: High - requires careful integration of 6 layers
- **Risk**: High - complex integration with multiple failure points

### Feature Resolution Service (Blocking Character Integration)
- **Dependency**: Must complete formatter system integration first
- **Impact**: Character sheet cannot display calculated values
- **Effort**: High - requires backend calculation service
- **Risk**: Medium - well-defined requirements

### Character Integration (Blocking Character Sheet)
- **Dependency**: Must complete feature resolution service first
- **Impact**: Character sheet displays raw values instead of calculated features
- **Effort**: Medium - primarily frontend integration
- **Risk**: Low - straightforward integration work

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
