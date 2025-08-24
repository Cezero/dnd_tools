# Feature System Roadmap

## Overview

This roadmap outlines the development plan for the D&D 3.5 feature system, including completed components, critical missing features, and implementation phases.

## Completed Components

### ✅ **Barbarian Class Features**
- **Rage**: Attribute bonuses with trigger conditions
- **Uncanny Dodge**: Special abilities with level-based progression
- **Damage Reduction**: Level-based damage reduction progression
- **Complete Implementation**: All major Barbarian features modeled and tested

### ✅ **Bard Class Features**
- **Bardic Music**: Uses per day with level-based progression
- **Bardic Knowledge**: Special ability with level-based bonuses
- **Complete Implementation**: All major Bard features modeled and tested

### ✅ **Cleric Class Features**
- **Turn Undead**: Uses per day with attribute-based progression
- **Domain Abilities**: Special abilities granted by domains
- **Complete Implementation**: All major Cleric features modeled and tested

### ✅ **Druid Class Features**
- **Wild Empathy**: Feature-linked skill analog with level + CHA formula
- **Wild Shape**: Special abilities with level-based progression
- **Nature Sense**: Special abilities and skill bonuses
- **Complete Implementation**: All major Druid features modeled and tested (except Animal Companion)

### ✅ **Fighter Class Features**
- **Bonus Feats**: Choice system with filtered feat options
- **Weapon Specialization**: Attack and damage bonuses
- **Complete Implementation**: All major Fighter features modeled and tested

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

## Critical Missing Components

### ✅ **Schema Cleanup - COMPLETED**
- **Remove Redundant Fields**: ✅ Removed `FeatureProgression.appliesToType` and `appliesTo` fields
- **Update Service Layer**: ✅ Use only `SpecialFeatureId` for filtering
- **Update UI Components**: ✅ Remove redundant field handling
- **Database Migration**: ✅ Removed columns from FeatureProgression table
- **Testing**: ✅ Verified all existing features work correctly after cleanup

### ✅ **Direct Feat Grant Support - COMPLETED**
- **Add ModifierAppliesToType.Feat**: ✅ Added new enum value (21) for direct feat grants
- **UI Implementation**: ✅ Added feat selection dropdowns to FeatureProgressionDetailEdit.tsx
- **Feat Selection**: ✅ Added feat selection dropdown for direct feat grants (e.g., Ranger Track, Endurance)
- **Form Validation**: ✅ Updated validation to handle direct feat grant fields
- **UI Integration**: ✅ Updated ClassEdit.tsx and ClassDetail.tsx to display direct feat grants with proper feat names
- **Dynamic Feat Loading**: ✅ Both ClassDisplay and ClassEdit load feats when feat modifiers are detected
- **Feat Data Enhancement**: ✅ Modifiers are enhanced with feat data for proper display
- **Testing**: ✅ Tested with Ranger Track and Endurance features - now displays "Granted Feat: Endurance" instead of "Granted Feat (ID: 78)"

### 🔴 **Language System**
- **ModifierAppliesToType.Language**: Add Language type to modifier applies to enum
- **LanguageService**: Utility functions for extracting languages from feature progressions
- **Race Language UI**: Update RaceEdit to use FeatureModifier approach for languages
- **Class Language Features**: Support for class-granted bonus languages via appliesIfChoiceKey
- **Character Creation UI**: Language selection interface in character creation flow
- **Language Condition Evaluation**: INT modifier condition handling for bonus languages

### 🔴 **Formula Calculation Tooltips**
- **UI Integration**: Show calculation work in tooltips for attribute-dependent formulas
- **Tooltip Generation**: Create functions to show formula breakdown and calculation steps
- **Character Context**: Pass character data to tooltip functions for accurate calculations
- **Formula Display**: Show progression patterns and level-specific values
- **Attribute-Dependent Formulas**: Display attribute modifiers and calculations
- **Conditional Formulas**: Show condition evaluation and impact on values

### 🔴 **Feature-Based Choice System**
- **Add FeatureModifierConditionType.feature**: Add new condition type for checking if character has specific features
- **Create Standalone Features**: Create features for choice options (Archery Combat Style, Two-Weapon Combat Style, etc.)
- **Update Choice UI**: Consolidate choice configuration and simplify choice entries
- **Implement Feature Condition Evaluation**: Check if character has acquired specific features
- **Ranger Combat Style Implementation**: Model Ranger combat style choices using the feature-based system
- **Rogue Special Abilities Implementation**: Model Rogue special ability choices using the feature-based system
- **Character Calculation Integration**: Include feature-based conditions in modifier calculations

### 🔴 **Backend Character Calculation**
- **Feature Resolution Service**: Service to resolve all features for a character
- **Modifier Calculation**: Calculate all modifiers with formulas and conditions
- **Choice Processing**: Process character choices and apply conditional modifiers
- **Feature Prerequisites**: Validate feature prerequisites and availability
- **Character Sheet Data**: Generate complete character sheet data from features
- **Performance Optimization**: Optimize calculation performance for complex characters

### 🔴 **Companion System**
- **Monster/NPC Feature System**: Implement monster and NPC feature system as dependency
- **Animal Companion Feature**: Create feature for animal companion with level-based progression
- **Companion Statistics**: Implement companion HP, BAB, saves, and skill progression
- **Companion Abilities**: Implement special abilities like Link, Share Spells, etc.
- **Character Sheet Integration**: Display companion statistics on character sheet
- **Companion Management**: UI for managing companion details and abilities
- **Note**: Paladin Special Mount feature also depends on this system

## Implementation Phases

### **Phase 1: Schema Cleanup** 🔴 **HIGH PRIORITY**
1. **Remove `appliesToType` and `appliesTo`** from `FeatureProgression` schema
2. **Update service layer** to use only `SpecialFeatureId` for filtering
3. **Update UI components** to remove redundant field handling
4. **Update documentation** to reflect simplified schema
5. **Database migration** to remove redundant columns
6. **Comprehensive testing** of all existing features

### **Phase 2: Direct Feat Grant Support** 🔴 **HIGH PRIORITY**
1. **Add `ModifierAppliesToType.Feat`** to enum
2. **Update UI** for direct feat grant configuration
3. **Implement character system** integration for granted feats
4. **Test with Ranger Track and Endurance**

### **Phase 3: Language System** 🟡 **MEDIUM PRIORITY**
1. **Add `ModifierAppliesToType.Language`** to enum
2. **Create `LanguageService`** for extraction and management
3. **Update race/class UI** for language configuration
4. **Implement character creation** language selection
5. **Test automatic and bonus language** creation and selection

### **Phase 4: Feature-Based Choice System** 🟡 **MEDIUM PRIORITY**
1. **Add `FeatureModifierConditionType.feature`** to enum
2. **Create standalone features** for choice options
3. **Update choice UI** to use feature-based conditions
4. **Implement Ranger Combat Style** using new system
5. **Implement Rogue Special Abilities** using new system

### **Phase 5: Formula Tooltips** 🟡 **MEDIUM PRIORITY**
1. **UI Integration** - Add tooltip display to calculated values
2. **Tooltip Generation** - Create functions to show formula breakdown
3. **Character Context** - Pass character data to tooltip functions
4. **Formula Display** - Show progression patterns and level-specific values
5. **Attribute-Dependent Formulas** - Display attribute modifiers and calculations

### **Phase 6: Backend Character Calculation** 🟡 **MEDIUM PRIORITY**
1. **Feature Resolution Service** - Service to resolve all features for a character
2. **Modifier Calculation** - Calculate all modifiers with formulas and conditions
3. **Choice Processing** - Process character choices and apply conditional modifiers
4. **Feature Prerequisites** - Validate feature prerequisites and availability
5. **Character Sheet Data** - Generate complete character sheet data from features

### **Phase 7: Companion System** 🟡 **MEDIUM PRIORITY**
1. **Design Companion Data Model** - Familiar and animal companion data structures
2. **Design Companion Progression System** - Level-based companion advancement
3. **Design Companion Choice System** - Companion selection and customization
4. **Design Companion Ability Scaling** - Companion abilities that scale with character level
5. **Implement Companion Schema** - Prisma models for companion data
6. **Implement Familiar System** - Choice, progression, and abilities for familiars
7. **Implement Animal Companion System** - Extension, progression, and abilities for animal companions

### **Phase 8: Spellcasting Enhancements** 🟢 **LOW PRIORITY**
1. **Design Domain System** - Choice, ability grants, and spell access for cleric domains
2. **Implement School Specialization** - Choice, benefits, and restrictions for wizard schools
3. **Implement Metamagic System** - Feat-based spell modification and cost calculation
4. **Domain System Implementation** - Cleric domain choice and ability grants
5. **School Specialization Implementation** - Wizard school benefits and restrictions
6. **Metamagic System Implementation** - Spell modification and cost calculation

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

## Migration Strategy

### **1. Database Migration**
```sql
-- Remove redundant fields from FeatureProgression
ALTER TABLE FeatureProgression DROP COLUMN appliesToType;
ALTER TABLE FeatureProgression DROP COLUMN appliesTo;
```

### **2. Code Updates**
- **Service layer**: Remove `appliesToType` checks, use only `SpecialFeatureId`
- **UI components**: Remove `appliesToType`/`appliesTo` field handling
- **Validation**: Remove `appliesToType`/`appliesTo` from Zod schemas
- **Documentation**: Update all examples to remove redundant fields

### **3. Testing**
- **Verify existing features** still work correctly
- **Test service layer** filtering with simplified logic
- **Validate UI** functionality without redundant fields
- **Confirm character system** integration remains intact

## Success Criteria

### **Phase 1: Schema Cleanup**
- [ ] Database migration completed successfully
- [ ] All existing features work correctly after cleanup
- [ ] Service layer uses only `SpecialFeatureId` for filtering
- [ ] UI components handle simplified schema
- [ ] Documentation reflects simplified approach

### **Phase 2: Direct Feat Grant Support**
- [ ] `ModifierAppliesToType.Feat` added to enum
- [ ] UI supports direct feat grant configuration
- [ ] Character system processes feat grants correctly
- [ ] Ranger Track and Endurance work correctly
- [ ] All direct feat grants display properly in character sheet

### **Phase 3: Language System**
- [ ] `ModifierAppliesToType.Language` added to enum
- [ ] `LanguageService` provides all required functions
- [ ] Race and class UI support language configuration
- [ ] Character creation includes language selection
- [ ] Automatic and bonus languages work correctly

### **Phase 4: Feature-Based Choice System**
- [ ] `FeatureModifierConditionType.feature` added to enum
- [ ] Standalone features created for choice options
- [ ] Choice UI supports feature-based conditions
- [ ] Ranger Combat Style works with new system
- [ ] Rogue Special Abilities work with new system

This roadmap prioritizes schema cleanup and direct feat grant support as the highest priority items, followed by language system and feature-based choice system implementation.
