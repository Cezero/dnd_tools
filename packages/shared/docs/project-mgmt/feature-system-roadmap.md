# Feature System Implementation Roadmap

## Completed Components

### ✅ **Core Infrastructure**
- **Database Schema**: Complete Prisma schema with all feature system tables
- **Zod Schemas**: Complete validation schemas for all feature entities
- **Backend Services**: Race and Class services with bulk feature operations
- **Frontend UI**: Feature progression editor with modifier/choice/effect management
- **Formula System**: Complete formula calculation system with attribute-dependent formulas
- **Smart Formatter System**: Context-aware formatters for displaying formula structures vs calculated values

### ✅ **Formula System**
- **Formula Definitions**: Complete formula types including attribute-dependent formulas
- **Formula Calculator**: Frontend calculation engine with character context support
- **Database Schema**: Formula parameters table with attribute support
- **Backend Services**: Formula parameter handling in class and feature services
- **Frontend UI**: Dynamic formula parameter inputs based on formula type
- **Formatters**: Context-aware formatters showing formula structure or calculated values

### ✅ **Attribute-Dependent Features**
- **New Formula Types**: ATTRIBUTE_BASED, ATTRIBUTE_MODIFIER, LEVEL_TIMES_ATTRIBUTE
- **Character Context**: FormulaContext with character ability scores and class levels
- **Frontend Calculator**: Enhanced formula calculator with attribute-based calculations
- **Database Schema**: FeatureModifierFormulaParams with attributeId field
- **Backend Services**: Updated to handle attribute-dependent formula parameters
- **Frontend UI**: Dynamic formula parameter inputs for attribute-dependent formulas
- **Smart Formatters**: Context-aware display of formula structure vs calculated values

## Critical Missing Components

### 🔴 **Language System**
- **ModifierAppliesToType.Language**: Add Language type to modifier applies to enum
- **LanguageService**: Utility functions for extracting languages from feature progressions
- **Race Language UI**: Update RaceEdit to use FeatureModifier approach for languages
- **Class Language Features**: Support for class-granted bonus languages via appliesIfChoiceKey
- **Character Creation UI**: Language selection interface in character creation flow
- **Language Condition Evaluation**: INT modifier condition handling for bonus languages

### 🔴 **Formula Calculation Tooltips**
- **UI Integration**: Show calculation work in tooltips for attribute-dependent formulas
- **Tooltip Generation**: Display formula breakdown (e.g., "3 + CHA (3) = 6")
- **Character Context**: Pass character data to tooltip generation functions

### 🔴 **Feature Choice System**
- **Choice Type Expansion**: Add Language choice type to ChoiceType enum
- **Choice UI Components**: Language selection widgets in feature editor
- **Choice Validation**: Validate language choices against available options
- **Character Choice Tracking**: Store and retrieve character feature choices

### 🔴 **Advanced Feature Patterns**
- **Conditional Features**: Complex condition evaluation for feature application
- **Feature Prerequisites**: Prerequisite checking for feature availability
- **Feature Interactions**: Rules for how features interact and stack
- **Feature Templates**: Reusable feature patterns for common abilities

## Implementation Phases

### **Phase 1: Language System** ⏳
1. **Add Language to ModifierAppliesToType** - Add Language: 14 to enum
2. **Create LanguageService** - Utility functions for language extraction
3. **Update RaceEdit.tsx** - Use FeatureModifier approach for languages
4. **Update FeatureProgressionDetailEdit.tsx** - Support language modifiers
5. **Test Race Language Features** - Verify automatic and bonus language creation

### **Phase 2: Class Language Features** ⏳
1. **Implement getClassBonusLanguages()** - Scan class features for bonus languages
2. **Update ClassService** - Support class-granted bonus languages
3. **Test Class Language Features** - Verify class language expansion works
4. **Character Creation Integration** - Combine racial and class bonus languages

### **Phase 3: Formula Tooltips** ⏳
1. **UI Integration** - Add tooltip display to calculated values
2. **Tooltip Generation** - Create functions to show formula breakdown
3. **Character Context** - Pass character data to tooltip functions
4. **Testing** - Verify tooltips show correct calculation work

### **Phase 4: Feature Choice System** ⏳
1. **Choice Type Expansion** - Add Language to ChoiceType enum
2. **Choice UI Components** - Create language selection widgets
3. **Choice Validation** - Validate language choices
4. **Character Choice Tracking** - Store character feature choices

### **Phase 5: Advanced Patterns** ⏳
1. **Conditional Features** - Complex condition evaluation
2. **Feature Prerequisites** - Prerequisite checking
3. **Feature Interactions** - Stacking and interaction rules
4. **Feature Templates** - Reusable feature patterns

## Current Status

**Last Updated**: [Current Date]
**Current Phase**: Phase 1 - Language System
**Next Milestone**: Complete language system implementation
**Blockers**: None

## Success Criteria

### **Language System**
- ✅ Races can have automatic and bonus languages
- ✅ Classes can grant additional bonus languages
- ✅ Character creation shows proper language selection
- ✅ INT modifier requirements are enforced
- ✅ Multiple classes can contribute to same language pool

### **Formula System**
- ✅ Attribute-dependent formulas work correctly
- ✅ Formula structures display properly in edit dialogs
- ✅ Calculated values display in character context
- ✅ Tooltips show calculation breakdown

### **Feature System**
- ✅ All feature types can be created and edited
- ✅ Feature progressions work for races and classes
- ✅ Modifiers, choices, and effects are properly managed
- ✅ Bulk operations work correctly
