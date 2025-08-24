# RaceEdit Tab System Implementation Plan

## Overview

This document outlines the implementation plan for converting the monolithic RaceEdit component to a tab-based layout that matches the ClassEdit architecture, providing consistent UX patterns and enhanced feature management capabilities.

## Current State Analysis

### RaceEdit.tsx Current State
- **Monolithic Component**: 806 lines in a single file
- **Feature System Integration**: ✅ Correctly uses feature system for abilities and languages
  - Uses `SpecialFeatureId.AbilityAdjustment` with modifiers
  - Uses `SpecialFeatureId.AutomaticLanguage` and `SpecialFeatureId.BonusLanguage` with modifiers
- **Feature Display**: Basic list format with limited progression management
- **UI Organization**: Single page with all sections (basic info, abilities, languages, features, description)

### ClassEdit.tsx Reference State
- **Tab-Based Architecture**: 7 specialized tabs with clean separation of concerns
- **Feature System Integration**: ✅ Full integration with FeatureProgression system
- **Feature Display**: Advanced grouping, sorting, and progression management
- **UI Organization**: Tabbed interface for better user experience

## Implementation Strategy

### Phase 1: Create Shared FeaturesTab Component

#### Step 1: Move and Refactor FeaturesTab
**File**: `frontend/src/components/feature-system/FeaturesTab.tsx`

**Changes Required**:
1. Move `frontend/src/features/class/tabs/FeaturesTab.tsx` to shared location
2. Make component configurable for different contexts (class, race, etc.)
3. Add context-specific props for filtering and configuration

**Interface Design**:
```typescript
interface FeaturesTabProps {
    // Common props
    featureProgressions: FeatureProgressionWithRelations[];
    onEditProgression: (progression: FeatureProgressionWithRelations) => void;
    onRemoveProgression: (progressionId: number) => void;
    onAddFeature: (feature: { id: number; name: string; description: string; slug: string }) => void;
    
    // Context-specific props
    contextType: 'class' | 'race';
    contextId: number;
    
    // Special feature filtering
    excludeSpecialFeatures?: SpecialFeatureId[];
    
    // Dialog state management
    setEditingProgression: (progression: FeatureProgressionWithRelations | null) => void;
    setPreSelectedFeature: (feature: any) => void;
    setIsProgressionDialogOpen: (open: boolean) => void;
}
```

**Configuration Examples**:
```typescript
// Class context
<FeaturesTab
    contextType="class"
    contextId={parseInt(id)}
    excludeSpecialFeatures={[SpecialFeatureId.ClassSkill, SpecialFeatureId.ClassProficiency]}
    // ... other props
/>

// Race context
<FeaturesTab
    contextType="race"
    contextId={parseInt(id)}
    excludeSpecialFeatures={[SpecialFeatureId.AbilityAdjustment, SpecialFeatureId.AutomaticLanguage, SpecialFeatureId.BonusLanguage]}
    // ... other props
/>
```

### Phase 2: Create Race Tab Infrastructure

#### Step 1: Create Tab Directory Structure
**Directory**: `frontend/src/features/race/tabs/`

**Files to Create**:
```
frontend/src/features/race/tabs/
├── index.ts
├── types.ts
├── BasicInfoTab.tsx
├── AbilitiesTab.tsx
├── LanguagesTab.tsx
├── FeaturesTab.tsx
└── DescriptionTab.tsx
```

#### Step 2: Define Race Tab Types
**File**: `frontend/src/features/race/tabs/types.ts`

```typescript
export interface RaceTabProps {
    formData: RaceFormData;
    setFormData: (data: RaceFormData) => void;
    validation: ValidationState;
    isLoading?: boolean;
    featureProgressions?: FeatureProgressionWithRelations[];
    setFeatureProgressions?: (progressions: FeatureProgressionWithRelations[]) => void;
    
    // Dialog state and handlers
    isFeatureAssocOpen?: boolean;
    setIsFeatureAssocOpen?: (open: boolean) => void;
    isProgressionDialogOpen?: boolean;
    setIsProgressionDialogOpen?: (open: boolean) => void;
    editingProgression?: FeatureProgressionWithRelations | null;
    setEditingProgression?: (progression: FeatureProgressionWithRelations | null) => void;
    preSelectedFeature?: FeatureProgressionWithRelations['feature'] | null;
    setPreSelectedFeature?: (feature: FeatureProgressionWithRelations['feature'] | null) => void;
    
    // Feature management callbacks
    onEditProgression?: (progression: FeatureProgressionWithRelations) => void;
    onRemoveProgression?: (progressionId: number) => void;
    onAddFeature?: (feature: { id: number; name: string; description: string; slug: string }) => void;
    
    // Special feature callbacks (already implemented)
    onAddLanguage?: (languageId: number, isAutomatic: boolean) => void;
    onRemoveLanguage?: (languageId: number) => void;
    onAbilityChange?: (abilityId: number, parsedValue: number) => void;
    
    raceId?: number;
}
```

### Phase 3: Implement Individual Tab Components

#### Step 1: BasicInfoTab.tsx
**Purpose**: Basic race information (name, size, speed, favored class, edition, visibility)

**Implementation**:
- Move basic form fields from RaceEdit
- Reuse existing form components and validation
- No changes to feature system integration

#### Step 2: AbilitiesTab.tsx
**Purpose**: Ability adjustments using existing feature system

**Implementation**:
- Move existing ability adjustment UI and logic
- Keep current `handleAbilityChange` function and ability input handling
- No changes to feature system integration - already uses `SpecialFeatureId.AbilityAdjustment`

#### Step 3: LanguagesTab.tsx
**Purpose**: Language management using existing feature system

**Implementation**:
- Move existing language management UI and logic
- Keep current `handleAddLanguage` and `handleRemoveLanguage` functions
- No changes to feature system integration - already uses `SpecialFeatureId.AutomaticLanguage` and `SpecialFeatureId.BonusLanguage`

#### Step 4: FeaturesTab.tsx
**Purpose**: Regular features with full FeatureProgression management

**Implementation**:
- Reuse shared FeaturesTab component with race-specific configuration
- Filter out special features (abilities, languages) handled in other tabs
- Enable full progression management capabilities for regular features

#### Step 5: DescriptionTab.tsx
**Purpose**: Race description using markdown editor

**Implementation**:
- Move markdown editor for race description
- Reuse existing description handling

### Phase 4: Convert RaceEdit to Tab-Based Layout

#### Step 1: Update RaceEdit.tsx
**File**: `frontend/src/features/race/RaceEdit.tsx`

**Changes Required**:
1. Convert to tab-based navigation similar to ClassEdit
2. Integrate all tab components
3. Maintain existing state management and form handling
4. Keep all existing feature system integration unchanged

**Tab Configuration**:
```typescript
const tabs: TabConfig[] = [
    { id: 'basic', label: 'Basic Info', icon: DocumentTextIcon, component: BasicInfoTab },
    { id: 'abilities', label: 'Abilities', icon: UserIcon, component: AbilitiesTab },
    { id: 'languages', label: 'Languages', icon: AcademicCapIcon, component: LanguagesTab },
    { id: 'features', label: 'Features', icon: SparklesIcon, component: FeaturesTab },
    { id: 'description', label: 'Description', icon: DocumentTextIcon, component: DescriptionTab }
];
```

## Benefits of This Approach

### 1. Consistency
- **Identical UX Patterns**: Race and Class editing will have identical navigation and interaction patterns
- **Shared Components**: Reuse of proven UI components ensures consistency
- **Predictable Behavior**: Users will have the same experience across different entity types

### 2. Code Reuse
- **Single Source of Truth**: Feature display logic exists in one place
- **Shared Infrastructure**: Tab navigation, state management, and dialog handling
- **Reduced Duplication**: Eliminates need to maintain separate feature display logic

### 3. Feature Parity
- **Advanced Feature Management**: Races get the same progression editing capabilities as classes
- **Formula Support**: Full formula system integration for race features
- **Enhanced Display**: Grouping, sorting, markdown rendering, and progression preview

### 4. Maintainability
- **Better Organization**: Smaller, focused components are easier to maintain
- **Clear Separation**: Each tab handles a specific concern
- **Easier Testing**: Individual tab components can be tested in isolation

### 5. User Experience
- **Reduced Cognitive Load**: Better organization of information
- **Improved Navigation**: Tab-based layout is more intuitive
- **Enhanced Functionality**: Access to advanced feature management capabilities

## Success Criteria

### 1. Feature Parity
- [ ] Race editing has same capabilities as Class editing
- [ ] Full FeatureProgression management for regular features
- [ ] Formula support for race features
- [ ] Advanced feature display with grouping and sorting

### 2. Consistent UX
- [ ] Identical navigation and interaction patterns
- [ ] Same tab structure and styling
- [ ] Consistent dialog behavior
- [ ] Predictable user experience

### 3. Data Integrity
- [ ] All existing race data continues to work unchanged
- [ ] No breaking changes to feature system integration
- [ ] Existing abilities and languages continue to function
- [ ] Backward compatibility maintained

### 4. Performance
- [ ] No significant performance impact
- [ ] Efficient tab switching
- [ ] Optimized component rendering
- [ ] Minimal memory footprint

### 5. Code Quality
- [ ] Better organization without breaking existing functionality
- [ ] Reduced code duplication
- [ ] Improved maintainability
- [ ] Enhanced type safety

## Implementation Timeline

### Phase 1: Shared FeaturesTab Component ✅ COMPLETED
- ✅ Move and refactor FeaturesTab to shared location
- ✅ Add context-specific configuration
- ✅ Test with existing ClassEdit integration

### Phase 2: Race Tab Infrastructure ✅ COMPLETED
- ✅ Create tab directory structure
- ✅ Define types and interfaces
- ✅ Set up barrel exports

### Phase 3: Individual Tab Components ✅ COMPLETED
- ✅ Implement BasicInfoTab
- ✅ Implement AbilitiesTab
- ✅ Implement LanguagesTab
- ✅ Implement FeaturesTab (using shared component)
- ✅ Implement DescriptionTab

### Phase 4: RaceEdit Refactoring ✅ COMPLETED
- ✅ Convert RaceEdit to tab-based layout
- ✅ Integrate all tab components
- ✅ Test all functionality

### Total Implementation Time: ✅ COMPLETED (4 phases)

## Risk Assessment

### Low Risk
- **Feature System Integration**: No changes needed - already working correctly
- **Data Compatibility**: Existing race data will continue to work unchanged
- **Component Reuse**: Using proven components from ClassEdit

### Medium Risk
- **UI Consistency**: Need to ensure tab styling matches ClassEdit exactly
- **State Management**: Need to properly pass state between tabs
- **Dialog Integration**: Need to ensure dialogs work correctly with tab structure

### Mitigation Strategies
- **Incremental Implementation**: Implement one tab at a time and test thoroughly
- **Component Testing**: Test each tab component in isolation
- **Integration Testing**: Comprehensive testing of tab interactions
- **Fallback Plan**: Keep existing RaceEdit as backup until new version is fully tested

## Conclusion

This refactoring will bring race editing up to the same level as class editing, providing a consistent and powerful feature management system across the application. The implementation is primarily a UI reorganization that leverages existing feature system integration, making it a low-risk enhancement with high user experience benefits.
