# Shared Static Data Documentation

*Common static data structures, enums, and utility functions used across multiple systems in the D&D Tools application.*

## 📋 **Overview**

The shared static data system provides lightweight reference information, enums, and utility functions that are used across multiple systems. This data is designed for frontend performance and efficiency, containing essential fields needed for list displays, filtering, and basic lookups without requiring API calls to the backend.

**Source File**: `packages/shared/static-data/src/CommonData.ts`

## 🏗️ **Shared Data Structures**

### **Core Type Definitions**

**Source**: `packages/shared/static-data/src/types.ts`

Fundamental types used throughout the system:

```typescript
// Core component with ID and name
export interface CoreComponent {
    id: number;
    name: string;
}

// Base map structure
export type BaseMap<T> = { [key: number]: T };

// Name to ID mapping
export type NameToIdMap = { [key: string]: number };

// ID to name mapping
export type IdToNameMap = { [key: number]: string };

// Select option for UI components
export interface SelectOption {
    value: number;
    label: string;
}
```

**Usage**:
- **Consistency**: Standardized types across all systems
- **Type Safety**: Full TypeScript integration
- **UI Integration**: SelectOption interface for dropdowns
- **Data Access**: Efficient map and list operations

### **Utility Functions**

**Source**: `packages/shared/static-data/src/Util.ts`

Common utility functions for static data operations:

**Name Select Option List**:
```typescript
export function NameSelectOptionList<T extends { id: number; name: string }>(
    list: T[]
): SelectOption[] {
    return list.map(item => ({
        value: item.id,
        label: item.name
    }));
}
```

**Object ID to Name Map**:
```typescript
export function ObjectIdToNameMap<T extends { id: number; name: string }>(
    map: BaseMap<T>
): IdToNameMap {
    return Object.fromEntries(
        Object.values(map).map(item => [item.id, item.name])
    );
}
```

**Usage**:
- **UI Components**: Convert data to select options
- **Reverse Lookups**: Create ID to name mappings
- **Performance**: Optimized data access patterns
- **Consistency**: Standardized data transformations

### **Ability Score System**

**Source**: `packages/shared/static-data/src/AbilityData.ts`

Core attribute system that defines the six primary ability scores used throughout the D&D system.

**Ability Scores**: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma with their standard abbreviations.

**Ability Modifier Calculation**: Converts ability scores to modifiers using the standard D&D formula `floor((score - 10) / 2)`.

**Point Buy System**: Calculates the cost of ability scores in point-buy character creation systems.

**Bonus Spells**: Calculates bonus spells per day based on spellcasting ability scores.

**Saving Throws**: Defines the three saving throw types (Fortitude, Will, Reflex) with their abbreviations.

**Usage**:
- **Character Creation**: Core attribute system for all characters
- **Skill Calculations**: Affects skills, saves, attacks, and other mechanics
- **Spellcasting**: Determines bonus spells and spell DCs
- **Point Buy**: Supports point-buy character creation systems

### **Edition System**

The edition system provides information about D&D editions for multi-edition support across all systems.

#### **EDITION_MAP**

Reference table containing all supported D&D editions with their names and abbreviations.

**Structure**: Object mapping edition IDs to edition information
**Purpose**: Edition reference for content attribution and filtering across all systems
**Usage**: Edition-based filtering, content attribution, multi-edition support

**Fields for Each Edition**:
- **`id`**: Unique edition identifier
- **`name`**: Full edition name
- **`abbreviation`**: Short edition code

**Supported Editions**:
- **`1`**: Original Dungeons & Dragons (OD&D)
- **`2`**: Advanced Dungeons & Dragons (AD&D)
- **`3`**: Advanced Dungeons & Dragons 2nd Edition (AD&D 2E)
- **`4`**: Dungeons & Dragons 3rd Edition (D&D 3E)
- **`5`**: Dungeons & Dragons 3.5 Edition (D&D 3.5E)
- **`6`**: Dungeons & Dragons 4th Edition (D&D 4E)
- **`7`**: Dungeons & Dragons 5th Edition (D&D 5E)

**Cross-System Usage**:
- **Class System**: Classes tagged with edition IDs
- **Race System**: Races tagged with edition IDs
- **Feature System**: Features tagged with edition IDs
- **Content Filtering**: Edition-based content filtering across all systems

**Source File**: `packages/shared/static-data/src/CommonData.ts` (EDITION_MAP definition)

#### **EDITION_LIST and EDITION_SELECT_LIST**

Array representations of edition data for iteration and UI components.

**EDITION_LIST**: Array of edition objects for iteration and list operations
**EDITION_SELECT_LIST**: Formatted for select components with 3E/3.5E combination
**Purpose**: Enable iteration and UI component integration across all systems
**Usage**: Edition selection dropdowns, content filtering

**Special Handling**: The select list combines 3E and 3.5E into a single option for user convenience, as most players use the combined rules.

**Source File**: `packages/shared/static-data/src/CommonData.ts` (EDITION_LIST and EDITION_SELECT_LIST definitions)

### **Source Attribution System**

The source attribution system provides consistent content attribution across all systems.

#### **SourceMapSchema**

Zod schema for source book references and page numbers.

**Structure**: Zod schema defining source attribution fields
**Purpose**: Consistent source attribution validation across all systems
**Usage**: Source book references, page number tracking, content attribution

**Fields**:
- **`sourceBookId`**: References the source book containing the content
- **`pageNumber`**: Optional page number for quick reference

**Cross-System Usage**:
- **Class System**: ClassSourceMap for class attribution
- **Race System**: RaceSourceMap for race attribution
- **Feature System**: Feature source attribution
- **Content Validation**: Proper credit for all content

**Source File**: `packages/shared/schema/src/sourcebook.ts` (SourceMapSchema definition)

### **Casting Type System**

The casting type system provides information about spellcasting methods, used by systems that involve spellcasting.

#### **CastingType Enum**

Defines the numeric constants for spellcasting types, providing type safety for casting method identification.

**Structure**: Object with casting type constants
**Purpose**: Type-safe casting type identification across systems
**Usage**: Feature system integration for spellcasting abilities

**Casting Types**:
- **`CastingType.Prepared` (1)**: Prepared spellcasting (Wizard, Cleric)
- **`CastingType.Spontaneous` (2)**: Spontaneous spellcasting (Sorcerer, Bard)

**Cross-System Usage**:
- **Class System**: Class spellcasting type definitions
- **Feature System**: Racial and class spellcasting features
- **Character System**: Character spellcasting method determination

**Source File**: `packages/shared/static-data/src/CommonData.ts` (CastingType enum definition)

#### **CASTING_TYPE_MAP and Related Lists**

Reference table and array representations for casting type data.

**CASTING_TYPE_MAP**: Object mapping casting type IDs to casting type information
**CASTING_TYPE_LIST**: Array of casting type objects for iteration
**CASTING_TYPE_SELECT_LIST**: Formatted for select components and dropdowns

**Source File**: `packages/shared/static-data/src/CommonData.ts` (CASTING_TYPE_MAP and related definitions)

## 🔧 **Utility Functions**

### **NameSelectOptionList**

Utility function that converts static data objects into select option format for UI components.

**Purpose**: Standardize select component data format across all systems
**Usage**: Create dropdown options from static data
**Input**: Array of objects with `id` and `name` properties
**Output**: Array of objects with `value` and `label` properties

**Cross-System Usage**:
- **Class System**: Class selection dropdowns
- **Race System**: Race selection dropdowns
- **Feature System**: Feature selection dropdowns
- **Language System**: Language selection dropdowns

**Source File**: `packages/shared/static-data/src/CommonData.ts` (utility function)

### **AbbreviationSelectOptionList**

Utility function that converts static data objects into select option format using abbreviations.

**Purpose**: Create select options using abbreviated labels
**Usage**: Create compact dropdown options from static data
**Input**: Array of objects with `id` and `abbreviation` properties
**Output**: Array of objects with `value` and `label` properties

**Cross-System Usage**:
- **Edition System**: Edition selection with abbreviations
- **Size System**: Size selection with abbreviations
- **Any System**: Compact dropdown options where abbreviations are preferred

**Source File**: `packages/shared/static-data/src/CommonData.ts` (utility function)

## 📊 **Performance Optimization**

### **Caching Strategy**

The shared static data system is designed for optimal frontend performance across all systems:

**Client-Side Caching**:
- **Small Size**: Minimal data size for effective caching
- **Frequent Access**: Cached data for repeated lookups across systems
- **Reduced API Calls**: Eliminates need for backend requests for common data
- **Fast Loading**: Immediate data availability for all systems

**Memory Efficiency**:
- **Essential Data Only**: Contains only necessary fields for cross-system usage
- **Optimized Structure**: Efficient object and array structures
- **Minimal Overhead**: Low memory footprint across all systems
- **Quick Access**: Direct property access patterns

### **Lookup Optimization**

The data structures are optimized for fast lookups across all systems:

**Direct Access**:
- **ID-Based Lookups**: Direct object property access
- **Array Operations**: Efficient array iteration and filtering
- **Select Integration**: Pre-formatted for UI components
- **Type Safety**: Full TypeScript integration

**Filtering Support**:
- **Edition Filtering**: Quick edition-based filtering operations
- **Cross-System Filtering**: Efficient filtering across multiple systems
- **Category Filtering**: Support for various categorization schemes
- **Content Attribution**: Fast source book and page lookups

## 🔗 **Cross-System Integration**

### **Database Integration**

The shared static data integrates with database schemas across all systems:

**Edition References**:
- **Database Fields**: `editionId` fields reference edition information
- **Validation**: Zod schemas validate against edition values
- **Filtering**: Edition-based content filtering across all systems

**Source Attribution**:
- **Source Maps**: Consistent source attribution across all systems
- **Page References**: Quick lookup of content locations in source books
- **Content Validation**: Proper credit for all content across systems

### **Validation Integration**

The shared static data integrates with validation schemas across all systems:

**Schema Reuse**:
- **SourceMapSchema**: Consistent source attribution validation
- **Edition Validation**: Standardized edition ID validation
- **Type Safety**: Consistent type definitions across systems

**Cross-System Validation**:
- **Shared Rules**: Common validation rules across all systems
- **Consistent Messages**: Standardized error messages
- **Type Inference**: Consistent TypeScript type generation

## 📈 **Extension Points**

### **Future Enhancements**

The shared static data system supports future enhancements:

**Additional Editions**:
- **New Editions**: Support for additional D&D editions
- **Edition Variants**: Support for edition-specific variations
- **Cross-Edition Compatibility**: Tools for edition conversion

**Enhanced Attribution**:
- **Digital Sources**: Support for digital source attribution
- **Version Tracking**: Support for content version tracking
- **Author Attribution**: Support for author and contributor attribution

### **Customization Support**

The system supports customization and extension:

**Custom Data**:
- **User-Defined Editions**: Support for custom edition definitions
- **Custom Sources**: Support for custom source book definitions
- **Custom Casting Types**: Support for custom spellcasting methods

**Integration Patterns**:
- **Plugin Architecture**: Support for data extensions
- **Configuration Files**: External configuration for custom data
- **API Extensions**: Backend support for custom static data

## 🔗 **Cross-System Integration Patterns**

### **Type Safety**
All static data is fully typed with TypeScript:

```typescript
// Type-safe enum usage
const abilityId: number = 1; // Strength
const ability = ABILITY_MAP[abilityId]; // Type: Ability | undefined

// Type-safe formula usage
const formulaId: FormulaId = FormulaId.LINEAR_SCALING;
const formula = FORMULA_MAP[formulaId]; // Type: Formula | undefined
```

### **Validation Integration**
Static data provides validation rules:

```typescript
// Validate ability score
if (abilityId < 1 || abilityId > 6) {
    throw new Error('Invalid ability ID');
}

// Validate skill ID
if (!SKILL_MAP[skillId]) {
    throw new Error('Invalid skill ID');
}

// Validate formula parameters
const formula = FORMULA_MAP[formulaId];
if (!formula) {
    throw new Error('Invalid formula ID');
}
```

## 📊 **Performance Considerations**

### **Caching**
Static data is designed for efficient access:

- **Map Lookups**: O(1) access to data by ID
- **Array Operations**: Efficient iteration and filtering
- **Memory Usage**: Minimal overhead for large datasets
- **Tree Shaking**: Unused data can be eliminated in builds

### **Optimization Patterns**
```typescript
// Pre-computed select lists
export const ABILITY_SELECT_LIST = NameSelectOptionList(ABILITY_LIST);

// Reverse lookup maps
export const ABILITY_NAME_TO_ID = ObjectIdToNameMap(ABILITY_MAP);

// Filtered lists
export const VISIBLE_CLASSES = CLASS_LIST.filter(cls => cls.isVisible);
```

## 🛡️ **Error Handling**

### **Data Validation**
Static data includes validation patterns:

```typescript
// Validate enum values
export function isValidAbilityId(id: number): boolean {
    return id >= 1 && id <= 6 && ABILITY_MAP[id] !== undefined;
}

// Validate formula parameters
export function validateFormulaParams(formulaId: number, params: any): boolean {
    const formula = FORMULA_MAP[formulaId];
    if (!formula) return false;
    
    return formula.parameters.every(param => {
        if (param.required && params[param.name] === undefined) {
            return false;
        }
        return true;
    });
}
```

### **Graceful Degradation**
When static data is missing or invalid:

```typescript
// Safe access with fallbacks
export function getAbilityName(id: number): string {
    return ABILITY_MAP[id]?.name || 'Unknown Ability';
}

// Default values for missing data
export function getDefaultFormulaParams(formulaId: number): Record<string, any> {
    const formula = FORMULA_MAP[formulaId];
    if (!formula) return {};
    
    const defaults: Record<string, any> = {};
    formula.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
            defaults[param.name] = param.defaultValue;
        }
    });
    
    return defaults;
}
```

## 📋 **Maintenance Guidelines**

### **Adding New Data**
When adding new static data:

1. **Define Types**: Add TypeScript interfaces in `types.ts`
2. **Create Maps**: Add data maps with proper typing
3. **Export Lists**: Create array versions for iteration
4. **Add Select Lists**: Create UI-friendly versions
5. **Update Documentation**: Document new data and usage

### **Modifying Existing Data**
When modifying existing data:

1. **Check Dependencies**: Identify all systems that use the data
2. **Update Types**: Modify TypeScript interfaces if needed
3. **Validate Changes**: Ensure changes don't break existing functionality
4. **Update Tests**: Modify tests to reflect changes
5. **Update Documentation**: Update relevant documentation

### **Version Compatibility**
Static data changes should consider:

- **Backward Compatibility**: Maintain compatibility with existing data
- **Migration Paths**: Provide migration for database changes
- **Feature Flags**: Use feature flags for major changes
- **Deprecation**: Mark deprecated data for future removal

## Summary

The shared static data system provides:

- **Edition Management**: Multi-edition support for content attribution across all systems
- **Source Attribution**: Consistent content attribution and validation
- **Casting Types**: Standardized spellcasting method identification
- **Utility Functions**: Common utility functions for UI components
- **Performance Optimization**: Fast lookups and efficient caching across all systems
- **Type Safety**: Full TypeScript integration with consistent type definitions
- **Cross-System Integration**: Seamless integration with all system databases and validation schemas
- **Extensibility**: Support for future enhancements and customizations

The shared static data ensures that all systems have consistent, efficient, and type-safe access to common data structures while providing comprehensive support for multi-edition content management and attribution.
