# Feature System Implementation Plan

This document provides a detailed implementation strategy for the D&D Tools Feature System, updated to reflect current implementation status.

## Current Status Assessment

### ✅ Completed (100% of core functionality)
- **Feature System Data Structures**: All schemas implemented and working
- **FeatureProgressionDetailEdit UI**: Complete with formula input, conditions, choices, dynamic formula preview, and feat selection
- **Direct Feat Grant Support**: Complete implementation with proper feat name display across all components
- **Standalone Feature Creation UI**: Complete implementation for creating and managing features not associated with classes/races
- **Character Advancement System**: Basic level-up workflow exists
- **API Endpoints**: Feature CRUD and bulk operations functional
- **Character Creation Workflow**: Basic functionality implemented
- **Formula System**: Complete implementation with FeatureModifierFormulaParams model for parameterized formulas
- **Formula Testing**: EVERY_N_LEVELS formula tested with Barbarian class features, **CONDITIONAL_SCALING formula tested with Monk Flurry of Blows**, **ATTRIBUTE_BASED and ATTRIBUTE_MODIFIER formulas tested**, **LEVEL_TIMES_VALUE formula tested with healing features**, **VALUE_PLUS_LEVEL formula tested with Monk Diamond Soul**
- **Formula Display**: Formula-based progressions display correctly in both edit and detail views
- **FeatureModifierFormulaParams**: Database model for storing formula-specific parameters (interval, formulaStartLevel, thresholds, values, attributeId)
- **Formula Preview UI**: Dynamic preview showing actual progression patterns in edit dialog
- **Schema Validation**: Fixed validation issues with optional formula parameters
- **Backend Integration**: Complete backend support for new formula parameter structure
- **Class Modeling**: Barbarian, Bard, Cleric, Druid, Fighter, Monk, and Paladin classes successfully modeled with formula-based features
- **Monk Class Features**: Complete modeling including Flurry of Blows (conditional scaling), Unarmed Strike (size-based damage), Diamond Soul (value plus level), Wholeness of Body (level times value), and bonus feats (choice system)
- **Size-Based Damage System**: Complete implementation with character_size condition type, integer condition values, and proper UI display of size-specific damage modifiers
- **Formula Calculator**: Complete implementation with FeatureModifierFormulaParams support
- **Formula Definitions**: 10 generic formulas covering D&D 3.5 scaling patterns
- **Frontend Formula Integration**: Complete formula selection, preview, and validation
- **Backend Formula Support**: Complete backend support for formula parameter creation and loading
- **Feature Prerequisites**: Schema and UI complete, moved to feature level
- **Database Schema**: Complete with all feature system models and relationships
- **Spellcasting Database Schema**: Complete spellcasting models (SpellcastingProgression, SpellcastingSlot, SpellcastingLink)
- **Healing Features**: LEVEL_TIMES_VALUE formula and Healing modifier type implemented for Monk Wholeness of Body and Paladin Lay on Hands
- **Condition System**: Complete implementation with integer condition values and size-based modifiers
- **ClassEdit Tab System Refactoring**: ✅ COMPLETED - Converted monolithic ClassEdit to tab-based layout
  - **Tab Infrastructure**: Complete tab navigation and state management
  - **All 7 Tab Components**: Implemented and functional with enhanced UX
  - **Type Safety**: All components use proper TypeScript types (no `any` usage)
  - **Schema Integration**: Uses `FeatureProgressionWithRelations` and other schema types
  - **Barrel Exports**: Clean import structure with proper module resolution
  - **State Management**: Centralized state with props passing to tab components
  - **Dialog Integration**: All dialogs work correctly with tab structure
  - **UX Improvements**: Better organization, reduced cognitive load, improved maintainability
- **Enhanced Spell Progression Management**: ✅ COMPLETED - Full spell progression editor with casting type and spells known support
  - **Generic Components**: Reusable spell progression components for future use
  - **Keyboard Navigation**: Arrow key navigation within each grid independently
  - **Data Integrity**: Proper reset functionality to restore original state
  - **Type Safety**: Full TypeScript integration with schema types
  - **UX Optimization**: Removed unnecessary row highlighting and Quick Fill functionality
  - **Schema Integration**: Complete integration with Zod schemas and Prisma models
  - **Casting Type Support**: Prepared/Spontaneous casting type selection
  - **Spells Known Support**: Optional spells known progression with separate grid
  - **Backend Integration**: Complete CRUD operations for spell progression data
- **Schema Cleanup**: ✅ COMPLETED - Removed redundant `FeatureProgression.appliesToType` and `appliesTo` fields
  - **Database Schema**: Removed redundant columns from FeatureProgression table
  - **Zod Schema**: Removed redundant fields from FeatureProgressionSchema
  - **Service Layer**: Updated ClassSkillService and LanguageService to use only SpecialFeatureId
  - **UI Components**: Removed redundant field handling from all forms and displays
  - **Validation**: Removed redundant fields from validation schemas
  - **Testing**: Verified all existing features work correctly after cleanup
- **Standalone Feature Creation UI**: ✅ COMPLETED - Complete UI for creating and managing standalone features
  - **Feature List Component**: Complete listing, search, and navigation for standalone features
  - **Feature Edit Component**: Create and edit feature basic information (name, slug, description)
  - **Feature Detail Component**: View feature details and associated progressions
  - **Feature Progression Edit Component**: Create and edit standalone feature progressions
  - **Navigation Integration**: Added Features link to main sidebar navigation
  - **Route Configuration**: Complete routing setup for all feature management pages
  - **Backend Integration**: Reuses existing FeatureSystemService for CRUD operations
  - **Standalone Support**: Features can be created without class/race associations
- **FeatureProgression Management for Standalone Features**: ✅ COMPLETED - Complete backend and frontend support for managing FeatureProgressions for individual features
  - **Backend Service Methods**: Added `updateFeatureProgressions()` and `getFeatureProgressions()` methods
  - **API Endpoints**: Added `GET /features/:id/progressions` and `PUT /features/:id/progressions` endpoints
  - **Schema Updates**: Added `UpdateFeatureProgressionsRequestSchema` and `GetFeatureProgressionsResponseSchema`
  - **Frontend Integration**: Updated FeatureEdit component to load and save FeatureProgressions
  - **UI Components**: Added FeatureProgression management section to FeatureEdit with full CRUD support
  - **Type Safety**: Complete TypeScript integration with shared schema types
  - **Transaction Safety**: Proper cleanup and rollback on errors in backend operations
  - **Relationship Clarification**: Documented that FeatureProgressions → Features (many-to-one), not the reverse
- **Backend FeatureProgression Logic Consolidation**: ✅ COMPLETED - Eliminated duplicate FeatureProgression management logic across services
  - **Consolidated Methods**: Added `createMultipleFeatureProgressions()` and `deleteFeatureProgressionsForContext()` to FeatureSystemService
  - **Class Service Refactoring**: Updated ClassService to use consolidated methods instead of duplicating logic
  - **Race Service Refactoring**: Updated RaceService to use consolidated methods instead of duplicating logic
  - **Code Reduction**: Eliminated ~200 lines of duplicate code across class and race services
  - **Maintainability**: Single source of truth for FeatureProgression creation/deletion logic
  - **Consistency**: Ensures identical behavior across all services for FeatureProgression management
  - **Transaction Safety**: All services now use the same transaction-safe deletion and creation patterns
- **Documentation Updates**: ✅ COMPLETED - Updated all documentation to reflect backend consolidation and cross-references
  - **Feature System Documentation**: Added backend architecture section and cross-references to class/race systems
  - **Class System Documentation**: Added feature system integration section with cross-references
  - **Race System Documentation**: Added feature system integration section with cross-references
  - **Schema Reference**: Updated to include cross-references and relationship clarifications
  - **FeatureProgression Management**: Complete documentation of consolidated backend architecture
  - **Project Management**: Updated implementation plan to reflect consolidation completion
- **Ranger Fighting Style Modeling**: ✅ COMPLETED - Successfully implemented and tested Ranger Combat Style feature with feature choices
  - **Feature Choice System**: Complete implementation of ChoiceType.Feature support in formatters and display components
  - **ClassDisplay Integration**: Updated to properly display feature choices in pipe-delimited format (e.g., "Archery|Two-Weapon Combat")
  - **Formatter Updates**: Enhanced formatChoiceOptions and groupChoicesByLabel functions to handle both feat and feature choices
  - **UI Consistency**: Feature choices display in the same format and location as feat choices for consistent user experience
  - **Backend Transaction Safety**: Fixed nested transaction issues by implementing unified transaction-aware methods
  - **Standalone Feature Management**: Complete end-to-end functionality for creating and managing standalone features with progressions
- **Rogue Class Complete Implementation**: ✅ COMPLETED - Successfully implemented and tested complete Rogue class with Sneak Attack and Special Abilities

### ⏳ Partially Implemented (Ready for Enhancement)
- **RaceEdit UI**: Currently monolithic component (806 lines) with basic feature display
  - **Current State**: Uses feature system correctly for abilities and languages, but limited feature progression management
  - **Enhancement Needed**: Convert to tab-based layout matching ClassEdit architecture
  - **Feature System Integration**: Already correctly uses SpecialFeatureId.AbilityAdjustment, SpecialFeatureId.AutomaticLanguage, and SpecialFeatureId.BonusLanguage
  - **UI Organization**: Needs tab-based reorganization for better user experience and consistency
- **Unified Choice System Implementation**: ✅ COMPLETED - Successfully implemented and tested unified choice system for all core classes
  - **Fighter Bonus Feats**: ✅ Complete implementation using FeatureChoice with filterType and formula support
  - **Wizard Bonus Feats**: ✅ Complete implementation using FeatureChoice with MetamagicOrItemCreation filter
  - **Rogue Special Abilities**: ✅ Complete implementation using FeatureChoice with formula support
  - **Display Logic**: ✅ Complete display system for both ClassEdit.tsx (progression patterns) and ClassDetail.tsx (individual entries)
  - **Formula Integration**: ✅ Seamless integration with EVERY_N_LEVELS formula for bonus feat progression
  - **Legacy System Cleanup**: ✅ Removed deprecated ModifierAppliesToType.Choice system and related code
  - **Formatter System**: ✅ Enhanced formatters to handle both original and synthetic progression entries
  - **UI Components**: ✅ Updated FeatureProgressionDetailEdit.tsx with proper choice formatter support
  - **Sneak Attack System**: Complete formula-based damage progression with EVERY_N_LEVELS formula, dice notation formatting, and attack type conditions
  - **Special Abilities System**: Complete choice-based feature with level-specific progression (levels 10, 13, 16, 19) and unified choice formatting
  - **Unified Choice Formatter Refactoring**: Eliminated duplicate choice formatting logic across three components with single source of truth
  - **Formula System Enhancements**: Special handling for choice modifiers with EVERY_N_LEVELS formula to show all progression levels
  - **Dice Quantity Formatting**: Enhanced damage formatter to properly display "+1d6", "+2d6" format for sneak attack progression
  - **Attack Type Conditions**: Complete implementation with ATTACK_TYPE_ENUM and proper validation
  - **Backend Schema Updates**: Fixed choice data access and foreign key constraint issues
  - **UI Consistency**: All three components (ClassEdit, ClassDetail, FeatureProgressionDetailEdit) use unified formatting
  - **Code Quality**: Reduced ~75 lines of duplicate code and improved maintainability
- **Choice System Unification**: ✅ COMPLETED - Successfully unified the choice system architecture
  - **Database Schema**: Converted Prisma enums to static-data enums (`ChoiceType`, `ChoiceBehavior`)
  - **Formula System**: Renamed `FeatureModifierFormulaParams` to `FeatureFormulaParams` and extended to support both `FeatureModifier` and `FeatureChoice`
  - **New Fields**: Added `filterType` and `formulaParamsId` to `FeatureChoice` for filtered choice support
  - **Zod Schema**: Updated validation schemas to use new enum types and support formula params for choices
  - **Backend Services**: Updated all backend services to handle formula params for choices and use new field names
  - **Frontend Components**: Updated all UI components to use new enum values and support new fields
  - **Code Quality**: Fixed all 17 linting warnings in backend code
  - **Type Safety**: Resolved TypeScript type issues and ensured proper type alignment
  - **Data Migration**: User manually migrated existing enum values and formula references
  - **Testing**: All existing functionality continues to work correctly
  - **Feature Migration**: ✅ COMPLETED - Successfully migrated all base class choice systems
    - **Fighter Bonus Feats**: Migrated from FeatureModifier choice system to FeatureChoice with formula support
    - **Wizard Bonus Feats**: Migrated from FeatureModifier choice system to FeatureChoice with formula support
    - **Rogue Special Abilities**: Already implemented using unified FeatureChoice system
  - **All Base Classes Modeled**: ✅ COMPLETED - Successfully modeled all 11 base classes with proper choice system integration

### ⏳ Partially Implemented (0% of core functionality)
- **Formula System Testing**: EVERY_N_LEVELS, CONDITIONAL_SCALING, ATTRIBUTE_BASED, ATTRIBUTE_MODIFIER, LEVEL_TIMES_VALUE, and VALUE_PLUS_LEVEL formulas tested, other formulas need validation
- **Class Feature Modeling**: Barbarian, Bard, Cleric, Druid, Fighter, and Monk completed, other classes pending
- **Feature Prerequisites**: Schema and UI exist, but **NO VALIDATION LOGIC**
- **Character Integration**: Basic structure exists, calculation missing
- **Character Sheet Tabs**: Basic tabs exist (Abilities, Feats, Skills, Class, Description, Equipment) but no formula integration
- **PDF Export**: No export functionality

### ❌ Critical Missing (5% of core functionality)
- **Feature Resolution Service**: No runtime calculation for character sheets (FUTURE ENHANCEMENT)
- **Feature Prerequisites Validation**: No enforcement logic
- **Character Sheet Generation**: No comprehensive display with calculated values
- **Backend Character Calculation**: No formula evaluation in character calculations
- **Druid Animal Companion System**: Requires monster/NPC feature system as dependency
- **Complex Choice System**: ✅ UI implementation completed - supports both filtered and specific choice selection
      - **Monk Bonus Feats**: ✅ UI supports level-specific feat selection
    - **Ranger Fighting Styles**: ✅ UI supports choice-dependent feat granting
    - **Rogue Special Abilities**: ✅ UI supports choice between abilities and feats

## Choice System Unification Strategy

### **Current State: Two Choice Mechanisms**
The system currently has **two separate but overlapping choice mechanisms** that serve different purposes:

#### **1. FeatureChoice System (Direct Choice Selection)**
- **Purpose**: Define specific, predefined choices for players
- **Components**: `FeatureChoice` model with `ChoiceType` and `ChoiceBehavior` enums
- **Examples**: 
  - **Monk Bonus Feats**: Choose between "Improved Grapple" or "Stunning Fist"
  - **Ranger Combat Style**: Choose between "Archery" or "Two-Weapon Combat" features
  - **Ranger Favored Enemy**: Choose creature types and allocate +2 bonuses

#### **2. FeatureModifier Choice System (Filtered Choice Selection)**
- **Purpose**: Enable filtered choice selection with formula-based progression
- **Components**: `FeatureModifier` with `ModifierType.Other` + `ModifierAppliesToType.Choice`
- **Examples**:
  - **Fighter Bonus Feats**: Choose from fighter bonus feat category every 2 levels
  - **Wizard Bonus Feats**: Choose from metamagic/item creation feat category at levels 5, 10, 15, 20
  - **Rogue Special Abilities**: Choose from rogue ability category every 3 levels starting at level 10

### **Planned Refactoring: Unified Choice System**
**Strategy**: Unify both choice mechanisms under a single `FeatureChoice` system while preserving existing functionality and adding formula support for progression-based choices.

#### **Schema Changes**
1. **Convert Prisma Enums to Static-Data Enums**: Convert `ChoiceType` and `ChoiceBehavior` from Prisma enums to `Int` fields referencing `@FeatureData.ts` enums
2. **Rename Formula System**: Rename `FeatureModifierFormulaParams` to `FeatureFormulaParams` and extend to support both `FeatureModifier` and `FeatureChoice`
3. **Add New Fields to FeatureChoice**: Add `filterType` and `formulaParamsId` fields for filtered choice support
4. **Preserve Existing Fields**: Keep `pickCount` and `ChoiceBehavior.Multiple` for future epic level features

#### **Benefits**
- ✅ **Unified Choice System**: Single choice mechanism for all features
- ✅ **Shared Formula System**: Reuses existing formula infrastructure
- ✅ **Consistent Modeling**: All choice-based features use same approach
- ✅ **Future Flexibility**: Preserves fields for epic level "pick 2 feats" scenarios
- ✅ **Better Maintainability**: One system to understand and maintain

#### **Migration Strategy**
1. **Phase 1**: Schema updates and static-data enum additions
2. **Phase 2**: Data migration and code updates
3. **Phase 3**: Feature migration (Fighter, Wizard, Rogue bonus feats)
4. **Phase 4**: Cleanup and documentation updates

#### **Impact Assessment**
- **Low Risk**: Schema changes are additive and don't break existing functionality
- **Medium Risk**: Data migration requires careful testing
- **High Benefit**: Eliminates confusion and provides consistent choice modeling

## Phase-Based Implementation Approach

### Phase 1: Choice System Unification ✅ COMPLETED

#### Step 1: Schema Updates ✅ COMPLETED
**Status**: ✅ COMPLETED - Successfully unified choice system architecture
**Impact**: Eliminated confusion between two choice mechanisms
**Priority**: ✅ COMPLETED - System consistency achieved

**Implementation Steps**:
1. **Convert Prisma Enums to Static-Data Enums**
   - Add `ChoiceType` and `ChoiceBehavior` enums to `@FeatureData.ts`
   - Convert `FeatureChoice.choiceType` and `choiceBehavior` from Prisma enums to `Int` fields
   - Update Zod schemas to use new enum types
   - Update UI components to use new enum values

2. **Rename and Extend Formula System**
   - Rename `FeatureModifierFormulaParams` to `FeatureFormulaParams`
   - Add relationship to `FeatureChoice` model
   - Update all references to use new model name
   - Ensure both `FeatureModifier` and `FeatureChoice` can use same formula system

3. **Add New Fields to FeatureChoice**
   - Add `filterType` field for filtered choice support (references `FeatureFeatChoiceFilter`)
   - Add `formulaParamsId` field for formula-based progression
   - Update Zod schemas and validation
   - Update UI components to support new fields

4. **Preserve Existing Fields**
   - Keep `pickCount` field for future epic level features
   - Keep `ChoiceBehavior.Multiple` for future "pick 2 feats" scenarios
   - Document current usage patterns for future reference

**Use Cases**:
- **Fighter Bonus Feats**: ✅ COMPLETED - Migrated from FeatureModifier choice system to FeatureChoice with formula
- **Wizard Bonus Feats**: ✅ COMPLETED - Migrated from FeatureModifier choice system to FeatureChoice with formula
- **Rogue Special Abilities**: ✅ COMPLETED - Already implemented using unified FeatureChoice system
- **Future Epic Features**: ✅ READY - Support for "pick 2 feats from this list" scenarios

### Phase 2: Direct Feat Grant Support ✅ COMPLETED

#### Step 1: Direct Feat Grant Implementation ✅ COMPLETED
**Status**: ✅ COMPLETED - Complete implementation with proper feat name display

### Phase 3: Standalone Feature Creation UI ✅ COMPLETED

#### Step 1: Standalone Feature Management ✅ COMPLETED
**Status**: ✅ COMPLETED - Complete implementation with Ranger Combat Style testing
**Impact**: Successfully implemented Ranger Combat Style with "Archery" and "Two-Weapon Combat" feature choices
**Priority**: ✅ COMPLETED - All requirements met and tested

**Implementation Steps**:
1. **Create Standalone Feature Creation UI**
   - File: `frontend/src/components/feature-system/FeatureEdit.tsx`
   - Allow creating features without class/race association
   - Support for feature descriptions, prerequisites, and metadata
   - Integration with existing feature system

2. **Create Standalone FeatureProgression UI**
   - File: `frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx`
   - Allow creating FeatureProgression records without classId/raceId
   - Reuse existing FeatureProgressionDetailEdit components
   - Support for modifiers, choices, and effects

3. **Add Feature Management Navigation**
   - File: `frontend/src/features/admin/features/feature-system/FeatureList.tsx`
   - List all standalone features
   - Search and filter capabilities
   - Link to feature editing

4. **Update Backend Services**
   - File: `backend/src/features/feature/featureService.ts`
   - Support for standalone feature CRUD operations
   - Support for standalone FeatureProgression CRUD operations
   - Proper validation and error handling

**Use Cases**:
- **Ranger Combat Style Features**: ✅ COMPLETED - Successfully created "Archery Combat Style" and "Two-Weapon Combat Style" features with choice system
- **Rogue Special Abilities**: Create standalone features for rogue abilities
- **Magic Item Features**: Create features that can be granted by items
- **Template Features**: Create features for character templates

### Phase 4: Backend Response Validation Middleware (HIGH PRIORITY)

#### Step 1: Response Validation Enhancement
**Status**: 🔴 CRITICAL MISSING - Backend currently sends raw database data without validation
**Impact**: Frontend receives invalid data (e.g., strings instead of arrays) causing ZodErrors
**Priority**: HIGH - Required for data integrity and proper error handling

**Problem Statement**:
- Backend `buildValidatedRouter` only validates requests, not responses
- Controllers call `res.json(data)` directly without schema validation
- TypeScript types are compile-time only, no runtime enforcement
- Example: `FeatureFormulaParams.thresholds` and `values` sent as strings instead of arrays

**Implementation Steps**:
1. **Extend buildValidatedRouter**
   - Add `response` schema parameter to `Schemas` type
   - Modify `buildValidatedHandler` to validate response data before sending
   - Ensure validation failures result in 500 errors, not invalid data

2. **Update Route Definitions**
   - Add response schemas to all route definitions
   - Ensure all API endpoints validate responses before sending
   - Update controller signatures to include response validation

3. **Error Handling Enhancement**
   - Ensure response validation failures are caught by error middleware
   - Provide clear error messages for validation failures
   - Log validation failures for debugging

4. **Documentation Updates**
   - Update backend patterns documentation
   - Add response validation requirements to API design standards
   - Document the validation workflow

### Phase 5: RaceEdit Tab System Refactoring (CURRENT PRIORITY)

#### Step 1: RaceEdit UI Enhancement
**Status**: Phase 1 COMPLETED - Shared FeaturesTab component created and tested
**Impact**: Will provide consistent UX between Class and Race editing
**Priority**: HIGH - Required for feature parity and user experience consistency

**Phase 1 COMPLETED**:
- ✅ Created shared FeaturesTab component at `frontend/src/components/feature-system/FeaturesTab.tsx`
- ✅ Added context-specific configuration (class/race, contextId, excludeSpecialFeatures)
- ✅ Updated FeatureSelectionDialog to support both classId and raceId
- ✅ Refactored ClassEdit FeaturesTab to use shared component
- ✅ Verified ClassEdit functionality remains intact

**Phase 2 COMPLETED**:
- ✅ Created race tab infrastructure at `frontend/src/features/race/tabs/`
- ✅ Defined RaceTabProps interface and RaceFormData type
- ✅ Set up barrel exports for all tab components

**Phase 3 COMPLETED**:
- ✅ Implemented BasicInfoTab with form fields for basic race information
- ✅ Implemented AbilitiesTab with ability adjustment UI using existing feature system
- ✅ Implemented LanguagesTab with language management UI using existing feature system
- ✅ Implemented FeaturesTab using shared FeaturesTab component with race-specific configuration
- ✅ Implemented DescriptionTab with markdown editor for race description

**Phase 4 COMPLETED**:
- ✅ Converted RaceEdit.tsx to tab-based layout with navigation
- ✅ Integrated all tab components with proper state management
- ✅ Maintained all existing functionality and feature system integration
- ✅ Added missing callback functions for feature management

**Implementation Strategy**:
1. **Create Shared FeaturesTab Component**
   - Move `frontend/src/features/class/tabs/FeaturesTab.tsx` to `frontend/src/components/feature-system/FeaturesTab.tsx`
   - Make it configurable for different contexts (class, race, etc.)
   - Add context-specific props for filtering and configuration

2. **Create Race Tab Infrastructure**
   - Create `frontend/src/features/race/tabs/` directory structure
   - Implement tab components: BasicInfoTab, AbilitiesTab, LanguagesTab, FeaturesTab, DescriptionTab
   - Define `RaceTabProps` interface similar to `ClassTabProps`

3. **Convert RaceEdit to Tab-Based Layout**
   - Refactor `frontend/src/features/race/RaceEdit.tsx` to use tab navigation
   - Maintain existing feature system integration (no changes needed)
   - Reuse shared FeaturesTab component with race-specific configuration

4. **Feature System Integration**
   - No changes needed - abilities and languages already use feature system correctly
   - Regular features will use full FeatureProgression system through shared component
   - Maintain existing special feature handling (SpecialFeatureId.AbilityAdjustment, etc.)

**Benefits**:
- **Consistency**: Identical UX patterns between Class and Race editing
- **Code Reuse**: Single source of truth for feature display logic
- **Feature Parity**: Races get same advanced feature management as classes
- **Maintainability**: Better organization without breaking existing functionality

**Success Criteria**:
- Race editing has same capabilities as Class editing
- Identical navigation and interaction patterns
- All existing race data continues to work unchanged
- No significant performance impact
- Better code organization without breaking existing functionality

### Phase 5: Weapon Familiarity System Implementation - ✅ COMPLETED

#### Step 1: Schema and Enum Updates
**Status**: ✅ COMPLETED
**Impact**: Add support for racial weapon familiarity (dwarf/gnome weapon familiarity)
**Priority**: HIGH - Required for complete racial feature modeling

**Implementation Details**:
```typescript
// Add new enum value to FeatureSpecialEffectType
export const FeatureSpecialEffectType = {
    Proficiency: 0,
    FavoredEnemy: 1,
    ConditionalUpgrade: 2,
    TurnUndead: 3,
    WildShapeForm: 4,
    WildShapeSize: 5,
    WeaponFamiliarity: 6,  // NEW
    Other: 7,              // Updated from 6 to 7
} as const;

// Update FEATURE_SPECIAL_EFFECT_TYPES
export const FEATURE_SPECIAL_EFFECT_TYPES: BaseMap<CoreComponent> = {
    // ... existing types ...
    [FeatureSpecialEffectType.WeaponFamiliarity]: { 
        id: FeatureSpecialEffectType.WeaponFamiliarity, 
        name: 'Weapon Familiarity' 
    },
    [FeatureSpecialEffectType.Other]: { 
        id: FeatureSpecialEffectType.Other, 
        name: 'Other' 
    },
};
```

**Data Model**:
- Use `FeatureSpecialEffect.numericValue` to store the `itemId` of the weapon
- Effect type `WeaponFamiliarity` (6) indicates weapon familiarity
- No additional schema changes required

#### Step 2: UI Enhancements
**Status**: ✅ COMPLETED
**Impact**: Add exotic weapon selection to FeatureProgressionDetailEdit
**Priority**: HIGH - Required for weapon familiarity feature creation

**Implementation Details**:
```typescript
// Add to FeatureProgressionDetailEdit.tsx
const [exoticWeapons, setExoticWeapons] = useState<ProficiencyItem[]>([]);
const [loadingExoticWeapons, setLoadingExoticWeapons] = useState(false);

const isWeaponFamiliarityEffect = effect.effectType === FeatureSpecialEffectType.WeaponFamiliarity;

// Load exotic weapons when WeaponFamiliarity is selected
useEffect(() => {
    if (isWeaponFamiliarityEffect) {
        loadExoticWeapons();
    }
}, [isWeaponFamiliarityEffect]);

const loadExoticWeapons = async () => {
    setLoadingExoticWeapons(true);
    try {
        const items = await ItemService.itemQuery();
        const exoticWeaponItems = items
            .filter(item => 
                item.typeId === ITEM_TYPE_ENUM.WEAPON && 
                item.weapon?.category === WEAPON_CATEGORY_ENUM.EXOTIC
            )
            .map(item => ({
                id: item.id,
                name: item.name,
                typeId: item.typeId,
                weapon: item.weapon
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        setExoticWeapons(exoticWeaponItems);
    } catch (error) {
        console.error('Failed to load exotic weapons:', error);
    } finally {
        setLoadingExoticWeapons(false);
    }
};
```

**UI Structure**:
- Add exotic weapon dropdown when `WeaponFamiliarity` effect type is selected
- Filter to show only exotic weapons (category 3)
- Sort alphabetically for easy selection
- Store selected weapon ID in `numericValue` field

#### Step 3: Display Logic Updates
**Status**: ✅ COMPLETED
**Impact**: Show weapon familiarity effects in race details and editing
**Priority**: HIGH - Required for proper feature display

**Implementation Details**:
```typescript
// Update formatProgression function in Formatters.ts
export function formatProgression(progression: FeatureProgressionWithRelations): string {
    // ... existing logic ...
    
    // Handle weapon familiarity effects
    const weaponFamiliarityEffects = progression.effects.filter(
        effect => effect.effectType === FeatureSpecialEffectType.WeaponFamiliarity
    );
    
    if (weaponFamiliarityEffects.length > 0) {
        const familiarityDetails = weaponFamiliarityEffects
            .map(effect => {
                const weaponName = effect.item?.name || `weapon ${effect.numericValue}`;
                return `treat ${weaponName} as martial weapon`;
            })
            .join(', ');
        
        note = familiarityDetails;
    } else if (proficiencyEffects.length > 0) {
        // ... existing proficiency logic ...
    } else {
        // ... existing fallback logic ...
    }
    
    return `${levelText}${note ? ` (${note})` : ''}`;
}
```

**Display Format**:
- Show as "treat [weapon name] as martial weapon"
- Multiple weapons: "treat dwarven waraxe, dwarven urgrosh as martial weapons"
- Integrate with existing progression display system

#### Step 4: Racial Feature Implementation
**Status**: Ready for implementation
**Impact**: Create dwarf and gnome weapon familiarity features
**Priority**: HIGH - Required for complete racial feature modeling

**Dwarf Weapon Familiarity**:
```typescript
const dwarfWeaponFamiliarity: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: DWARF_RACE_ID,
    effects: [
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: DWARVEN_WARAXE_ITEM_ID,
            description: "Treat dwarven waraxe as martial weapon"
        },
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: DWARVEN_URGROSH_ITEM_ID,
            description: "Treat dwarven urgrosh as martial weapon"
        }
    ]
};
```

**Gnome Weapon Familiarity**:
```typescript
const gnomeWeaponFamiliarity: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: GNOME_RACE_ID,
    effects: [
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: GNOME_HOOKED_HAMMER_ITEM_ID,
            description: "Treat gnome hooked hammer as martial weapon"
        }
    ]
};
```

#### Step 5: Runtime Logic (Future)
**Status**: Future enhancement
**Impact**: Character proficiency calculation will consider weapon familiarity
**Priority**: MEDIUM - Required for complete character sheet functionality

**Implementation Strategy**:
```typescript
// Pseudo-code for character proficiency calculation
function isProficientWithWeapon(character, weaponId) {
    // Check for weapon familiarity effects
    const familiarityEffects = character.getWeaponFamiliarityEffects();
    const familiarWeapon = familiarityEffects.find(effect => effect.numericValue === weaponId);
    
    // If weapon has familiarity, treat it as martial for proficiency purposes
    const effectiveCategory = familiarWeapon ? WEAPON_CATEGORY_ENUM.MARTIAL : weapon.category;
    
    // Check proficiency based on effective category
    return character.hasProficiencyForCategory(effectiveCategory);
}
```

**Benefits**:
- **Semantic Accuracy**: Clearly represents "weapon familiarity" concept
- **Simple Data Model**: Uses existing `numericValue` field for itemId
- **Extensible**: Can handle future weapon familiarity rules
- **Clear UI**: Dedicated dropdown for exotic weapons
- **Consistent Display**: Uses existing formatting patterns
- **No Breaking Changes**: Adds new enum value without affecting existing functionality

**Success Criteria**:
- Dwarf weapon familiarity displays correctly in race details
- Gnome weapon familiarity displays correctly in race details
- UI allows selection of exotic weapons for familiarity effects
- Formatters show weapon familiarity in readable format
- No impact on existing feature system functionality

### Phase 6: Feature Resolution Service (FUTURE ENHANCEMENT)

#### Step 1: Runtime Feature Resolution
**Status**: Future enhancement - not blocking current development
**Impact**: Will enable dynamic feature calculation based on equipment, situation, etc.
**Priority**: MEDIUM - Required for advanced character sheet functionality

**Architecture Overview**:
```typescript
interface FeatureResolutionService {
    // Resolve all features that apply to a character at runtime
    resolveCharacterFeatures(characterId: number, context: RuntimeContext): Promise<ResolvedFeature[]>
    
    // Evaluate conditional modifiers based on equipment, situation, etc.
    evaluateConditions(modifier: FeatureModifier, context: RuntimeContext): Promise<boolean>
    
    // Calculate final character stats with all feature bonuses
    calculateCharacterStats(characterId: number): Promise<CalculatedStats>
}

interface RuntimeContext {
    equippedItems: Item[]
    activeEffects: Effect[]
    combatSituation?: CombatContext
    environment?: EnvironmentContext
}
```

**Future Use Cases**:
- **Ring of Evasion**: Grant Evasion feature only when ring is equipped
- **Trap Sense**: Grant bonuses only vs trap attacks
- **Dwarven Giant Fighting**: Grant bonuses only when fighting giants
- **Rage Bonuses**: Grant bonuses only when raging
- **Situational Bonuses**: AC bonuses vs specific attack types

**Implementation Strategy**:
1. **Equipment Integration**: Connect feature resolution to character inventory
2. **Conditional Evaluation**: Implement runtime condition checking
3. **Performance Optimization**: Cache resolved features for performance
4. **Character Sheet Integration**: Display conditional bonuses (e.g., "AC: 15 (17 vs traps)")

#### Step 2: Backend Character Calculation
**Status**: Future enhancement - depends on Feature Resolution Service
**Impact**: Character calculations will use formula evaluation and feature resolution
**Priority**: MEDIUM - Required for complete character sheet functionality

**Implementation Steps**:
1. **Create Character Calculation Service**
   - File: `backend/src/features/characterCalculation/characterCalculationService.ts`
   - Import formula definitions from `@shared/static-data`
   - Create `calculateCharacterStats()`
