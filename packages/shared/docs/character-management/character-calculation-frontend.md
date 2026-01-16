# Character Calculation Frontend Implementation

*Complete documentation for the frontend character calculation system, including calculation functions, breakdown components, and integration with the formatting system.*

## 📋 **Overview**

The frontend character calculation system provides functions for calculating derived character statistics (ability scores, modifiers, AC, saving throws, initiative, etc.) with transparent breakdowns showing how values are derived. The system follows a standardized architecture pattern for breakdown components to ensure consistency and maintainability.

The frontend calculation system is located in `apps/frontend/src/lib/character-calculation/` and integrates with the formatting system to display calculated values and their breakdowns on character sheets.

**Source Files**: 
- Calculation functions: `apps/frontend/src/lib/character-calculation/calculations/`
- Types: `apps/frontend/src/lib/character-calculation/types.ts`
- Utilities: `apps/frontend/src/lib/character-calculation/utils/breakdownBuilder.ts`
- Service: `apps/frontend/src/lib/character-calculation/core/calculationService.ts`

## 🏗️ **Architecture Overview**

The character calculation frontend follows a standardized breakdown component architecture:

**Calculation Functions**: Individual functions for each calculation type (ability scores, AC, saving throws, initiative, etc.)
**Breakdown Components**: Standardized structure for showing how values are calculated
**Breakdown Maps**: Typed interfaces extending `BreakdownMap` for each calculation type
**Formatting Integration**: Breakdowns flow from calculations to the formatting system for display

### **Breakdown Component Architecture**

The breakdown component architecture provides transparency in how calculated values are derived. All calculation functions return a `CalculationResult` that includes:
- The total calculated value
- A formatted breakdown string
- A structured breakdown map showing all components

**Key Design Principles:**
- **Standardization**: All breakdown maps extend `BreakdownMap` and use `BreakdownComponent` (not custom inline types)
- **Type Safety**: Consistent types ensure compatibility with breakdown utilities
- **Transparency**: Breakdowns show exactly how values are calculated from various sources
- **Integration**: Breakdowns flow seamlessly to the formatting system

## 🔧 **Core Types**

### **BreakdownSourceType**

The source type system identifies **WHAT** the source of a modifier or value is in character calculations.

**Location**: `apps/frontend/src/lib/character-calculation/types.ts`

**Purpose**: Represents the origin/category of a breakdown component (e.g., ability modifier, feat bonus, item bonus).

**Values**:
- `'base'`: Base value (e.g., base AC of 10, base ability score)
- `'ability'`: Ability modifier (e.g., Dex modifier for AC, Str modifier for attack)
- `'feat'`: Bonus from a feat
- `'feature'`: Bonus from a class feature or racial feature
- `'item'`: Bonus from an equipped item
- `'advancement'`: Bonus from level advancement (e.g., ability score improvements)
- `'formula_modification'`: Modification from a formula (e.g., Monk AC bonus)
- `'penalty'`: Penalty applied to the calculation
- `null`: No specific source type

**Relationship to Formatter System**: The character-calculation system's `BreakdownSourceType` (WHAT) is mapped to the formatter system's `CalculationMethodType` (HOW) when displaying breakdowns. See [Breakdown Components Documentation](../../formatting-system/breakdown-components.md) for details on the mapping and relationship between the two systems.

### **BreakdownComponent**

The standard breakdown component structure used by all calculation functions.

**Location**: `apps/frontend/src/lib/character-calculation/types.ts`

**Structure:**
```typescript
export interface BreakdownComponent {
    value: number;
    source: string | null;
    sourceType: BreakdownSourceType;
    sourceId?: number;
    context?: {
        itemId?: number;
        weaponType?: number;
        abilityId?: number;
    };
}
```

**Source Types:**
- `'base'`: Base value (e.g., base AC of 10, base ability score)
- `'ability'`: Ability modifier (e.g., Dex modifier for AC, Str modifier for attack)
- `'feat'`: Bonus from a feat
- `'feature'`: Bonus from a class feature or racial feature
- `'item'`: Bonus from an equipped item
- `'advancement'`: Bonus from level advancement (e.g., ability score improvements)
- `'formula_modification'`: Modification from a formula (e.g., Monk AC bonus)
- `'penalty'`: Penalty applied to the calculation
- `null`: No specific source type

**Usage:**
- All calculation breakdown maps must use `BreakdownComponent` for their fields
- Never use custom inline types or type assertions
- Use `createBreakdownComponent()` to create components

### **BreakdownMap**

The base interface that all calculation breakdown maps must extend.

**Location**: `apps/frontend/src/lib/character-calculation/types.ts`

**Structure:**
```typescript
export interface BreakdownMap {
    [key: string]: BreakdownComponent;
}
```

**Architecture Pattern:**
- All calculation breakdown maps must extend `BreakdownMap`
- The index signature allows breakdown utilities to iterate over all fields
- Specific fields are defined in each breakdown map interface (e.g., `dexMod`, `feat`, `feature`)

**Example:**
```typescript
export interface InitiativeBreakdownMap extends BreakdownMap {
    dexMod: BreakdownComponent;
    feat: BreakdownComponent;
    feature: BreakdownComponent;
    item: BreakdownComponent;
}
```

### **CalculationResult**

The return type for all calculation functions.

**Location**: `apps/frontend/src/lib/character-calculation/types.ts`

**Structure:**
```typescript
export interface CalculationResult<T extends BreakdownMap = BreakdownMap> {
    value: number;
    breakdownString: string;
    breakdown: T;
    formulaModifications?: FormulaModification[];
}
```

**Fields:**
- `value`: The total calculated value
- `breakdownString`: A formatted string showing the breakdown (e.g., "+2 (Dex modifier) + 1 (Feat: Improved Initiative)")
- `breakdown`: The structured breakdown map
- `formulaModifications`: Optional formula modifications that affect the calculation

## 🛠️ **Utilities**

The calculation system provides several utility functions to reduce code duplication and standardize patterns across calculation functions.

### **Common Bonus Resolution**

### **resolveStandardBonuses**

Resolves standard feat and feature bonuses for a calculation. This is the recommended way to get bonuses for most calculations.

**Location**: `apps/frontend/src/lib/character-calculation/utils/calculationHelpers.ts`

### **Breakdown Component Creation**

### **createBreakdownComponent**

Creates a breakdown component following the standard architecture pattern.

**Location**: `apps/frontend/src/lib/character-calculation/utils/breakdownBuilder.ts`

**Signature:**
```typescript
export function createBreakdownComponent(
    value: number,
    source: string | null,
    sourceType: BreakdownComponent['sourceType'],
    sourceId?: number,
    context?: BreakdownComponent['context']
): BreakdownComponent
```

**Usage:**
- Always use this function to create breakdown components
- Returns the standard `BreakdownComponent` type (no type assertions needed)
- Ensures consistency across all calculation functions

**Example:**
```typescript
const dexMod = createBreakdownComponent(
    2,
    'Dex modifier',
    'ability',
    AbilityId.Dexterity
);
```

### **buildBreakdownString**

Builds a formatted breakdown string from breakdown components.

**Location**: `apps/frontend/src/lib/character-calculation/utils/breakdownBuilder.ts`

**Signature:**
```typescript
export function buildBreakdownString(breakdown: BreakdownMap): string
```

**Usage:**
- Called by calculation functions to generate the `breakdownString` in `CalculationResult`
- Automatically skips zero values (except base values)
- Formats components as "+value (source)" or just "+value" if no source

**Example Output:**
```
"+2 (Dex modifier) + 1 (Feat: Improved Initiative)"
```

### **createFeatBreakdownComponent**

Creates a standardized breakdown component for feat bonuses.

**Location**: `apps/frontend/src/lib/character-calculation/utils/breakdownBuilder.ts`

**Signature:**
```typescript
export function createFeatBreakdownComponent(
    featBonus: number,
    featBenefits: FeatBenefit[]
): BreakdownComponent
```

**Usage:**
- Standardizes feat breakdown component creation across all calculations
- Automatically formats source string with feat names
- Handles zero values appropriately

**Example:**
```typescript
const { featBonus, featBenefits } = resolveStandardBonuses(...);
feat: createFeatBreakdownComponent(featBonus, featBenefits),
```

### **createFeatureBreakdownComponent**

Creates a standardized breakdown component for feature bonuses.

**Location**: `apps/frontend/src/lib/character-calculation/utils/breakdownBuilder.ts`

**Signature:**
```typescript
export function createFeatureBreakdownComponent(
    featureBonus: number,
    featureBonuses: FeatureBonus[]
): BreakdownComponent
```

**Usage:**
- Standardizes feature breakdown component creation across all calculations
- Automatically formats source string with feature names
- Handles zero values appropriately

**Example:**
```typescript
const { featureBonus, featureBonuses } = resolveStandardBonuses(...);
feature: createFeatureBreakdownComponent(featureBonus, featureBonuses),
```

### **createItemBreakdownComponent**

Creates a standardized breakdown component for item bonuses.

**Location**: `apps/frontend/src/lib/character-calculation/utils/breakdownBuilder.ts`

**Signature:**
```typescript
export function createItemBreakdownComponent(
    itemBonus: number,
    itemSource?: string | null
): BreakdownComponent
```

**Usage:**
- Standardizes item breakdown component creation across all calculations
- Accepts optional item source string
- Handles zero values appropriately

**Example:**
```typescript
item: createItemBreakdownComponent(itemBonus, itemSource),
```

### **resolveStandardBonuses**

Resolves standard feat and feature bonuses for a calculation.

**Location**: `apps/frontend/src/lib/character-calculation/utils/calculationHelpers.ts`

**Signature:**
```typescript
export function resolveStandardBonuses(
    character: CharacterWithAllDetailsResponse,
    appliesTo: EntityAppliesToType,
    resolvedProgressions: FeatureProgression[],
    featsMap?: Map<number, Feat>,
    context?: FeatBenefitContext | { abilityId?: number }
): {
    featBonus: number;
    featureBonus: number;
    featBenefits: FeatBenefit[];
    featureBonuses: FeatureBonus[];
}
```

**Usage:**
- Centralizes the common pattern of resolving feat and feature bonuses
- Eliminates duplicate code across calculation functions
- Returns both the totals and the raw benefit arrays for breakdown creation

**Example:**
```typescript
const { featBonus, featureBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
    character,
    EntityAppliesToType.Initiative,
    resolvedProgressions,
    featsMap
);
```

### **buildCalculationResult**

Builds a calculation result with standardized breakdown string formatting.

**Location**: `apps/frontend/src/lib/character-calculation/utils/calculationHelpers.ts`

**Signature:**
```typescript
export function buildCalculationResult<T extends BreakdownMap>(
    total: number,
    breakdown: T,
    calculationName: string,
    formulaModifications?: CalculationResult<T>['formulaModifications']
): CalculationResult<T>
```

**Usage:**
- Centralizes the common pattern of building CalculationResult objects
- Ensures consistent breakdown string formatting
- Supports optional formula modifications

**Example:**
```typescript
return buildCalculationResult(total, breakdown, 'Initiative');
```

## 📝 **Creating New Calculation Functions**

When creating a new calculation function, follow this pattern:

### **1. Define the Breakdown Map Interface**

```typescript
/**
 * Breakdown map for [calculation name].
 * 
 * Follows the standard breakdown component architecture pattern:
 * - Extends BreakdownMap to ensure compatibility with breakdown utilities
 * - Uses BreakdownComponent for all fields (not custom inline types)
 * 
 * @see {@link BreakdownComponent} for the standard breakdown component structure
 * @see {@link BreakdownMap} for the base breakdown map interface
 */
export interface [CalculationName]BreakdownMap extends BreakdownMap {
    field1: BreakdownComponent;
    field2: BreakdownComponent;
    // ... more fields
}
```

### **2. Implement the Calculation Function**

```typescript
export function get[CalculationName](
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    // ... other parameters
): CalculationResult<[CalculationName]BreakdownMap> {
    // Calculate base/special components (calculation-specific logic)
    const baseValue = /* calculation logic */;
    
    // Get standard bonuses (feat and feature) using utility
    const { featBonus, featureBonus, featBenefits, featureBonuses } = resolveStandardBonuses(
        character,
        EntityAppliesToType.[AppliesToType],
        resolvedProgressions,
        featsMap,
        context // if needed
    );
    
    // Item bonuses (if applicable)
    const itemBonus = 0; // TODO: Implement item bonus resolution
    
    // Calculate total
    const total = baseValue + featBonus + featureBonus + itemBonus;
    
    // Build breakdown using utility functions
    const breakdown: [CalculationName]BreakdownMap = {
        base: createBreakdownComponent(baseValue, 'base', 'base'),
        feat: createFeatBreakdownComponent(featBonus, featBenefits),
        feature: createFeatureBreakdownComponent(featureBonus, featureBonuses),
        item: createItemBreakdownComponent(itemBonus),
    };
    
    // Build and return result using utility
    return buildCalculationResult(total, breakdown, '[Calculation Name]');
}
```

### **3. Add to CalculationService**

Add a static method to `CharacterCalculationService`:

```typescript
static get[CalculationName](
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureProgression[],
    // ... other parameters
) {
    return get[CalculationName](character, resolvedProgressions, /* ... */);
}
```

## 🔄 **Refactoring Benefits**

The calculation system has been refactored to use common utility functions, providing:

- **Reduced Duplication**: Common patterns (feat/feature bonus resolution, breakdown creation) are centralized
- **Consistency**: All calculations use the same patterns for bonus resolution and breakdown creation
- **Maintainability**: Changes to bonus resolution or breakdown formatting only need to be made in one place
- **Easier Extension**: New calculation functions can leverage existing utilities

**Key Utilities:**
- `resolveStandardBonuses()` - Resolves feat and feature bonuses
- `createFeatBreakdownComponent()` - Creates standardized feat breakdown components
- `createFeatureBreakdownComponent()` - Creates standardized feature breakdown components
- `createItemBreakdownComponent()` - Creates standardized item breakdown components
- `buildCalculationResult()` - Builds calculation results with consistent formatting

## 🔗 **Integration with Formatting System**

The formatting system (`CharacterSheetDisplayStrategy`) consumes calculation results and their breakdowns:

1. **Calculation**: Calculation functions return `CalculationResult<T>` with breakdowns
2. **Formatting**: The formatting system calls calculation functions via `CharacterCalculationService`
3. **Display**: Breakdowns are converted to display format and shown on character sheets

**Example Flow:**
```typescript
// In CharacterSheetDisplayStrategy
const result = CharacterCalculationService.getInitiative(
    character,
    resolvedProgressions,
    context?.featsMap
);

// Format the breakdown for display
return {
    total: this.formatModifier(result.value),
    dexMod: this.formatBreakdownComponent(result.breakdown.dexMod.value),
    misc: this.formatBreakdownComponent(
        result.breakdown.feat.value + 
        result.breakdown.feature.value + 
        result.breakdown.item.value
    ),
    breakdown: this._convertBreakdown(result.breakdown),
};
```

## 📚 **Existing Calculation Functions**

The following calculation functions follow the standard breakdown component architecture:

- **Ability Scores**: `getAbilityScore()` - Returns `AbilityScoreBreakdownMap`
- **Armor Class**: `getAC()`, `getTouchAC()`, `getFlatFootedAC()` - Return `ACBreakdownMap`
- **Saving Throws**: `getSavingThrow()` - Returns `SavingThrowBreakdownMap`
- **Initiative**: `getInitiative()` - Returns `InitiativeBreakdownMap`
- **Speed**: `getSpeed()` - Returns `SpeedBreakdownMap`
- **Combat Values**: `getCombatValues()` - Returns `CombatValuesBreakdownMap`

All of these functions:
- Extend `BreakdownMap` in their breakdown map interfaces
- Use `BreakdownComponent` for all fields
- Use `createBreakdownComponent()` to create components
- Return `CalculationResult<T>` with formatted breakdown strings

## ⚠️ **Important Guidelines**

### **DO:**
- ✅ Always extend `BreakdownMap` for breakdown map interfaces
- ✅ Always use `BreakdownComponent` for breakdown map fields
- ✅ Always use `createBreakdownComponent()` to create components
- ✅ Add JSDoc comments explaining the architecture pattern
- ✅ Follow the naming convention: `[CalculationName]BreakdownMap`

### **DON'T:**
- ❌ Use custom inline types for breakdown components
- ❌ Use type assertions (e.g., `as TypedBreakdownComponent<...>`)
- ❌ Create breakdown components inline without `createBreakdownComponent()`
- ❌ Skip extending `BreakdownMap` in breakdown map interfaces
- ❌ Use `TypedBreakdownComponent` (removed - use `BreakdownComponent` instead)

## 🔍 **Related Documentation**

- **[Character Calculation Backend](character-calculation-backend.md)** - Backend calculation services
- **[Character Sheet Display](../application-overview/frontend-components.md)** - How breakdowns are displayed
- **[Formatting System](../formatting-system/)** - How calculations integrate with formatting
- **[Breakdown Components](../formatting-system/breakdown-components.md)** - Relationship between `BreakdownSourceType` and `CalculationMethodType`
