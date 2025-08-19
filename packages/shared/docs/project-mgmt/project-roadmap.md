# D&D 3.5 Character System Development Roadmap

*High-level project overview for AI agents. Detailed implementation tasks are tracked in the Cursor TODO system.*

## Project Goal
**D&D 3.5 Character Generation and Management System** - Complete character creation with printable character sheet for between-session use.

## Current Status
**Phase**: Formula Integration
**Progress**: ~40% complete

## Key Deliverables
- ✅ Basic character creation workflow
- ✅ Class/race management with feature association
- ✅ Feature system data structures and UI
- ✅ Formula definitions library
- ⏳ Formula integration (CRITICAL GAP)
- ⏳ Feature resolution service (CRITICAL GAP)
- ⏳ Character sheet generation and export
- ⏳ Character level-up workflow with feature integration
- ⏳ D&D 3.5 rule validation

## Current Focus
**Task**: Implement formula integration and feature resolution service
**Status**: Formula definitions exist, no integration with UI or backend
**Next**: Connect formulaId to formula definitions in frontend and backend

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

### Phase 1: Formula Integration
1. **Frontend Formula Integration**
   - Connect formulaId to formula definitions in UI
   - Add formula selector dropdown in FeatureProgressionDetailEdit
   - Create formula preview system for editing
   - Add formula validation and error handling

2. **Backend Character Calculation**
   - Create character calculation service
   - Add API endpoint for calculated character stats
   - Integrate formula evaluation with character data
   - Handle formula context (level, ability scores, etc.)

### Phase 2: Feature Resolution
1. **Feature Resolution Service**
   - Resolve which features apply to a character
   - Handle feature prerequisites validation
   - Apply D&D 3.5 stacking rules
   - Resolve feature choices and conditions

2. **Character Sheet Display**
   - Create comprehensive character sheet view
   - Show all calculated stats and features
   - Display feature sources and modifiers
   - Support for printing

### Phase 3: Advanced Features
1. **Enhanced Validation**
   - Implement D&D 3.5 rule validation
   - Add prerequisite checking
   - Validate feature combinations
   - Provide helpful error messages

2. **UI Improvements**
   - Add level-based feature view
   - Implement real-time validation
   - Enhance feature display
   - Add bulk operations

## Key Files
- **Current**: `frontend/src/components/feature-system/FeatureProgressionDetailEdit.tsx`
- **Schema**: `shared/schema/src/feature.ts`
- **Character System**: `frontend/src/features/character/CharacterEdit.tsx`
- **Formula Library**: `shared/static-data/src/FormulaDefinitions.ts`
- **Missing**: Frontend formula calculator, backend character calculation service

## Recent Progress
- ✅ FeaturePrerequisite moved to Feature level
- ✅ formulaId field implemented (replaces valueFormula)
- ✅ FeatureProgressionDetailEdit dialog complete
- ✅ Character advancement system working
- ✅ Formula definitions library complete
- ⏳ Formula integration (CRITICAL MISSING)
- ⏳ Feature resolution service (CRITICAL MISSING)

## Critical Gaps

### 1. Formula Integration
**Status**: Formula definitions exist, no integration with UI or backend
**Impact**: Scaling features don't work (Sneak Attack, Rage bonuses)
**Priority**: HIGHEST

### 2. Feature Resolution Service
**Status**: Schema complete, no calculation logic
**Impact**: Features don't apply bonuses to characters
**Priority**: HIGHEST

### 3. Character Sheet Generation
**Status**: Basic tabs exist, no comprehensive sheet
**Impact**: No way to see calculated character stats
**Priority**: HIGH

### 4. Integration Between Systems
**Status**: Systems exist separately, not connected
**Impact**: Features don't affect character calculations
**Priority**: HIGH

## Implementation Strategy

### Frontend Formula Integration
1. **Create formula calculator utility**
   - File: `frontend/src/lib/formulaCalculator.ts`
   - Import formula definitions from `@shared/static-data`
   - Create `calculateModifierValue()` function
   - Create `previewFormula()` function for editing

2. **Update FeatureProgressionDetailEdit**
   - Replace text input with formula selector
   - Add formula preview panel
   - Show calculated values for different levels
   - Add formula parameter input fields

3. **Add formula validation**
   - Validate formulaId during input
   - Show error messages for invalid formulas
   - Prevent saving invalid formula configurations

### Backend Character Calculation
1. **Create character calculation service**
   - File: `backend/src/features/characterCalculation/characterCalculationService.ts`
   - Import formula definitions from `@shared/static-data`
   - Create `calculateCharacterStats()` function
   - Handle formula evaluation with character context

2. **Add character calculation API**
   - Endpoint: `GET /api/characters/:id/calculated-stats`
   - Return calculated character stats with feature modifiers
   - Include formula evaluation results

3. **Integrate with existing character service**
   - Update character service to use calculation service
   - Ensure consistent calculation across all endpoints
   - Add caching for performance

## Success Criteria
- [ ] Formula evaluation working in frontend for class editing
- [ ] Formula preview showing calculated values during editing
- [ ] Backend character calculation service functional
- [ ] Features apply bonuses to character stats
- [ ] Character sheet displays all calculated values
- [ ] PDF export produces usable character sheets
- [ ] Level-up process integrates with feature system
- [ ] Basic D&D 3.5 rule validation working

## Next Steps

### Immediate (Week 1-2)
1. **Create frontend formula calculator utility**
2. **Update FeatureProgressionDetailEdit with formula selector**
3. **Add formula preview functionality**

### Short Term (Week 3-4)
1. **Create backend character calculation service**
2. **Add character calculation API endpoint**
3. **Test formula integration end-to-end**

### Medium Term (Week 5-6)
1. **Create feature resolution service**
2. **Implement character sheet display**
3. **Add D&D 3.5 rule validation**

The roadmap now accurately reflects the current state and provides a clear path forward with the hybrid formula evaluation approach.
