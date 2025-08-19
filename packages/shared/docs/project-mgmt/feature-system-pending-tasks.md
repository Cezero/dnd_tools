# Feature System Pending Tasks

## Critical Missing

### 🔴 **Language System Implementation**
- **Add Language to ModifierAppliesToType**: Add Language: 14 to enum in FeatureData.ts
- **Create LanguageService**: Utility functions for extracting languages from feature progressions
- **Update RaceEdit.tsx**: Use FeatureModifier approach for languages instead of current implementation
- **Update FeatureProgressionDetailEdit.tsx**: Add support for ModifierAppliesToType.Language
- **Implement getClassBonusLanguages()**: Scan class features for bonus languages via appliesIfChoiceKey
- **Character Creation UI**: Language selection interface in character creation flow
- **Language Condition Evaluation**: INT modifier condition handling for bonus languages

### 🔴 **Feature-Linked Skill Analogs Implementation**
- **Add isAnalog Field to Skill Model**: Add `isAnalog` boolean field to distinguish feature-linked skills from custom skills
- **Create Wild Empathy Skill**: Add Wild Empathy as an analog skill with `isAnalog: true`
- **Create Wild Empathy Feature**: Add feature and progressions for Druid and Ranger classes
- **Extend Character Sheet Display**: Add analog skill detection and calculation logic in SkillsTab
- **Implement Analog Skill Calculation**: Calculate "class level + ability modifier" for analog skills
- **Prevent Skill Allocation**: Block analog skills from skill point allocation
- **Support Multiclass Characters**: Handle levels in multiple classes that grant the same analog skill
- **Backend Character Calculation**: Add analog skill calculation to character calculation service

### 🔴 **Formula Calculation Tooltips**
- **UI Integration**: Show calculation work in tooltips for attribute-dependent formulas
- **Tooltip Generation**: Display formula breakdown (e.g., "3 + CHA (3) = 6")
- **Character Context**: Pass character data to tooltip generation functions

### 🔴 **Feature Choice System**
- **Choice Type Expansion**: Add Language choice type to ChoiceType enum
- **Choice UI Components**: Language selection widgets in feature editor
- **Choice Validation**: Validate language choices against available options
- **Character Choice Tracking**: Store and retrieve character feature choices

## Detailed Implementation Steps

### **Phase 1: Language System**

#### **Step 1: Add Language to ModifierAppliesToType** ✅ **COMPLETED**
- [x] Add `Language: 14` to `ModifierAppliesToType` enum in `shared/static-data/src/FeatureData.ts`
- [x] Add Language mapping to `MODIFIER_APPLIES_TO_TYPES`
- [x] Add Language to `MODIFIER_TYPE_COMPATIBILITY[ModifierType.Other]`
- [x] Build shared static data package

#### **Step 2: Create LanguageService** ✅ **COMPLETED**
- [x] Create `frontend/src/lib/LanguageService.ts`
- [x] Implement `getAutomaticLanguages()` using `SpecialFeatureId.AutomaticLanguage`
- [x] Implement `getBonusLanguages()` using `SpecialFeatureId.BonusLanguage`
- [x] Implement `getClassBonusLanguages()` scanning for `appliesIfChoiceKey: "bonus_languages"`
- [x] Implement `isClassBonusLanguageFeature()` utility function
- [x] Implement `evaluateLanguageConditions()` for INT modifier requirements

#### **Step 3: Update RaceEdit.tsx** ✅ **COMPLETED**
- [x] Replace current `handleAddLanguage()` with FeatureModifier approach
- [x] Use `SpecialFeatureId.AutomaticLanguage` and `SpecialFeatureId.BonusLanguage`
- [x] Create proper language modifier structure with `ModifierAppliesToType.Language`
- [x] Add condition handling for INT modifier requirements
- [x] Test automatic and bonus language creation

#### **Step 4: Update FeatureProgressionDetailEdit.tsx** ✅ **COMPLETED**
- [x] Add support for `ModifierAppliesToType.Language` in modifier creation
- [x] Add language selection dropdown for language modifiers
- [x] Add condition UI for INT modifier requirements
- [x] Test language modifier creation in feature editor

#### **Step 5: Fix Backend Schema Validation** ✅ **COMPLETED**
- [x] Fix missing `id` field in feature selection in race service
- [x] Update `getAllRaces()` to include `id` in feature selection
- [x] Update `getRaceById()` to include `id` in feature selection
- [x] Resolve Zod validation errors for race data

#### **Step 6: Test Race Language Features**
- [ ] Create test race with automatic languages
- [ ] Create test race with bonus languages
- [ ] Verify language extraction via LanguageService
- [ ] Test INT modifier condition evaluation

### **Phase 2: Class Language Features**

#### **Step 1: Implement Class Bonus Language Support**
- [ ] Test `getClassBonusLanguages()` with existing class features
- [ ] Create test class with bonus languages using `appliesIfChoiceKey: "bonus_languages"`
- [ ] Verify class language expansion works correctly
- [ ] Test multiple classes contributing to same language pool

#### **Step 2: Character Creation Integration**
- [ ] Update character creation UI to use LanguageService
- [ ] Combine racial and class bonus languages
- [ ] Add language selection interface
- [ ] Test INT modifier-based language availability
- [ ] Test multiple class language contributions

### **Phase 3: Formula Tooltips**

#### **Step 1: UI Integration**
- [ ] Add tooltip display to calculated values in character context
- [ ] Integrate existing `generateAttributeFormulaTooltip()` function
- [ ] Add tooltip triggers to formula displays
- [ ] Test tooltip generation and display

#### **Step 2: Character Context Integration**
- [ ] Pass character data to tooltip generation functions
- [ ] Ensure character context is available in tooltip contexts
- [ ] Test tooltips with real character data
- [ ] Verify calculation breakdown accuracy

### **Phase 4: Feature Choice System**

#### **Step 1: Choice Type Expansion**
- [ ] Add `Language` to `ChoiceType` enum in Prisma schema
- [ ] Update Zod schemas to include Language choice type
- [ ] Add Language choice support to feature editor UI
- [ ] Test language choice creation and validation

### **Phase 5: Feature-Linked Skill Analogs**

#### **Step 1: Database Schema Updates** ✅ **COMPLETED**
- [x] Add `isAnalog` boolean field to Skill model in Prisma schema
- [x] Update Zod schemas to include `isAnalog` field
- [x] Update shared/prisma-client/client/schema.prisma to include `isAnalog` field
- [x] Update shared/static-data/src/types.ts Skill interface to include `isAnalog` field
- [x] Update shared/static-data/src/SkillData.ts to include `isAnalog: false` for all existing skills
- [ ] Build schema package and verify type generation
- [ ] Test schema validation with new field

#### **Step 2: Create Wild Empathy Implementation** ✅ **COMPLETED**
- [x] Add Wild Empathy skill to database with `isAnalog: true`
- [x] Create Wild Empathy feature with slug "wild-empathy"
- [x] Add FeatureProgression for Druid class (level 1)
- [x] Add FeatureProgression for Ranger class (level 1)
- [x] Add FeatureModifier with `appliesTo: ModifierAppliesToType.Skill` and `appliesToId: [Wild Empathy skill ID]`
- [x] Run script to create feature in database
- [x] Verify feature creation and class associations

#### **Step 3: Frontend Character Sheet Integration** ✅ **COMPLETED**
- [x] Update character sheet skill display to handle analog skills
- [x] Add logic to filter out analog skills from skill point allocation
- [x] Implement custom calculation for analog skills (class level + ability modifier)
- [x] Create AnalogSkillService for managing analog skill logic
- [x] Add visual distinction for analog skills (purple background, "A" badge)
- [x] Create separate "Feature-Linked Skills" section for analog skills

#### **Step 4: Backend Character Calculation** ✅ **COMPLETED**
- [x] Update backend character calculation to handle analog skills
- [x] Ensure analog skills are included in character sheet API responses
- [x] Implement proper feature detection for analog skills
- [x] Create characterCalculationService for analog skill calculations
- [x] Add API endpoints for character calculations
- [x] Register character calculation routes

#### **Step 5: Testing and Validation** ✅ **COMPLETED**
- [x] Test the Wild Empathy implementation with Druid and Ranger characters
- [x] Verify analog skills are properly filtered from skill point allocation
- [x] Validate the calculation formula (class level + ability modifier)
- [x] Test multiclass scenarios
- [x] Create and run comprehensive test scripts
- [x] Validate database schema and feature system integration

## Current Status

**Last Updated**: [Current Date]
**Current Phase**: Phase 1 - Language System
**Next Milestone**: Complete language system implementation
**Blockers**: None

## Success Criteria

### **Language System**
- [ ] Races can have automatic and bonus languages via FeatureModifier approach
- [ ] Classes can grant additional bonus languages via appliesIfChoiceKey
- [ ] Character creation shows proper language selection
- [ ] INT modifier requirements are enforced
- [ ] Multiple classes can contribute to same language pool
- [ ] LanguageService correctly extracts languages from feature progressions

### **Formula System**
- [ ] Attribute-dependent formulas work correctly
- [ ] Formula structures display properly in edit dialogs
- [ ] Calculated values display in character context
- [ ] Tooltips show calculation breakdown

### **Feature System**
- [ ] All feature types can be created and edited
- [ ] Feature progressions work for races and classes
- [ ] Modifiers, choices, and effects are properly managed
- [ ] Bulk operations work correctly
