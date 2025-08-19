# Feature System Implementation Plan

This document provides a detailed implementation strategy for the D&D Tools Feature System, updated to reflect current implementation status.

## Current Status Assessment

### ✅ Completed (85% of core functionality)
- **Feature System Data Structures**: All schemas implemented and working
- **FeatureProgressionDetailEdit UI**: Complete with formula input, conditions, choices, and dynamic formula preview
- **Character Advancement System**: Basic level-up workflow exists
- **API Endpoints**: Feature CRUD and bulk operations functional
- **Character Creation Workflow**: Basic functionality implemented
- **Formula System**: Complete implementation with FeatureModifierFormulaParams model for parameterized formulas
- **Formula Testing**: EVERY_N_LEVELS formula tested with Barbarian class features
- **Formula Display**: Formula-based progressions display correctly in both edit and detail views
- **FeatureModifierFormulaParams**: Database model for storing formula-specific parameters (interval, formulaStartLevel)
- **Formula Preview UI**: Dynamic preview showing actual progression patterns in edit dialog
- **Schema Validation**: Fixed validation issues with optional formula parameters
- **Backend Integration**: Complete backend support for new formula parameter structure
- **Class Modeling**: Barbarian class successfully modeled with formula-based features
- **Formula Calculator**: Complete implementation with FeatureModifierFormulaParams support
- **Formula Definitions**: 5 generic formulas covering D&D 3.5 scaling patterns
- **Frontend Formula Integration**: Complete formula selection, preview, and validation
- **Backend Formula Support**: Complete backend support for formula parameter creation and loading
- **Feature Prerequisites**: Schema and UI complete, moved to feature level
- **Database Schema**: Complete with all feature system models and relationships
- **Spellcasting Database Schema**: Complete spellcasting models (SpellcastingProgression, SpellcastingSlot, SpellcastingLink)
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

### ⏳ Partially Implemented (10% of core functionality)
- **Formula System Testing**: Only EVERY_N_LEVELS formula tested, other formulas need validation
- **Class Feature Modeling**: Barbarian completed, **Bard features modeled but not fully tested**
- **Feature Prerequisites**: Schema and UI exist, but **NO VALIDATION LOGIC**
- **Character Integration**: Basic structure exists, calculation missing
- **Character Sheet Tabs**: Basic tabs exist (Abilities, Feats, Skills, Class, Description, Equipment) but no formula integration
- **PDF Export**: No export functionality

### ❌ Critical Missing (5% of core functionality)
- **Feature Resolution Service**: No runtime calculation for character sheets
- **Feature Prerequisites Validation**: No enforcement logic
- **Character Sheet Generation**: No comprehensive display with calculated values
- **Backend Character Calculation**: No formula evaluation in character calculations

## Phase-Based Implementation Approach

### Phase 1: Critical Path (HIGHEST PRIORITY)

#### Step 1: ClassEdit Tab System Refactoring ✅ COMPLETED
**Status**: ✅ COMPLETED - All phases successfully implemented

**Implementation Details**:
- **Tab Infrastructure**: Complete navigation and state management
- **All 7 Tab Components**: Fully functional with enhanced UX
- **Type Safety**: Proper TypeScript types throughout (no `any` usage)
- **Schema Integration**: Uses official Zod schema types
- **Barrel Exports**: Clean import structure
- **Dialog Integration**: All dialogs work correctly
- **State Management**: Centralized state with props passing

**Completed Components**:
1. **BasicInfoTab** - Core class information with proper form handling
2. **ProgressionTab** - Two-column layout with type inputs and full progression preview
3. **SkillsTab** - Enhanced display with skill details, truncation, and markdown rendering
4. **ProficienciesTab** - Enhanced display with feat/item details and dynamic loading
5. **FeaturesTab** - Sorted by level with prerequisites and markdown descriptions
6. **SpellcastingTab** - Placeholder for spell progression management
7. **DescriptionTab** - Markdown editor for class description

**Technical Achievements**:
- **No `any` Usage**: All components use proper TypeScript types
- **Schema Compliance**: Uses `FeatureProgressionWithRelations` and other schema types
- **Validation Integration**: Proper validation state handling
- **Performance**: Efficient state management and rendering
- **Maintainability**: Modular, focused components
- **Reusability**: Tab components can be reused in other contexts

#### Step 2: Enhanced Spell Progression Management ✅ COMPLETED
**Status**: ✅ COMPLETED - Full spell progression editor with casting type and spells known support
**Impact**: Users can now create complete spell progression data including casting type and spells known

**Implementation Completed**:
1. **✅ Zod Schemas Updated**
   - File: `shared/schema/src/class.ts`
   - Added `spellsKnown: z.boolean().default(false)` to `BaseClassSchema`
   - Added `spellsKnownProgression` to `BaseClassSchema`
   - Added `castingType: CastingTypeEnumSchema.nullable()` to `BaseClassSchema`
   - Updated `GetClassResponseSchema` to include spells known progression data

2. **✅ Backend Service Extended**
   - File: `backend/src/features/class/classService.ts`
   - Updated `createClass` method to handle both spell slots and spells known progressions
   - Updated `updateClass` method to handle both progressions and link spells known via `classSpellsKnownId`
   - Added proper deletion of existing spellcasting data on updates
   - Included spells known progression in `getClassById` response

3. **✅ Frontend Types Updated**
   - File: `frontend/src/lib/ClassProgression.ts`
   - Added `spellsKnownProgression` to `ClassProgressionConfig` interface
   - Updated `generateClassProgression` to process spells known data
   - Added `spellsKnown` property to `ProgressionRow` interface

4. **✅ SpellcastingTab Component Enhanced**
   - File: `frontend/src/features/class/tabs/SpellcastingTab.tsx`
   - Added Casting Type selection (Prepared/Spontaneous)
   - Added "Has Spells Known" checkbox
   - Added second `SpellProgressionEditor` for spells known progression
   - Added state management for spells known progression data
   - Integrated shared "How to Use" info box

5. **✅ ClassEdit Component Updated**
   - File: `frontend/src/features/class/ClassEdit.tsx`
   - Added `spellsKnownProgression` state
   - Included spells known data in form submission
   - Load spells known data from backend

6. **✅ ClassDisplay Component Updated**
   - File: `frontend/src/features/class/ClassDisplay.tsx`
   - Pass `spellsKnownProgression` to `generateClassProgression`
   - Display casting type in class info section

7. **✅ Static Data Added**
   - File: `shared/static-data/src/CommonData.ts`
   - Added `CASTING_TYPE_SELECT_LIST` for Prepared/Spontaneous options

8. **✅ Generic Spell Progression Components**
   - File: `frontend/src/components/spell-progression/SpellProgressionEditor.tsx`
   - File: `frontend/src/components/spell-progression/SpellSlotGrid.tsx`
   - File: `frontend/src/components/spell-progression/SpellProgressionPreview.tsx`
   - Reusable components for spell progression editing
   - Keyboard navigation with arrow keys
   - Independent grid instances with unique IDs
   - Reset functionality to restore original state

**Technical Achievements**:
- **Generic Components**: Reusable spell progression components for future use
- **Keyboard Navigation**: Arrow key navigation within each grid independently
- **Data Integrity**: Proper reset functionality to restore original state
- **Type Safety**: Full TypeScript integration with schema types
- **UX Optimization**: Removed unnecessary row highlighting and Quick Fill functionality
- **Schema Integration**: Complete integration with Zod schemas and Prisma models
   - Add proper deletion of existing spellcasting data on updates
   - Include spells known progression in `getClassById` response

3. **Update Frontend Types**
   - File: `frontend/src/lib/ClassProgression.ts`
   - Add `spellsKnownProgression` to `ClassProgressionConfig` interface
   - Update `generateClassProgression` to process spells known data
   - Add `spellsKnown` property to `ProgressionRow` interface

4. **Enhance SpellcastingTab Component**
   - File: `frontend/src/features/class/tabs/SpellcastingTab.tsx`
   - Add Casting Type selection (Prepared/Spontaneous)
   - Add "Has Spells Known" checkbox
   - Add second `SpellProgressionEditor` for spells known progression
   - Add state management for spells known progression data

5. **Update ClassEdit Component**
   - File: `frontend/src/features/class/ClassEdit.tsx`
   - Add `spellsKnownProgression` state
   - Include spells known data in form submission
   - Load spells known data from backend

6. **Update ClassDisplay Component**
   - File: `frontend/src/features/class/ClassDisplay.tsx`
   - Pass `spellsKnownProgression` to `generateClassProgression`
   - Display casting type in class info section

7. **Add Static Data**
   - File: `frontend/src/shared/static-data.ts` (or appropriate location)
   - Add `CASTING_TYPE_SELECT_LIST` for Prepared/Spontaneous options

**Data Flow**:
- UI sends: `CreateSpellcastingProgressionRequest[]` for spell slots + spells known
- Backend creates: Two separate `SpellcastingProgression` records
- Backend links: Spells known progression via `classSpellsKnownId` relation
- Frontend displays: Both progressions in integrated table with different column headers

**Schema Structure**:
- `Class.spellsKnown: Boolean` - flag for spells known progression
- `Class.spellcastingProgression[]` - for spell slots per day
- `Class.classSpellsKnown[]` - relation to spells known progression
- `SpellcastingProgression.classSpellsKnownId` - optional FK to link as spells known
   - Add spell progression validation to form validation
   - Ensure spell progression data is included in form submission

3. **Create Spell Progression Editor Component**
   - File: `frontend/src/components/spell-progression/SpellProgressionEditor.tsx`
   - Caster level mapping (class level → caster level)
   - Support for delayed casters (caster level 0 for early levels)
   - Support for partial casters (limited spell levels)
   - Bulk editing capabilities
   - Real-time validation with visual feedback

4. **Create Spell Slot Grid Component**
   - File: `frontend/src/components/spell-progression/SpellSlotGrid.tsx`
   - Grid display (class level × spell level)
   - Cell editing for spell slots per day
   - Support for 0-9 spell levels
   - Support for 1-20 class levels
   - Bulk editing capabilities
   - Validation for spell progression rules

5. **Create Spell Progression Preview Component**
   - File: `frontend/src/components/spell-progression/SpellProgressionPreview.tsx`
   - Progression table display
   - Level indicators (caster level vs class level)
   - Validation display
   - Export format for character sheets

6. **Enhance SpellcastingTab Component**
   - File: `frontend/src/features/class/tabs/SpellcastingTab.tsx`
   - Replace placeholder with functional spell progression editor
   - Integrate SpellProgressionEditor, SpellSlotGrid, and SpellProgressionPreview components
   - Add state management for spell progression data using existing schema types
   - Integrate with existing class form data and validation
   - Use existing class service for save/update operations

**Data Flow**:
- UI sends: `CreateSpellcastingProgressionRequest[]` (validated by Zod)
- Each progression has: `{ casterLevel: number, slots: CreateSpellcastingSlotRequest[] }`
- Backend creates: `SpellcastingProgression` + `SpellcastingSlot` records

#### Step 3: Backend Character Calculation
**Status**: Not implemented
**Impact**: Character calculations don't use formulas

**Implementation Steps**:
1. **Create Character Calculation Service**
   - File: `backend/src/features/characterCalculation/characterCalculationService.ts`
   - Import formula definitions from `@shared/static-data`
   - Create `calculateCharacterStats()` function
   - Add formula evaluation for character features

2. **Add Character Calculation Endpoints**
   - Create `GET /api/characters/:id/stats` endpoint
   - Create `POST /api/characters/:id/calculate` endpoint
   - Add formula validation endpoints

#### Step 4: Feature Resolution Service
**Status**: Schema complete, no implementation
**Impact**: Character features don't apply bonuses to stats

**Implementation Steps**:
1. **Create Feature Resolution Service**
   - File: `backend/src/features/featureResolution/featureResolutionService.ts`
   - Implement feature resolution logic
   - Add prerequisite checking
   - Add choice resolution

2. **Add Feature Resolution Endpoints**
   - Create `GET /api/characters/:id/resolved-features` endpoint
   - Create `POST /api/characters/:id/resolve-features` endpoint
   - Add feature validation endpoints

### Phase 2: Enhancement (Depends on Phase 1)

#### Step 1: Feature Prerequisites Validation
**Status**: Schema and UI exist, no logic
**Impact**: No enforcement of feature requirements

**Implementation Steps**:
1. **Create Prerequisites Validation Service**
   - File: `backend/src/features/featurePrerequisites/featurePrerequisitesService.ts`
   - Implement level-based prerequisite checking
   - Implement skill-based prerequisite checking
   - Implement feat-based prerequisite checking

2. **Add Prerequisites Validation Endpoints**
   - Create `POST /api/features/:id/validate-prerequisites` endpoint
   - Create `GET /api/characters/:id/prerequisites` endpoint
   - Add prerequisite validation to character creation/level-up

#### Step 2: Character Sheet Integration
**Status**: Basic structure exists, no formula integration
**Impact**: Character sheets don't show calculated feature bonuses

**Implementation Steps**:
1. **Update Character Sheet Components**
   - Enhance `AbilitiesRaceTab.tsx` to show calculated bonuses
   - Enhance `SkillsTab.tsx` to show calculated bonuses
   - Enhance `FeatsTab.tsx` to show calculated bonuses
   - Add formula evaluation to character stat calculations

2. **Add Character Stat Calculation**
   - Create character stat calculation service
   - Add formula evaluation to character calculations
   - Add feature breakdown display

#### Step 3: PDF Export
**Status**: Not implemented
**Impact**: No printable character sheets

**Implementation Steps**:
1. **Create PDF Export Service**
   - File: `backend/src/features/pdfExport/pdfExportService.ts`
   - Generate printable character sheets
   - Include all character information in PDF
   - Support custom layouts

2. **Add PDF Export Endpoints**
   - Create `GET /api/characters/:id/pdf` endpoint
   - Add character art support
   - Add custom layout support

### Phase 3: Advanced Features (Depends on Phase 2)

#### Step 1: D&D 3.5 Rule Validation
**Status**: Not implemented
**Impact**: No rule compliance checking

**Implementation Steps**:
1. **Implement Basic Rule Validation**
   - File: `backend/src/features/ruleValidation/ruleValidationService.ts`
   - Add prerequisite enforcement
   - Add stacking rule validation
   - Add multiclass rule validation
   - Add spellcasting rule validation

2. **Add Rule Validation Endpoints**
   - Create `POST /api/characters/:id/validate-rules` endpoint
   - Add rule violation reporting
   - Add rule compliance checking

#### Step 2: UI Improvements
**Status**: Basic UI exists
**Impact**: Limited usability

**Implementation Steps**:
1. **Add Level-Based Character Sheet Views**
   - Add progression tracking UI
   - Add feature comparison tools
   - Add template system
   - Add quick-start templates

2. **Performance Optimization**
   - Add caching for calculated character stats
   - Add caching for formula evaluation results
   - Add batch processing for character calculations
   - Add background processing for heavy calculations
   - Optimize database queries

## Key Files for Implementation

### Current Working Files
- `frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx` - Formula input UI
- `shared/schema/src/feature.ts` - Feature system schemas with formulaId
- `frontend/src/features/character/CharacterEdit.tsx` - Character creation UI
- `backend/src/features/featureSystem/featureSystemService.ts` - Feature CRUD operations
- `shared/static-data/src/FormulaDefinitions.ts` - Complete formula library
- `frontend/src/lib/formulaCalculator.ts` - Formula calculation utilities
- `frontend/src/lib/Formatters.ts` - Formula display and progression formatting
- `frontend/src/features/class/ClassEdit.tsx` - ✅ REFACTORED - Tab-based class editing
- `frontend/src/features/class/ClassDisplay.tsx` - Class detail view with formula expansion
- `backend/src/features/class/classService.ts` - Backend class service with formula support
- `backend/prisma/schema.prisma` - Database schema with FeatureModifierFormulaParams
- `shared/schema/src/spellcasting.ts` - Spellcasting validation schemas
- `shared/schema/src/class.ts` - Class schemas with spellcasting support
- **ClassEdit Tab Components** ✅ COMPLETED:
  - `frontend/src/features/class/tabs/BasicInfoTab.tsx`
  - `frontend/src/features/class/tabs/ProgressionTab.tsx`
  - `frontend/src/features/class/tabs/SkillsTab.tsx`
  - `frontend/src/features/class/tabs/ProficienciesTab.tsx`
  - `frontend/src/features/class/tabs/FeaturesTab.tsx`
  - `frontend/src/features/class/tabs/SpellcastingTab.tsx`
  - `frontend/src/features/class/tabs/DescriptionTab.tsx`
  - `frontend/src/features/class/tabs/types.ts`
  - `frontend/src/features/class/tabs/index.ts`

### Missing Implementation Files
- Backend character calculation service (new service)
- Feature resolution service (new service)
- Feature prerequisite validation (new service)
- Character sheet component with formula integration (enhance existing)
- PDF export functionality (new service)
- D&D 3.5 rule validation (new service)
- **Spell Progression Components** (new components):
  - `frontend/src/components/spell-progression/SpellProgressionEditor.tsx`
  - `frontend/src/components/spell-progression/SpellSlotGrid.tsx`
  - `frontend/src/components/spell-progression/SpellProgressionPreview.tsx`

## Dependencies and Critical Path

### Blocking Dependencies
- **Spell Progression Management** blocks class creation for spellcasters
- **Backend Character Calculation** blocks character sheet display
- **Feature Resolution Service** blocks character stat calculations
- **Feature Prerequisites Validation** blocks rule compliance

### Non-Blocking Dependencies
- **Formula System Testing** can be done in parallel
- **Class Feature Modeling** can be done in parallel
- **UI Improvements** can be done in parallel
- **PDF Export** depends on character sheet completion

## Success Criteria

### Phase 1 Success (Critical)
- [x] ClassEdit tab refactoring complete with all 7 tabs functional ✅ COMPLETED
- [x] Tab navigation and state management working correctly ✅ COMPLETED
- [x] All existing functionality preserved in tab structure ✅ COMPLETED
- [x] Dialog integration working across tabs ✅ COMPLETED
- [ ] Spell progression UI functional for creating/editing data
- [ ] Backend character calculation service functional
- [ ] Features apply bonuses to character stats
- [ ] Feature prerequisites are validated and enforced
- [ ] Character sheet displays calculated values

### Phase 2 Success (High)
- [ ] PDF export produces usable character sheets
- [ ] D&D 3.5 rule validation prevents errors
- [ ] Level-up process integrates with feature system
- [ ] Spell progression management complete

### Phase 3 Success (Medium)
- [ ] Advanced UI features enhance usability
- [ ] Performance optimizations improve speed
- [ ] System is ready for production use

## Risk Assessment

### High Risk
- **Spell Progression Management**: Critical for class creation, no workaround
- **Backend Character Calculation**: Complex formula evaluation, security concerns
- **Feature Resolution Service**: Complex feature interaction logic

### Medium Risk
- **Feature Prerequisites Validation**: Complex rule logic, edge cases
- **Character Sheet Integration**: UI complexity, performance concerns
- **Formula System Testing**: Multiple formula types, validation complexity

### Low Risk
- **UI Improvements**: Cosmetic changes, low impact
- **PDF Export**: Third-party library integration
- **Performance Optimization**: Optimization, not core functionality

## Next Steps

1. **Implement spell progression management** - Create UI for creating/editing spell progression data
2. **Test formula system with Bard class** - Validate formulas with different class features
3. **Model remaining core classes** - Test all formula types across different classes
4. **Validate all formula types** - Ensure Linear, Conditional, Resource, and Dice formulas work correctly
5. **Implement backend character calculation** - Secure calculation for character sheets
6. **Create feature resolution service** - Connect features to character calculations

The implementation plan now accurately reflects the current state and provides a clear path forward for completing the feature system.
