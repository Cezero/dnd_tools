# Spell System Static Data

*Complete documentation for the spell system static data, including enums, types, and reference data structures.*

## 📋 **Overview**

The spell system static data provides enums, types, and utility functions that define the behavior and capabilities of the spell system. This includes spell schools, subschools, descriptors, components, range types, and various utility functions for spell calculations and management.

The static data layer serves as the foundation for type safety, validation, and consistent behavior across the spell system. It defines the vocabulary and rules that govern how spells interact with characters and other game systems.

**Source File**: `packages/shared/static-data/src/SpellData.ts`

## 🏗️ **Core Enums and Types**

### **SpellComponent**

Defines the components required to cast spells, affecting spell preparation and casting mechanics.

**Purpose**: Identifies the components required to cast a spell, affecting spell preparation, casting mechanics, and material requirements.

**Values**:
- **`Verbal` (0)**: Spoken words required for casting
- **`Somatic` (1)**: Hand gestures required for casting
- **`Material` (2)**: Material components required for casting
- **`Focus` (3)**: Focus item required for casting
- **`Divine Focus` (4)**: Divine focus item required for casting
- **`XP` (5)**: Experience points required for casting

**Usage**: Used in spell component arrays to define casting requirements.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_COMPONENT_MAP definition)

### **SpellDescriptor**

Defines the descriptors that categorize spells by their effects and characteristics.

**Purpose**: Identifies the descriptors that categorize spells by their effects, damage types, and characteristics.

**Values**:
- **`Acid` (1)**: Acid-based spells and effects
- **`Air` (2)**: Air-based spells and effects
- **`Chaotic` (3)**: Chaotic-aligned spells and effects
- **`Cold` (4)**: Cold-based spells and effects
- **`Darkness` (5)**: Darkness-based spells and effects
- **`Death` (6)**: Death-based spells and effects
- **`Earth` (7)**: Earth-based spells and effects
- **`Electricity` (8)**: Electricity-based spells and effects
- **`Evil` (9)**: Evil-aligned spells and effects
- **`Fear` (10)**: Fear-based spells and effects
- **`Fire` (11)**: Fire-based spells and effects
- **`Force` (12)**: Force-based spells and effects
- **`Good` (13)**: Good-aligned spells and effects
- **`Language-dependent` (14)**: Spells that depend on language
- **`Lawful` (15)**: Lawful-aligned spells and effects
- **`Light` (16)**: Light-based spells and effects
- **`Mind-affecting` (17)**: Spells that affect the mind
- **`Sonic` (18)**: Sonic-based spells and effects
- **`Water` (19)**: Water-based spells and effects
- **`See text` (20)**: Spells with variable descriptors
- **`Eldritch essence` (21)**: Warlock-specific descriptors
- **`Blast shape` (22)**: Warlock blast shape descriptors

**Usage**: Used in spell descriptor arrays to categorize spell effects and characteristics.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_DESCRIPTOR_MAP definition)

### **SpellRange**

Defines the range types for spells, affecting how far spells can reach.

**Purpose**: Identifies the range types for spells, affecting casting distance and target selection.

**Values**:
- **`Touch` (1)**: Touch range spells
- **`Personal` (2)**: Personal range spells
- **`Close` (3)**: Close range spells
- **`Medium` (4)**: Medium range spells
- **`Long` (5)**: Long range spells
- **`Unlimited` (6)**: Unlimited range spells
- **`Foot` (7)**: Foot-based range spells
- **`Mile` (8)**: Mile-based range spells
- **`Special` (9)**: Special range spells

**Usage**: Used in spell range type fields to define casting range.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_RANGE_MAP definition)

### **SpellSchool**

Defines the schools of magic that categorize spells by their fundamental nature.

**Purpose**: Identifies the schools of magic that categorize spells by their fundamental nature and effects.

**Values**:
- **`Abjuration` (1)**: Protective and defensive magic
- **`Conjuration` (2)**: Summoning and teleportation magic
- **`Divination` (3)**: Information-gathering magic
- **`Enchantment` (4)**: Mind-affecting magic
- **`Evocation` (5)**: Energy and damage magic
- **`Illusion` (6)**: Deceptive and illusory magic
- **`Necromancy` (7)**: Death and undead magic
- **`Transmutation` (8)**: Transformation magic
- **`Universal` (9)**: Universal magic
- **`Invocation` (10)**: Warlock-specific magic

**Usage**: Used in spell school arrays to categorize spells by school.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_SCHOOL_MAP definition)

### **SpellSubschool**

Defines the subschools that further categorize spells within their primary schools.

**Purpose**: Identifies the subschools that further categorize spells within their primary schools.

**Values**:
- **`Calling` (1)**: Conjuration subschool for calling creatures
- **`Creation` (2)**: Conjuration subschool for creating objects
- **`Healing` (3)**: Conjuration subschool for healing magic
- **`Summoning` (4)**: Conjuration subschool for summoning creatures
- **`Teleportation` (5)**: Conjuration subschool for teleportation
- **`Scrying` (6)**: Divination subschool for scrying magic
- **`Charm` (7)**: Enchantment subschool for charm effects
- **`Compulsion` (8)**: Enchantment subschool for compulsion effects
- **`Figment` (9)**: Illusion subschool for figment illusions
- **`Glamer` (10)**: Illusion subschool for glamer illusions
- **`Pattern` (11)**: Illusion subschool for pattern illusions
- **`Phantasm` (12)**: Illusion subschool for phantasm illusions
- **`Shadow` (13)**: Illusion subschool for shadow illusions
- **`Polymorph` (14)**: Transmutation subschool for polymorph effects

**Usage**: Used in spell subschool arrays to further categorize spells.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_SUBSCHOOL_MAP definition)

## 🔧 **Spell Data Structures**

### **SpellComponentMap**

The primary data structure containing all spell component definitions with their characteristics.

**Purpose**: Provides a comprehensive map of all available spell components with their defining characteristics.

**Structure**:
- **Component ID**: Unique identifier for each component
- **Name**: Human-readable component name
- **Abbreviation**: Short abbreviation for display

**Usage**: Primary reference for spell component data throughout the application.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_COMPONENT_MAP definition)

### **SpellDescriptorMap**

The primary data structure containing all spell descriptor definitions with their characteristics.

**Purpose**: Provides a comprehensive map of all available spell descriptors with their defining characteristics.

**Structure**:
- **Descriptor ID**: Unique identifier for each descriptor
- **Name**: Human-readable descriptor name

**Usage**: Primary reference for spell descriptor data throughout the application.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_DESCRIPTOR_MAP definition)

### **SpellRangeMap**

The primary data structure containing all spell range type definitions with their characteristics.

**Purpose**: Provides a comprehensive map of all available spell range types with their defining characteristics.

**Structure**:
- **Range ID**: Unique identifier for each range type
- **Name**: Human-readable range name
- **Abbreviation**: Short abbreviation for display

**Usage**: Primary reference for spell range data throughout the application.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_RANGE_MAP definition)

### **SpellSchoolMap**

The primary data structure containing all spell school definitions with their characteristics.

**Purpose**: Provides a comprehensive map of all available spell schools with their defining characteristics.

**Structure**:
- **School ID**: Unique identifier for each school
- **Name**: Human-readable school name
- **Abbreviation**: Short abbreviation for display

**Usage**: Primary reference for spell school data throughout the application.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_SCHOOL_MAP definition)

### **SpellSubschoolMap**

The primary data structure containing all spell subschool definitions with their characteristics.

**Purpose**: Provides a comprehensive map of all available spell subschools with their defining characteristics.

**Structure**:
- **Subschool ID**: Unique identifier for each subschool
- **Name**: Human-readable subschool name
- **School ID**: Reference to the parent school

**Usage**: Primary reference for spell subschool data throughout the application.

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SPELL_SUBSCHOOL_MAP definition)

## 🎯 **Spell Calculations**

### **Component Abbreviation Calculation**

The component abbreviation calculation system for displaying spell components.

**Purpose**: Calculate component abbreviations for display in spell lists and details.

**Calculation Pattern**:
- **Component Array**: Array of component IDs
- **Abbreviation Lookup**: Look up abbreviations for each component
- **String Concatenation**: Join abbreviations with commas

**Example**: `[0, 1, 2]` becomes `"V, S, M"`

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SpellComponentAbbrList function)

### **Descriptor Name Calculation**

The descriptor name calculation system for displaying spell descriptors.

**Purpose**: Calculate descriptor names for display in spell lists and details.

**Calculation Pattern**:
- **Descriptor Array**: Array of descriptor IDs
- **Name Lookup**: Look up names for each descriptor
- **String Concatenation**: Join names with commas

**Example**: `[1, 4, 11]` becomes `"Acid, Cold, Fire"`

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SpellDescriptorNameList function)

### **School Name Calculation**

The school name calculation system for displaying spell schools.

**Purpose**: Calculate school names for display in spell lists and details.

**Calculation Pattern**:
- **School Array**: Array of school IDs
- **Name Lookup**: Look up names for each school
- **String Concatenation**: Join names with commas

**Example**: `[1, 5]` becomes `"Abjuration, Evocation"`

**Source File**: `packages/shared/static-data/src/SpellData.ts` (SpellSchoolNameList function)

## 🔗 **Integration with Other Systems**

### **Class System Integration**

The spell system integrates with the class system through spell level mapping:

**Level Mapping**: Spells are mapped to classes with specific levels
**Class Spell Lists**: Classes have access to specific spell lists
**Level Visibility**: Controls which spells are visible to which classes
**Spell Progression**: Enables class spell progression systems

**Integration Pattern**: The spell system provides the foundation for class spellcasting, with classes defining which spells they can access and at what levels.

**Related Documentation**: [Class System Static Data](../class-system/static-data.md)

### **Character System Integration**

The spell system provides the foundation for character spellcasting:

**Character Spells**: Characters can learn and cast spells
**Spell Lists**: Characters have access to class spell lists
**Spell Progression**: Character spellcasting follows class progression
**Spell Management**: Characters can manage their known spells

**Integration Pattern**: The spell system provides the framework for character spellcasting, with character classes determining spell access and progression.

**Related Documentation**: [Character Management Static Data](../character-management/static-data.md)

### **Source Book System Integration**

The spell system integrates with the source book system for content attribution:

**Source Attribution**: Spells are properly attributed to source books
**Page References**: Page numbers for quick lookup
**Content Validation**: Source attribution enables content validation
**Multiple Sources**: Support for spells appearing in multiple sources

**Integration Pattern**: The spell system maintains proper source attribution, ensuring all spell content is properly credited and traceable.

**Related Documentation**: [Source Book System Static Data](../source-book-system/static-data.md)

## 🔧 **Performance Considerations**

### **Data Access Patterns**

The spell system static data is optimized for efficient access:

**Map-based Access**: Direct access to spell data by ID
**Cached Lookups**: Frequently accessed data is cached for performance
**Lazy Loading**: Data is loaded only when needed
**Memory Management**: Efficient memory usage for large datasets

### **Calculation Optimization**

Spell calculations are optimized for performance:

**Pre-calculated Values**: Common calculations are pre-computed
**Formula Caching**: Formula results are cached to avoid recalculation
**Efficient Algorithms**: Optimized algorithms for spell calculations
**Batch Processing**: Multiple calculations are processed in batches

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Spell system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Spell system validation rules and schemas
- **[Backend Implementation](backend-implementation.md)** - Spell system backend implementation
- **[Frontend Components](frontend-components.md)** - Spell system frontend implementation
- **[Class System Static Data](../class-system/static-data.md)** - Class system enums and types
- **[Character Management Static Data](../character-management/static-data.md)** - Character system enums and types
- **[Source Book System Static Data](../source-book-system/static-data.md)** - Source book system enums and types
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns and conventions
