# Class System Spellcasting System

*Complete documentation for the spellcasting system within the class system, including progression mechanics, spell slot management, and user interactions.*

## 📋 **Overview**

The spellcasting system manages magical abilities for character classes, including spell progression, spell slot management, and spell list configuration. The system supports both prepared and spontaneous casting mechanics with flexible progression patterns.

**Source Files**: 
- Database: `prisma/schema.prisma` (SpellcastingProgression, SpellcastingSlot models)
- Validation: `packages/shared/schema/src/spellcasting.ts`
- Frontend preview: `frontend/src/features/class/tabs/BasicInfoTab.tsx` (Class Features Preview via `ClassProgressionTable`)
- Feature configuration: class Features tab / Feature Edit Form (spellcasting FeatureEntities)

## 🏗️ **System Architecture**

The spellcasting system follows a hierarchical structure that supports complex magical progression patterns:

### **Core Components**

**SpellcastingProgression**: Tracks spellcasting abilities by class level
**SpellcastingSlot**: Manages individual spell slots for each spell level
**SpellLevelMap**: Links spells to classes with level requirements
**SpellcastingLink**: Integrates spellcasting with class features

### **Data Flow Pattern**

**Class Definition** → **Progression Setup** → **Slot Configuration** → **Spell List Management** → **Character Integration**

## 🧙‍♂️ **Spellcasting Types**

### **Prepared Casting**

The traditional spellcasting system where spells must be prepared in advance.

**Mechanics**:
- **Daily Preparation**: Spells prepared each day from known spell list
- **Spell Slots**: Limited number of spells per day per spell level
- **Flexibility**: Can change prepared spells daily
- **Examples**: Wizard, Cleric, Druid

**User Experience**:
- **Preparation Interface**: Daily spell preparation workflow
- **Slot Management**: Visual representation of available spell slots
- **Spell Selection**: Choose spells to prepare from known list
- **Daily Reset**: Clear preparation at start of new day

### **Spontaneous Casting**

The flexible spellcasting system where spells are cast spontaneously from a known list.

**Mechanics**:
- **Fixed Spells Known**: Spells known remain constant
- **Spontaneous Casting**: Cast any known spell with available slots
- **Flexibility**: Maximum flexibility in spell usage
- **Examples**: Sorcerer, Bard, Favored Soul

**User Experience**:
- **Spells Known Display**: Show all known spells by level
- **Slot Usage**: Use any slot for any known spell of appropriate level
- **Learning Interface**: Add new spells to known list
- **Spontaneous Casting**: Cast spells without preparation

## 📊 **Progression System**

### **Level-Based Progression**

Spellcasting abilities scale with character level in the spellcasting class.

**Progression Patterns**:
- **Linear Progression**: Steady increase in spell slots
- **Tiered Progression**: Access to new spell levels at specific class levels
- **Bonus Spells**: Additional slots from high ability scores
- **Capstone Abilities**: Special abilities at maximum class level

**User Interface**:
- **Progression Table**: Visual grid showing slots by level and spell level
- **Level Indicators**: Clear indication of when new spell levels become available
- **Bonus Calculation**: Automatic calculation of bonus spells from ability scores
- **Progression Preview**: Show progression for future levels

### **Spell Level Access**

Different spell levels become available at different class levels.

**Access Patterns**:
- **0-Level Spells**: Available from 1st level (cantrips/orisons)
- **1st-Level Spells**: Available from 1st level
- **2nd-Level Spells**: Available from 3rd level
- **3rd-Level Spells**: Available from 5th level
- **4th-Level Spells**: Available from 7th level
- **5th-Level Spells**: Available from 9th level
- **6th-Level Spells**: Available from 11th level
- **7th-Level Spells**: Available from 13th level
- **8th-Level Spells**: Available from 15th level
- **9th-Level Spells**: Available from 17th level

**User Experience**:
- **Level Requirements**: Clear indication of level requirements for each spell level
- **Progression Display**: Visual representation of spell level access
- **Future Planning**: Show upcoming spell level access
- **Multi-classing**: Handle spellcasting from multiple classes

## 🔧 **Spell Slot Management**

### **Slot Calculation**

Spell slots are calculated based on class level and ability scores.

**Base Slots**:
- **Class Level**: Primary factor in slot calculation
- **Progression Type**: Different classes have different progression rates
- **Spell Level**: Higher spell levels have fewer slots

**Bonus Slots**:
- **Ability Score**: High casting ability provides bonus slots
- **Calculation**: Bonus slots based on ability score modifier
- **Maximum Level**: Bonus slots only for spell levels the caster can use

**User Interface**:
- **Slot Display**: Clear display of base and bonus slots
- **Calculation Breakdown**: Show how slots are calculated
- **Ability Integration**: Automatic integration with character ability scores
- **Real-time Updates**: Update slots when ability scores change

### **Slot Usage**

Managing spell slot consumption during gameplay.

**Usage Tracking**:
- **Slot Consumption**: Track used vs. available slots
- **Daily Reset**: Reset slots at start of new day
- **Rest Recovery**: Recovery of slots after rest periods
- **Special Abilities**: Abilities that restore or modify slots

**User Experience**:
- **Slot Counter**: Visual counter for remaining slots
- **Usage History**: Track which spells were cast
- **Rest Interface**: Interface for rest and slot recovery
- **Special Abilities**: Interface for slot-modifying abilities

### **Spellcasting Edge Case Examples**

**Example 1: Level 1 Wizard Spell Access**
- **Class Level**: 1
- **Spell Level Access**: 1st level spells only
- **Base Slots**: 1 × 1st level spell slot
- **Bonus Slots**: +1 1st level slot if Intelligence ≥ 12
- **Total Slots**: 1-2 1st level spell slots
- **Spells Known**: All 1st level wizard spells available for preparation

**Example 2: Maximum Level Cleric (20th Level)**
- **Class Level**: 20
- **Spell Level Access**: 1st through 9th level spells
- **Base Slots**: 4/4/4/4/4/3/3/2/1 (per spell level)
- **Bonus Slots**: +1 slot per level if Wisdom ≥ 12
- **Total Slots**: 5/5/5/5/5/4/4/3/2 (with 20 Wisdom)
- **Domain Spells**: Additional spells from deity domains

**Example 3: Multi-Class Spellcasting (Cleric 5 / Wizard 3)**
- **Cleric Spellcasting**: 5th level → 3/3/2/1 slots (1st-4th level)
- **Wizard Spellcasting**: 3rd level → 2/1 slots (1st-2nd level)
- **Separate Tracking**: Each class maintains separate spell lists and slots
- **Caster Level**: Cleric caster level 5, Wizard caster level 3
- **Spell Preparation**: Prepare spells separately for each class

**Example 4: Sorcerer Bonus Spell Calculation**
- **Class Level**: 10
- **Charisma Score**: 18 (+4 modifier)
- **Base Slots**: 5/5/4/4/2 (1st-5th level)
- **Bonus Slots**: +1 slot per level for 1st-4th level spells
- **Total Slots**: 6/6/5/5/2 (1st-5th level)
- **Spells Known**: 6/6/6/4/2 spells known per level

## 📚 **Spell List Management**

### **Class Spell Lists**

Each class has access to specific spells based on their spell list.

**List Organization**:
- **Class-Specific Lists**: Each class has unique spell access
- **Level Requirements**: Spells have minimum class level requirements
- **School Restrictions**: Some classes have school-based restrictions
- **Source Attribution**: Spells linked to source books and pages

**User Interface**:
- **Spell Browser**: Search and browse available spells
- **Filter Options**: Filter by school, level, source, etc.
- **Spell Details**: View detailed spell information
- **List Management**: Add/remove spells from class lists

### **Spell Access Patterns**

Different classes have different patterns of spell access.

**Access Types**:
- **Full List Access**: Access to entire spell list (Wizard)
- **Limited Access**: Restricted spell selection (Sorcerer)
- **Domain Access**: Additional spells from domains (Cleric)
- **School Specialization**: Focus on specific schools (Wizard specialists)

**User Experience**:
- **Access Display**: Clear indication of spell access
- **Restriction Warnings**: Warn about restricted access
- **Alternative Options**: Suggest alternatives for restricted spells
- **Access Expansion**: Interface for expanding spell access

## 🔗 **Feature Integration**

### **Feature-Based Spellcasting**

Spellcasting is integrated with the feature system, enabling unified resolution for gestalt and multiclass characters.

**One feature per table:**
Slots and spells known live on shared table features, not on a 20-row per-level copy. Each table is one `Feature` (`level = 1`, `displayInCharacterSheet = false`) with one `EntityType.Base` entity per spell level 0–9. Gain-level offset is on the entity (`CONDITIONAL_SCALING` thresholds), not on the feature. Entities use `displayInDetail = false`.

- `appliesTo` = `SpellcastingProgression` (38) or `SpellsKnownProgression` (46)
- `appliesToId` = spell level 0–9 (never a leftover `SpellcastingProgression` row id)
- Wizard and Cleric do **not** share a slots table. Cleric and Druid share `divine-spells-per-day`. Paladin and Ranger share `half-caster-spells-per-day`.

**Shared table slugs (3.5 PHB):**
- `wizard-spells-per-day` → Wizard 27
- `sorcerer-spells-per-day` / `sorcerer-spells-known` → Sorcerer 26
- `divine-spells-per-day` → Cleric 19 + Druid 20 + variants that already share `clericspells` / `druidspells` (e.g. Cloistered Cleric 134; no domain bonus slots)
- `half-caster-spells-per-day` → Paladin 23 + Ranger 24
- `bard-spells-per-day` / `bard-spells-known` → Bard 18

Casting ability and type live on the PHB narrative `*spells` feature (`wizardspells`, `clericspells`, …), not on a separate `spellcasting-{class}` stub. Data scripts (run in order): `split-shared-spellcasting.ts`, `merge-spellcasting-chassis.ts`, `cleanup-orphan-spellcasting-features.ts`.

**Formulas:**
Every slot and spells-known column uses `CONDITIONAL_SCALING` (PHB breakpoints on the entity). Thresholds/values persist as comma-separated strings via [formulaParamTransformers.ts](../../../apps/backend/src/utils/formulaParamTransformers.ts). Formula definitions: `packages/shared/static-data/src/FormulaDefinitions.ts`.

**Class table:**
`generateClassProgression` / `buildClassProgressionFromDetail` evaluate these entities with `applyFeatureFormula` the same way as BAB/saves. The Detail display strategy is not used for spell columns (`displayInDetail = false` would hide them). See [Class Progression](class-progression.md#display-strategy-and-formatters).

**Runtime slot/known reads:**
`ResolvedFeatureService.getMaxCastableSpellLevelFromFeaturesForClass` and `getSpellsKnownByLevelFromFeaturesForClass` require a `FeatureClassMap` intersection (empty `classes` skips). Callers must fetch with `includeClassRaceInfo: true`. `appliesToId` outside 0–9 is ignored so leftover table FKs cannot become a spell level.

**Legacy tables:**
`SpellcastingProgression` / `SpellcastingSlot` remain as a fallback when no formula-backed slot entities resolve. Domain bonus slots and prestige “+1 existing caster level” are out of scope.

**Source Files:**
- Class table: `apps/frontend/src/lib/ClassProgression.ts`
- Resolution: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts`
- Max castable fetch: `apps/backend/src/features/character/services/characterSpellService.ts`
- Data scripts (run in order): `apps/backend/scripts/split-shared-spellcasting.ts`, `merge-spellcasting-chassis.ts`, `cleanup-orphan-spellcasting-features.ts`

**Related Documentation:**
- [Feature Extraction Patterns](feature-extraction-patterns.md#pattern-5-spell-table-formulas) - Entity shape
- [Feature System - Spellcasting Integration](../feature-system/README.md#spellcasting-integration) - Feature system integration
- [Class and Race Feature Refactoring](../application-overview/class-race-feature-refactoring.md) - Complete refactoring overview

### **Spellcasting Features**

Class features that modify or enhance spellcasting abilities.

**Feature Types**:
- **Bonus Spells**: Features that grant additional spell slots
- **Spell Modifications**: Features that modify spell effects
- **Casting Enhancements**: Features that improve casting abilities
- **Special Abilities**: Unique spellcasting-related abilities

**Integration Points**:
- **Automatic Application**: Features automatically applied to spellcasting
- **Conditional Effects**: Features with conditional activation
- **Level Scaling**: Features that scale with class level
- **Choice Integration**: Features that require player choices

### **Inheritance System**

Classes can inherit spellcasting from other classes or sources.

**Inheritance Types**:
- **Class Inheritance**: Inherit spellcasting from another class
- **Feature Inheritance**: Inherit spellcasting through class features
- **Prestige Class Integration**: Prestige classes that advance existing spellcasting
- **Multi-classing**: Combine spellcasting from multiple classes

**User Experience**:
- **Inheritance Display**: Show inherited spellcasting abilities
- **Source Tracking**: Track the source of inherited abilities
- **Integration Interface**: Interface for managing inherited abilities
- **Conflict Resolution**: Handle conflicts between different spellcasting sources

### **Future Enhancements**

**FeatureEntity formulas for spells known (done for runtime):**
- `EntityAppliesToType.SpellsKnownProgression` drives class Spells Known columns and `maxSpellsKnownByLevel` in character resolution
- Free grants remain spellbook-only (`SpellbookSpell`); SpellsKnown classes do not use free grants
- See [Spell Scribing](../character-management/spell-scribing.md) and [Feature Static Data](../feature-system/static-data.md)

**TODO: Full replacement of SpellcastingProgression/SpellcastingSlot tables**

**Status**: Prototype on Wizard/Sorcerer — one shared feature per table, all columns `CONDITIONAL_SCALING`. Class Feature table and max-castable / spells-known helpers read those entities. `SpellcastingProgression` / `SpellcastingSlot` remain as fallback and for unmigrated classes. Cleric/Bard/Paladin/Ranger tables are not in this pass.

**Approach 2: FeatureEntity Formulas (slots storage)**
- Replace remaining `SpellcastingProgression`/`SpellcastingSlot` persistence with FeatureEntity formulas only
- Complete unification through feature system
- Maximum flexibility for complex casting patterns

**Considerations:**
- Requires formula system extensions
- More complex migration
- Performance implications (formula calculations vs. table lookups)
- UI complexity for formula editing

**When to Consider:**
- After Phase 4 is complete and stable
- If maximum flexibility is needed
- If formula system is extended to support spellcasting patterns
- If performance with formula caching is acceptable

**See**: [Class and Race Feature Refactoring - Spellcasting Analysis](../application-overview/class-race-feature-refactoring.md#spellcasting-system-analysis) for detailed comparison of approaches.

## 🎯 **User Workflows**

### **Class Creation Workflow**

Setting up spellcasting for a new class.

**Workflow Steps**:
1. **Enable Spellcasting**: Set spellcasting flags and casting type
2. **Configure Progression**: Set up spellcasting progression by level
3. **Define Spell List**: Create class-specific spell list
4. **Set Level Requirements**: Define level requirements for spell access
5. **Configure Features**: Add spellcasting-related class features
6. **Test Configuration**: Verify spellcasting setup works correctly

**User Interface**:
- **Setup Wizard**: Guided setup for spellcasting configuration
- **Progression Editor**: Visual editor for spellcasting progression
- **Spell List Manager**: Interface for managing spell lists
- **Validation Feedback**: Real-time validation of spellcasting setup

### **Character Spellcasting Workflow**

Managing spellcasting for individual characters.

**Daily Workflow**:
1. **Rest and Recovery**: Recover spell slots after rest
2. **Spell Preparation**: Prepare spells (for prepared casters)
3. **Spell Casting**: Cast spells during gameplay
4. **Slot Tracking**: Track remaining spell slots
5. **Special Abilities**: Use spellcasting-related special abilities

**User Interface**:
- **Daily Reset**: Interface for daily spell slot recovery
- **Preparation Interface**: Interface for spell preparation
- **Casting Interface**: Interface for casting spells
- **Slot Tracker**: Visual tracker for remaining slots

## 🔧 **Advanced Features**

### **Metamagic Integration**

Support for metamagic feats and spell modifications.

**Metamagic Types**:
- **Spell Level Modifiers**: Feats that increase spell level
- **Casting Time Modifiers**: Feats that modify casting time
- **Range Modifiers**: Feats that modify spell range
- **Effect Modifiers**: Feats that modify spell effects

**Integration Points**:
- **Automatic Application**: Apply metamagic automatically
- **Manual Selection**: Allow manual metamagic selection
- **Cost Calculation**: Calculate metamagic costs
- **Restriction Handling**: Handle metamagic restrictions

### **Spell Research and Development**

Support for creating and researching new spells.

**Research Features**:
- **Spell Creation**: Interface for creating new spells
- **Research Requirements**: Requirements for spell research
- **Development Time**: Time required for spell development
- **Cost Calculation**: Costs associated with spell research

**User Experience**:
- **Research Interface**: Interface for spell research
- **Progress Tracking**: Track research progress
- **Cost Display**: Show research costs and requirements
- **Completion Notification**: Notify when research is complete

## 📊 **Performance Considerations**

### **Data Optimization**

**Caching Strategy**:
- **Progression Caching**: Cache spellcasting progression data
- **Spell List Caching**: Cache spell list data for performance
- **Calculation Caching**: Cache expensive calculations
- **User Preference Caching**: Cache user preferences and settings

**Query Optimization**:
- **Efficient Queries**: Optimize database queries for spellcasting data
- **Selective Loading**: Load only required spellcasting data
- **Relationship Optimization**: Optimize relationship loading
- **Index Usage**: Use database indexes for spellcasting queries

### **User Interface Performance**

**Rendering Optimization**:
- **Virtual Scrolling**: Use virtual scrolling for large spell lists
- **Lazy Loading**: Load spell data only when needed
- **Component Memoization**: Memoize expensive components
- **State Optimization**: Optimize state management for spellcasting

## 🛡️ **Error Handling**

### **Validation Errors**

**Data Validation**:
- **Progression Validation**: Validate spellcasting progression data
- **Spell List Validation**: Validate spell list configurations
- **Level Requirement Validation**: Validate level requirements
- **Feature Integration Validation**: Validate feature integration

**User Feedback**:
- **Validation Messages**: Clear validation error messages
- **Suggestion System**: Suggest fixes for validation errors
- **Real-time Validation**: Validate data as user enters it
- **Error Recovery**: Provide options for error recovery

### **System Errors**

**Error Types**:
- **Calculation Errors**: Errors in spell slot calculations
- **Integration Errors**: Errors in feature integration
- **Data Corruption**: Errors from corrupted spellcasting data
- **Performance Errors**: Errors from performance issues

**Error Recovery**:
- **Automatic Recovery**: Attempt automatic error recovery
- **Manual Recovery**: Provide manual recovery options
- **Data Backup**: Maintain backups of spellcasting data
- **Error Reporting**: Report errors for debugging

## 🔧 **Testing and Quality Assurance**

### **System Testing**

**Functional Testing**:
- **Progression Testing**: Test spellcasting progression calculations
- **Slot Testing**: Test spell slot management
- **Integration Testing**: Test feature integration
- **User Workflow Testing**: Test complete user workflows

**Performance Testing**:
- **Load Testing**: Test system performance under load
- **Memory Testing**: Test memory usage and optimization
- **Query Testing**: Test database query performance
- **UI Testing**: Test user interface performance

### **Quality Assurance**

**Data Integrity**:
- **Consistency Checks**: Ensure data consistency across systems
- **Validation Testing**: Test all validation rules
- **Integration Testing**: Test integration with other systems
- **Regression Testing**: Test for regressions in functionality

**User Experience**:
- **Usability Testing**: Test user interface usability
- **Accessibility Testing**: Test accessibility compliance
- **Cross-browser Testing**: Test across different browsers
- **Mobile Testing**: Test mobile device compatibility
