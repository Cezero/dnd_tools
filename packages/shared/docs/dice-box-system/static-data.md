# Dice Box System Static Data

*Complete documentation for the Dice Box system static data, including 3D dice themes, RPG dice types, and reference data structures.*

## 📋 **Overview**

The Dice Box system static data provides essential reference information for 3D dice themes, RPG dice types, and configuration constants. This data supports the dice rolling interface, theme management, and user customization features throughout the application.

**Source Files**:
- **3D Dice Themes**: `shared/static-data/src/DiceData.ts`
- **RPG Dice Types**: `shared/static-data/src/CommonData.ts`

## 🏗️ **Static Data Architecture**

The Dice Box system static data follows the shared [Static Data Patterns](../application-overview/static-data.md) with dice-specific implementations:

**Enum Definitions**: Type-safe enumeration values for dice types and themes
**Reference Maps**: Key-value mappings for complex data relationships
**Constants**: Fixed values used throughout the dice system
**Utility Functions**: Helper functions for data access and validation

## 🔧 **Core Static Data Structures**

### **ThreeDDiceTheme Enum**

Defines the available 3D dice themes for visual customization of the dice rolling interface.

**Purpose**: Provides theme identification and selection for dice appearance customization.

**Values**:
- **`DEFAULT: 1`**: Default dice theme with standard colors
- **`ROCK: 2`**: Rock-textured dice with natural stone appearance
- **`DICE_OF_ROLLING: 3`**: Multicolored dice based on Dice of Rolling
- **`BLUE_GREEN_METAL: 4`**: Metallic dice with blue-green finish
- **`GEMSTONE: 5`**: Gemstone-textured dice with precious stone appearance
- **`RUST: 6`**: Weathered dice with rust texture
- **`SMOOTH: 7`**: Smooth, polished dice with clean surfaces
- **`WOODEN: 8`**: Wooden-textured dice with natural grain

**Usage Examples**:
- **Theme Selection**: Choose 3D dice themes for configuration
- **Theme Validation**: Validate theme references in configuration data
- **Theme Display**: Display theme names in user interfaces
- **Theme Management**: Manage available themes in admin interfaces

**Source File**: `shared/static-data/src/DiceData.ts`

### **THREE_D_DICE_THEMES Map**

Reference table containing 3D dice theme definitions with comprehensive theme information.

**Structure**: Object mapping theme IDs to theme definitions
**Purpose**: Provides detailed theme information for configuration and display
**Usage**: Primary lookup table for theme data and validation

**Theme Properties**:
- **`id`**: Unique theme identifier
- **`name`**: Human-readable theme name
- **`systemName`**: System identifier for theme loading
- **`description`**: Detailed theme description
- **`ignoresThemeColor`**: Whether theme ignores color customization

**Theme Categories**:
- **Natural Themes**: Rock, wooden, gemstone themes with natural textures
- **Metallic Themes**: Blue-green metal theme with metallic finish
- **Special Themes**: Dice of Rolling with multicolored appearance
- **Classic Themes**: Default, smooth, rust themes with traditional appearance

**Usage Examples**:
- **Theme Configuration**: Configure dice themes in admin settings
- **Theme Display**: Show theme information in user interfaces
- **Theme Validation**: Validate theme properties and requirements
- **Theme Loading**: Load theme assets and properties

**Source File**: `shared/static-data/src/DiceData.ts`

### **RpgDice Enum**

Defines the standard RPG dice types used in tabletop roleplaying games.

**Purpose**: Provides dice type identification for dice rolling operations and interface elements.

**Values**:
- **`D2: 7`**: Two-sided die (coin flip simulation)
- **`D3: 8`**: Three-sided die
- **`D4: 0`**: Four-sided die (pyramid)
- **`D6: 1`**: Six-sided die (cube)
- **`D8: 2`**: Eight-sided die
- **`D10: 3`**: Ten-sided die
- **`D12: 4`**: Twelve-sided die
- **`D20: 5`**: Twenty-sided die
- **`D100: 6`**: Hundred-sided die (percentile)

**Usage Examples**:
- **Dice Selection**: Choose dice types for rolling operations
- **Dice Validation**: Validate dice types in roll notation
- **Dice Display**: Display dice types in user interfaces
- **Dice Management**: Manage available dice types in configuration

**Source File**: `shared/static-data/src/CommonData.ts`

### **RPG_DICE Map**

Reference table containing RPG dice definitions with comprehensive dice information.

**Structure**: Object mapping dice IDs to dice definitions
**Purpose**: Provides detailed dice information for rolling operations and display
**Usage**: Primary lookup table for dice data and validation

**Dice Properties**:
- **`id`**: Unique dice identifier
- **`name`**: Dice notation name (e.g., "d4", "d20")
- **`sides`**: Number of sides on the die

**Dice Categories**:
- **Standard Dice**: D4, D6, D8, D10, D12, D20 for common game mechanics
- **Special Dice**: D2, D3 for specific game mechanics
- **Percentile Dice**: D100 for percentage-based mechanics

**Usage Examples**:
- **Dice Rolling**: Validate and process dice roll notation
- **Dice Display**: Show dice information in user interfaces
- **Dice Validation**: Validate dice types and properties
- **Dice Management**: Manage available dice types in configuration

**Source File**: `shared/static-data/src/CommonData.ts`

## 🔗 **Integration Patterns**

### **Configuration Integration**

The Dice Box static data integrates with configuration management:

**Theme References**: Configuration data references 3D dice theme enums
**Theme Validation**: Configuration validation ensures valid theme references
**Theme Loading**: Configuration loading uses theme system names
**Theme Display**: Configuration interfaces display theme names and descriptions

**Related Documentation**: [Database Schema](database-schema.md)

### **User Interface Integration**

The Dice Box static data integrates with user interface components:

**Dice Buttons**: Dice button components use RPG dice type data
**Theme Selection**: Theme selection interfaces use 3D dice theme data
**Configuration Display**: Configuration interfaces display theme and dice information
**Validation Feedback**: User interfaces provide validation feedback using static data

**Related Documentation**: [Frontend Components](frontend-components.md)

### **Validation Integration**

The Dice Box static data integrates with validation systems:

**Theme Validation**: Validation schemas reference 3D dice theme enums
**Dice Validation**: Validation schemas reference RPG dice type enums
**Reference Validation**: Validation ensures references to valid static data
**Type Safety**: Static data provides type safety for configuration and operations

**Related Documentation**: [Validation Schemas](validation-schemas.md)

## 📊 **Data Access Patterns**

### **Theme Data Access**

**Theme Selection**: Retrieve available themes for user selection
**Theme Information**: Get detailed theme information for display
**Theme Validation**: Validate theme references in configuration data
**Theme Loading**: Load theme assets and properties for 3D rendering

### **Dice Data Access**

**Dice Types**: Retrieve available dice types for rolling operations
**Dice Information**: Get detailed dice information for display
**Dice Validation**: Validate dice types in roll notation
**Dice Management**: Manage available dice types in configuration

### **Performance Considerations**

**Caching**: Static data is cached for efficient access
**Lazy Loading**: Theme assets are loaded on-demand for performance
**Validation Caching**: Validation results are cached for repeated operations
**Memory Management**: Efficient memory usage for static data structures

## 🔧 **Extension Points**

### **Theme Extensions**

**Custom Themes**: Support for custom 3D dice themes
**Theme Properties**: Extensible theme property definitions
**Theme Assets**: Dynamic theme asset loading and management
**Theme Customization**: Advanced theme customization options

### **Dice Extensions**

**Custom Dice**: Support for custom dice types and properties
**Dice Properties**: Extensible dice property definitions
**Dice Notation**: Advanced dice notation parsing and validation
**Dice Customization**: Custom dice appearance and behavior

### **Integration Extensions**

**External Themes**: Integration with external theme sources
**Theme Sharing**: User ability to share custom themes
**Dice Sharing**: User ability to share custom dice configurations
**Cross-System Integration**: Integration with other game systems

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Dice Box system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Dice Box system validation rules and schemas
- **[Frontend Components](frontend-components.md)** - Dice Box system frontend components
- **[Static Data Patterns](../application-overview/static-data.md)** - Shared static data patterns
- **[Configuration Management](backend-implementation.md)** - Configuration integration patterns
- **[User Interface Integration](frontend-components.md)** - UI integration patterns

## Summary

The Dice Box system static data provides comprehensive reference information for 3D dice themes, RPG dice types, and configuration constants. The static data supports theme management, dice rolling operations, and user customization throughout the application.

Key features include:
- **Comprehensive Themes**: Complete 3D dice theme definitions with properties
- **Standard Dice Types**: Full RPG dice type definitions for game mechanics
- **Type Safety**: Complete TypeScript integration with enum definitions
- **Performance Optimization**: Efficient data access and caching strategies
- **Extension Support**: Extensible data structures for future enhancements
- **Cross-System Integration**: Proper integration with configuration and validation systems

The static data is designed to support the full range of Dice Box system features while maintaining data integrity and providing clear reference information for developers and users.
