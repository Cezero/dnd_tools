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
- **Testing and Validation**: ✅ All existing functionality continues to work correctly

### ✅ **Dice Configuration System Cleanup - COMPLETED**
- **Schema Alignment**: ✅ Updated `UserProfileSchema` to match Prisma database fields directly
- **Removed Transformation**: ✅ Eliminated `transformUserWithDiceConfig` functions from auth and userProfile services
- **Field Names**: ✅ Updated from nested `diceConfig.baseConfigId` to top-level `diceConfigBase`
- **Frontend Updates**: ✅ Updated ProfilePage and DiceBoxService to use new field names
- **Type Safety**: ✅ All TypeScript errors resolved, clean build achieved
- **API Consistency**: ✅ Backend and frontend now use consistent field names throughout
- **Simplified Architecture**: ✅ Eliminated unnecessary transformation layer, direct database-to-API mapping

### ✅ **Feature Migration to Unified Choice System - COMPLETED**
- **Migrate Fighter Bonus Feats**: ✅ Converted Fighter bonus feats from `FeatureModifier.type: Other, AppliesTo: Choice` to unified `FeatureChoice` system with formula support
- **Migrate Wizard Bonus Feats**: ✅ Converted Wizard bonus feats to use `filterType: MetamagicOrItemCreation` in unified choice system
- **Migrate Rogue Special Abilities**: ✅ Converted Rogue special abilities to use unified choice system with formula support
- **Update UI Components**: ✅ Ensured all migrated features display correctly in UI
- **Testing and Validation**: ✅ Verified all migrated features work as expected
- **Documentation**: ✅ Updated feature documentation to reflect new unified system

### ✅ **Schema Cleanup - COMPLETED**
- **Remove Redundant Fields**: ✅ Removed `FeatureProgression.appliesToType` and `appliesTo` fields from schema
- **Update Service Layer**: ✅ Removed `appliesToType` checks, use only `SpecialFeatureId` for filtering
- **Update UI Components**: ✅ Removed redundant field handling from forms and displays
- **Update Validation**: ✅ Removed `appliesToType`/`appliesTo` from Zod schemas
- **Database Migration**: ✅ Removed columns from FeatureProgression table
- **Testing**: ✅ Verified all existing features work correctly after cleanup

### ✅ **Direct Feat Grant Implementation - COMPLETED**
- **Add ModifierAppliesToType.Feat**: ✅ Added new enum value (21) for direct feat grants
- **UI Support**: ✅ Added feat selection dropdowns to FeatureProgressionDetailEdit.tsx
- **Feat Selection**: ✅ Added feat selection dropdown for direct feat grants (e.g., Ranger Track, Endurance)
- **Form Validation**: ✅ Updated validation to handle direct feat grant fields
- **UI Integration**: ✅ Updated ClassEdit.tsx and ClassDetail.tsx to display direct feat grants with proper feat names
- **Dynamic Feat Loading**: ✅ Both ClassDisplay and ClassEdit load feats when feat modifiers are detected
- **Feat Data Enhancement**: ✅ Modifiers are enhanced with feat data for proper display
- **Testing**: ✅ Tested with Ranger Track and Endurance features - now displays "Granted Feat: Endurance" instead of "Granted Feat (ID: 78)"

### ✅ **Favored Enemy Implementation - COMPLETED**
- **Add ChoiceType.CreatureType**: ✅ Added new choice type for creature type selection
- **Add Creature Type Definitions**: ✅ Added creature type enum and select list to static data
- **UI Support**: ✅ Added creature type selection to FeatureProgressionDetailEdit.tsx
- **Allocation System**: ✅ Leveraged existing ChoiceBehavior.Allocation for bonus distribution
- **Documentation**: ✅ Updated class-features.md with complete favored enemy implementation strategy
- **Simple Model**: ✅ FeatureProgression defines choices only, custom character sheet function handles calculations
- **Flexible Allocation**: ✅ Players can distribute +2 bonuses among favored enemies as they prefer
- **Class Display**: ✅ Updated formatters to show generic creature type choice labels ("Choose Creature Type", "Allocate Bonus")

### ✅ **Ranger Class Complete Implementation - COMPLETED**
- **Combat Style Features**: ✅ Created "Archery Combat Style" and "Two-Weapon Combat Style" as standalone features
- **Combat Style Choices**: ✅ Implemented ChoiceType.Feature with specific feature selection
- **Favored Enemy System**: ✅ Implemented complete favored enemy progression (levels 1, 5, 10, 15, 20)
- **Allocation Mechanics**: ✅ Used ChoiceBehavior.Allocation for +2 bonus distribution
- **Database Schema**: ✅ Updated Prisma schema with ChoiceType.CreatureType
- **Frontend Support**: ✅ Updated FeatureProgressionDetailEdit.tsx for creature type choices
- **Formatter System**: ✅ Updated formatters to display creature type choices properly
- **Documentation**: ✅ Complete implementation strategy documented in class-features.md

### ✅ **Weapon Familiarity System Implementation - COMPLETED**
- **New Special Effect Type**: ✅ Added `FeatureSpecialEffectType.WeaponFamiliarity` (7) to handle racial weapon familiarity
- **Schema Updates**: ✅ Updated `FeatureSpecialEffectType` enum and related schemas to support weapon familiarity
- **UI Enhancements**: ✅ Updated `FeatureProgressionDetailEdit.tsx` to show exotic weapon selection when WeaponFamiliarity is selected
- **Display Logic**: ✅ Updated formatters to show weapon familiarity effects (e.g., "treat dwarven waraxe as martial weapon")
- **Data Model**: ✅ Use `numericValue` field to store the `itemId` of the weapon that benefits from familiarity
- **Racial Features**: Ready for implementation - dwarf weapon familiarity (dwarven waraxe, dwarven urgrosh) and gnome weapon familiarity (gnome hooked hammer)
- **Runtime Logic**: Future character calculation system will treat familiar weapons as martial for proficiency purposes
- **Validation**: ✅ Ensure weapon familiarity only applies to exotic weapons

### 🔴 **Backend Response Validation Middleware (HIGH PRIORITY)**
- **Response Schema Validation**: Add response validation to `buildValidatedRouter` to validate all API responses before sending
- **Middleware Enhancement**: Extend `buildValidatedRouter` to accept and validate response schemas
- **Error Handling**: Ensure response validation failures result in 500 errors, not invalid data sent to frontend
- **Type Safety**: Enforce runtime validation of response data against Zod schemas
- **Architecture Fix**: Address current gap where backend sends raw database data without validation
- **Example Case**: Fix issue where `FeatureFormulaParams.thresholds` and `values` were sent as strings instead of arrays
- **Consistency**: Ensure all API endpoints validate responses before sending to frontend
- **Documentation**: Update backend patterns documentation to include response validation requirements

### 🔴 **Character Schema Cleanup (TODO)**
- **Duplicate Schema Issue**: Fix duplicate `CharacterIdParamSchema` and `CharacterIdParamSchema2` in `characterRoutes.ts` and `character.ts`
- **Schema Consolidation**: Consolidate parameter schemas to use consistent naming and structure
- **Route Parameter Standardization**: Ensure all character routes use consistent parameter validation
- **Code Quality**: Remove redundant schema definitions and improve maintainability

### 🔴 **Character Sheet System Enhancements (Future)**
- **Creature Type Selection UI**: Implement character editor interface for selecting specific creature types
- **Favored Enemy Allocation UI**: Create interface for distributing +2 bonuses among chosen creature types
- **Choice Persistence**: Store character's specific choices (which creature types, how bonuses allocated)
- **Bonus Calculation**: Implement custom character sheet function to calculate favored enemy bonuses
- **Reallocation Support**: Allow players to reallocate bonuses during level-up
- **Skill/Damage Application**: Apply favored enemy bonuses to Bluff, Listen, Sense Motive, Spot, Survival, and damage
- **Combat Style Application**: Apply chosen combat style features to character abilities
- **Choice History**: Track and display character's choice history for features
- **Validation**: Ensure choices are valid and within allowed parameters

### 🔴 **Druid Animal Companion System**
- **Monster/NPC Feature System**: Implement monster and NPC feature system as dependency
- **Animal Companion Feature**: Create feature for animal companion with level-based progression
- **Companion Statistics**: Implement companion HP, BAB, saves, and skill progression
- **Companion Abilities**: Implement special abilities like Link, Share Spells, etc.
- **Character Sheet Integration**: Display companion statistics on character sheet
- **Companion Management**: UI for managing companion details and abilities
- **Note**: Paladin Special Mount feature also depends on this system

### ✅ **RaceEdit Tab System Refactoring - COMPLETED**
- **Previous State**: Monolithic RaceEdit component (806 lines) with basic feature display
- **Current State**: Tab-based layout matching ClassEdit architecture with enhanced feature management
- **Feature System Integration**: ✅ Correctly uses SpecialFeatureId.AbilityAdjustment, SpecialFeatureId.AutomaticLanguage, and SpecialFeatureId.BonusLanguage
- **Implementation Completed**:
  1. ✅ **Created Shared FeaturesTab Component**: Moved ClassEdit FeaturesTab to shared location and made it configurable
  2. ✅ **Created Race Tab Infrastructure**: Implemented tab components (BasicInfoTab, AbilitiesTab, LanguagesTab, FeaturesTab, DescriptionTab)
  3. ✅ **Converted RaceEdit to Tab-Based Layout**: Refactored RaceEdit.tsx to use tab navigation
  4. ✅ **Feature System Integration**: No changes needed - abilities and languages already use feature system correctly
- **Benefits Achieved**: ✅ Consistent UX between Class and Race editing, code reuse, feature parity, better maintainability
- **Success Criteria Met**: ✅ Race editing has same capabilities as Class editing, identical navigation patterns, all existing data works unchanged

### 🔴 **Language System Implementation**
- **Add ModifierAppliesToType.Language**: Add Language type to modifier applies to enum
- **Create LanguageService**: Utility functions for extracting languages from feature progressions
- **Update RaceEdit.tsx**: Use FeatureModifier approach for languages instead of current implementation
- **Update FeatureProgressionDetailEdit.tsx**: Add support for ModifierAppliesToType.Language
- **Implement getClassBonusLanguages()**: Scan class features for bonus languages via appliesIfChoiceKey
- **Character Creation UI**: Language selection interface in character creation flow
- **Language Condition Evaluation**: INT modifier condition handling for bonus languages

### 🔴 **Feature-Linked Skill Analogs Implementation**
- **Add isAnalog Field to Skill Model**: Add `isAnalog` boolean field to distinguish feature-linked skills from custom skills
- **Create Wild Empathy Skill and Feature**: Implement Wild Empathy as feature-linked skill analog
- **Extend Character Sheet Display**: Display analog skills with calculated values
- **Implement Analog Skill Calculation**: Calculate analog skill values based on class levels and ability scores
- **Prevent Skill Allocation**: Ensure analog skills cannot be allocated skill points
- **Support Multiclass Characters**: Handle analog skills for characters with multiple classes
- **Backend Character Calculation**: Include analog skills in character calculation service

## Implementation Phases

### **Phase 1: Choice System Unification** ✅ **COMPLETED**
1. **Schema Updates**: ✅ Converted Prisma enums to static-data enums and added new fields
2. **Data Migration**: ✅ User manually migrated existing enum values and formula references
3. **Backend Services**: ✅ Updated all services to handle formula params for choices and use new field names
4. **Frontend Components**: ✅ Updated all UI components to use new enum values and support new fields
5. **Testing and Validation**: ✅ All existing functionality continues to work correctly

### **Phase 2: Feature Migration to Unified Choice System** 🔴 **HIGHEST PRIORITY**
1. **Fighter Bonus Feats**: Migrate from `FeatureModifier.type: Other, AppliesTo: Choice` to unified `FeatureChoice` system
2. **Wizard Bonus Feats**: Migrate to use `filterType: MetamagicOrItemCreation` in unified choice system
3. **Rogue Special Abilities**: Migrate to use unified choice system with formula support
4. **UI Updates**: Ensure all migrated features display correctly
5. **Testing and Validation**: Verify all migrated features work as expected

### **Phase 3: Schema Cleanup** ✅ **COMPLETED**
1. **Database Migration**: ✅ Removed `appliesToType` and `appliesTo` columns from FeatureProgression
2. **Service Layer Updates**: ✅ Updated ClassSkillService, LanguageService to use only SpecialFeatureId
3. **UI Component Updates**: ✅ Removed redundant field handling from all forms
4. **Validation Updates**: ✅ Removed fields from Zod schemas
5. **Testing**: ✅ Comprehensive testing of all existing features

### **Phase 4: Direct Feat Grant Support** ✅ **COMPLETED**
1. **Add ModifierAppliesToType.Feat**: ✅ Added new enum value (21)
2. **Update UI**: ✅ Added direct feat grant configuration to FeatureProgressionDetailEdit.tsx
3. **Dynamic Feat Loading**: ✅ Implemented feat loading in both ClassDisplay and ClassEdit
4. **Feat Data Enhancement**: ✅ Implemented modifier enhancement with feat data
5. **Testing**: ✅ Tested with Ranger Track and Endurance features - proper feat name display

### **Phase 5: Formatter System Refactoring** ✅ **COMPLETED**
1. **File Extraction**: ✅ Extracted monolithic Formatters.ts into focused modules
2. **Utility Functions**: ✅ Created formatterUtils.ts, formulaUtils.ts, wildShapeUtils.ts, formatterFactories.ts
3. **Clean Architecture**: ✅ Functions now import dependencies directly instead of receiving them as parameters
4. **Documentation**: ✅ Created comprehensive formatter-utilities.md documentation
5. **Code Reduction**: ✅ Reduced Formatters.ts from 1100+ lines to ~810 lines (~27% reduction)
6. **Improved Maintainability**: ✅ Better separation of concerns and easier testing

### **Phase 6: Standalone Feature Creation UI** ✅ **COMPLETED**
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

### **Phase 7: Feature Resolution Service** 🟡 **FUTURE ENHANCEMENT**
1. **Runtime Feature Resolution**: Service to dynamically calculate which features apply to a character
2. **Equipment Integration**: Connect feature resolution to character inventory (e.g., Ring of Evasion)
3. **Conditional Evaluation**: Implement runtime condition checking (e.g., Trap Sense, Dwarven Giant Fighting)
4. **Performance Optimization**: Cache resolved features for performance
5. **Character Sheet Integration**: Display conditional bonuses (e.g., "AC: 15 (17 vs traps)")
6. **Backend Character Calculation**: Formula evaluation and feature resolution for character stats
7. **Feature Prerequisites Validation**: Enforcement logic for feature requirements

### **Phase 8: Feature-Based Choice System** 🟡 **MEDIUM PRIORITY**
1. **Add FeatureModifierConditionType.feature**: Add new condition type (6)
2. **Create Standalone Features**: Create features for choice options (Archery Combat Style, Two-Weapon Combat Style, etc.)
3. **Update Choice UI**: Consolidate choice configuration and simplify choice entries
4. **Implement Feature Condition Evaluation**: Check if character has acquired specific features
5. **Ranger Combat Style Implementation**: Model Ranger combat style choices using the feature-based system
6. **Rogue Special Abilities Implementation**: Model Rogue special ability choices using the feature-based system
7. **Character Calculation Integration**: Include feature-based conditions in modifier calculations

### **Phase 9: Language System** 🟡 **MEDIUM PRIORITY**
1. **Add ModifierAppliesToType.Language**: Add Language type to enum
2. **Create LanguageService**: Utility functions for language extraction and management
3. **Update RaceEdit.tsx**: Use FeatureModifier approach for languages
4. **Update FeatureProgressionDetailEdit.tsx**: Support language modifiers
5. **Test Race Language Features**: Verify automatic and bonus language creation
6. **Implement getClassBonusLanguages()**: Scan class features for bonus languages
7. **Update ClassService**: Support class-granted bonus languages
8. **Test Class Language Features**: Verify class language expansion works
9. **Character Creation Integration**: Combine racial and class bonus languages

### **Phase 10: Companion System Implementation** 🟡 **MEDIUM PRIORITY**
1. **Design Companion Data Model**: Familiar and animal companion data structures
2. **Design Companion Progression System**: Level-based companion advancement
3. **Design Companion Choice System**: Companion selection and customization
4. **Design Companion Ability Scaling**: Companion abilities that scale with character level
5. **Implement Companion Schema**: Prisma models for companion data
6. **Implement Familiar System**: Choice, progression, and abilities for familiars
7. **Implement Animal Companion System**: Extension, progression, and abilities for animal companions
8. **Character Sheet Integration**: Display companion statistics and abilities
9. **Companion Management UI**: User interface for managing companion details

### **Phase 11: Spellcasting Enhancements** 🟡 **MEDIUM PRIORITY**
1. **Design Domain System**: Choice, ability grants, and spell access for cleric domains
2. **Implement School Specialization**: Choice, benefits, and restrictions for wizard schools
3. **Implement Metamagic System**: Feat-based spell modification and cost calculation
4. **Domain System Implementation**: Cleric domain choice and ability grants
5. **School Specialization Implementation**: Wizard school benefits and restrictions
6. **Metamagic System Implementation**: Spell modification and cost calculation

### **Phase 12: Formula Calculation Tooltips** 🟢 **LOW PRIORITY**
1. **UI Integration**: Add tooltip display to calculated values in character sheet
2. **Tooltip Generation**: Create functions to show formula breakdown and calculation steps
3. **Character Context**: Pass character data to tooltip functions for accurate calculations
4. **Formula Display**: Show progression patterns and level-specific values
5. **Attribute-Dependent Formulas**: Display attribute modifiers and calculations
6. **Conditional Formulas**: Show condition evaluation and impact on values

### **Phase 13: Backend Character Calculation** 🟢 **LOW PRIORITY**
1. **Feature Resolution Service**: Service to resolve all features for a character
2. **Modifier Calculation**: Calculate all modifiers with formulas and conditions
3. **Choice Processing**: Process character choices and apply conditional modifiers
4. **Feature Prerequisites**: Validate feature prerequisites and availability
5. **Character Sheet Data**: Generate complete character sheet data from features
6. **Performance Optimization**: Optimize calculation performance for complex characters

## Completed Components

### ✅ **Monk Class Features**
- **Flurry of Blows**: Conditional scaling with negative values and complex progression
- **Unarmed Strike**: Size-based damage with multiple size conditions and damage dice
- **Diamond Soul**: Value plus level formula for spell resistance
- **Wholeness of Body**: Level times value formula for healing
- **Bonus Feats**: Choice system with level-specific feat options
- **Complete Implementation**: All major Monk features modeled and tested

### ✅ **Paladin Class Features**
- **Divine Grace**: Attribute modifier formula for saving throws
- **Lay on Hands**: Level times attribute formula for healing
- **Turn Undead**: Attribute based formula for uses per day
- **Smite Evil**: Attribute modifier formula for attack bonuses
- **Divine Health**: No progression (static feature)
- **Special Mount**: Noted as dependent on monster/NPC implementation
- **Complete Implementation**: All major Paladin features modeled and tested

### ✅ **Formula System**
- **Conditional Scaling**: Level-based thresholds with corresponding values
- **Linear Scaling**: Scales based on levels since feature started
- **Level Times Value**: Scales by total character level
- **Value Plus Level**: Fixed value plus character level
- **Attribute-Dependent**: Based on character ability scores
- **Formula Parameters**: Comprehensive parameter system for all formula types
- **Formula Calculator**: Frontend utility for calculating modifier values
- **Formula Preview**: UI display of formula progression patterns

### ✅ **Condition System**
- **Feature Modifier Conditions**: Conditions that affect modifier application
- **Condition Types**: Trigger, attack type, character size, and other conditions
- **Condition Evaluation**: Runtime evaluation of conditions during character calculation
- **Size-Based Conditions**: Character size conditions for damage and other effects
- **Condition UI**: User interface for configuring conditions in feature editor

### ✅ **Choice System Foundation**
- **FeatureChoice Model**: Database model for defining player choices
- **CharacterFeatureChoice Model**: Database model for storing player choices
- **Choice Types**: Feat and Feature choice types
- **Choice Behaviors**: Single, Multiple, and Allocation choice behaviors
- **Choice UI**: User interface for configuring choices in feature editor
- **Choice Display**: Display of available choices in character sheet

### ✅ **Special Effects System**
- **FeatureSpecialEffect Model**: Database model for non-numeric abilities
- **Effect Types**: Proficiency, Favored Enemy, Turn Undead, Wild Shape, and other effects
- **Effect UI**: User interface for configuring special effects
- **Effect Display**: Display of special effects in character sheet

### ✅ **Class Skills System**
- **SpecialFeatureId.ClassSkill**: Reserved feature ID for class skills
- **ClassSkillService**: Service for managing class skills
- **Class Skills UI**: User interface for adding/removing class skills
- **Class Skills Display**: Display of class skills in character sheet
- **Container Pattern**: Single progression containing multiple skill modifiers

### ✅ **Weapon/Armor Proficiencies System**
- **SpecialFeatureId.ClassProficiency**: Reserved feature ID for class proficiencies
- **ClassProficiencyService**: Service for managing class proficiencies
- **Proficiency UI**: User interface for adding/removing proficiencies
- **Proficiency Display**: Display of proficiencies in character sheet
- **Special Effects Pattern**: Uses FeatureSpecialEffect for proficiency grants

## Testing Status

### ✅ **Tested Formula Types**
- **Conditional Scaling**: Monk Flurry of Blows (attack penalty and extra attacks)
- **Linear Scaling**: Monk Unarmed Strike damage progression
- **Level Times Value**: Monk Wholeness of Body healing
- **Value Plus Level**: Monk Diamond Soul spell resistance
- **Attribute-Dependent**: Paladin Divine Grace (saving throws), Lay on Hands (healing), Turn Undead (uses)

### ❌ **Untested Formula Types**
- **DICE_SCALING**: Not yet implemented or tested
- **Complex Attribute Formulas**: Advanced attribute-dependent calculations

### ✅ **Tested Condition Types**
- **Character Size**: Monk Unarmed Strike size-based damage
- **Trigger Conditions**: Basic trigger condition evaluation
- **Attack Type**: Basic attack type condition evaluation

### ❌ **Untested Condition Types**
- **Feature Conditions**: FeatureModifierConditionType.feature (not yet implemented)
- **Complex Condition Combinations**: Multiple conditions on single modifier

### ✅ **Tested Choice Types**
- **Feat Choices**: Monk bonus feats with specific feat options ✅
- **Feature Choices**: Ranger Combat Style with ChoiceType.Feature ✅
- **Creature Type Choices**: Ranger Favored Enemy with ChoiceType.CreatureType ✅
- **Single Choice Behavior**: Basic single choice functionality ✅
- **Allocation Choice Behavior**: Ranger Favored Enemy +2 bonus allocation ✅
- **Choice Display**: Display of available choices in UI ✅

### ❌ **Untested Choice Types**
- **Multiple Choice Behavior**: Multiple choice functionality (not yet implemented)

## Schema Simplification Benefits

### **1. Reduced Complexity**
- **Fewer fields** to maintain and validate
- **Clearer intent** with `SpecialFeatureId` as primary identifier
- **Simplified service logic** with single field filtering

### **2. Improved Consistency**
- **Uniform patterns** across all feature types
- **No redundant checks** in service layer
- **Cleaner UI** with fewer configuration options

### **3. Better Maintainability**
- **Single source of truth** for feature type identification
- **Easier to extend** with new feature types
- **Reduced documentation** complexity

This updated task list reflects the choice system unification priority and the planned refactoring to eliminate dual choice mechanisms.
