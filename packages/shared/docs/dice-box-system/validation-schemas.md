# Dice Box System Validation Schemas

*Complete documentation for the Dice Box system validation schemas, including Zod validation rules, type safety, and data validation patterns.*

## 📋 **Overview**

The Dice Box system validation schemas provide comprehensive type safety and data validation for all dice configuration operations, user personalization, and system administration. The schemas ensure data integrity across the entire application stack and provide clear validation rules for physics properties, visual settings, and user preferences.

**Source File**: `shared/schema/src/diceBox.ts`

## 🏗️ **Validation Architecture**

The Dice Box system validation follows the shared [Validation Schema Patterns](../application-overview/validation-schemas.md) with dice-specific implementations:

**Type Safety**: Comprehensive TypeScript type definitions with Zod validation
**Schema Composition**: Reusable schema components for common validation patterns
**Error Handling**: Clear error messages and validation feedback
**Cross-System Validation**: Integration with user management and static data validation

## 🔧 **Core Validation Schemas**

### **DiceBoxAdminConfigSchema**

Defines validation rules for admin-defined dice configurations that serve as base templates for user personalization.

**Purpose**: Validates complete dice configuration data with physics and visual properties.

**Validation Rules**:
- **`id`**: Positive integer for configuration identification
- **`name`**: String with default value for configuration naming
- **`isDefault`**: Boolean flag for default configuration designation

**Physics Property Validation**:
- **`gravity`**: Number between 0 and 5 (default: 1)
- **`mass`**: Number between 0.1 and 10 (default: 1)
- **`friction`**: Number between 0 and 1 (default: 0.8)
- **`restitution`**: Number between 0 and 1 (default: 0)
- **`angularDamping`**: Number between 0 and 1 (default: 0.4)
- **`linearDamping`**: Number between 0 and 1 (default: 0.4)
- **`spinForce`**: Number between 0 and 10 (default: 4)
- **`throwForce`**: Number between 0 and 10 (default: 5)
- **`startingHeight`**: Integer between 1 and 20 (default: 8)
- **`settleTimeout`**: Integer between 1000 and 10000 (default: 5000)

**Visual Property Validation**:
- **`lightIntensity`**: Number between 0 and 5 (default: 1)
- **`enableShadows`**: Boolean flag for shadow rendering (default: true)
- **`shadowTransparency`**: Number between 0 and 1 (default: 0.8)
- **`theme`**: Integer representing 3D dice theme ID (default: 1)
- **`themeColor`**: String representing hex color value (default: "#2e8555")
- **`iconColor`**: Optional string for icon color customization
- **`scale`**: Number between 2 and 9 (default: 6)

**Usage Examples**:
- **Admin Configuration Creation**: Validates new configuration data
- **Configuration Updates**: Validates configuration modification requests
- **Configuration Retrieval**: Validates configuration response data
- **Default Configuration**: Validates default configuration assignment

### **DiceBoxConfigIdParamSchema**

Defines validation rules for configuration ID parameters used in API operations.

**Purpose**: Validates configuration identification parameters for CRUD operations.

**Validation Rules**:
- **`id`**: Positive integer for configuration identification

**Usage Examples**:
- **Configuration Retrieval**: Validates configuration ID in GET requests
- **Configuration Updates**: Validates configuration ID in PUT requests
- **Configuration Deletion**: Validates configuration ID in DELETE requests

### **CreateDiceBoxAdminConfigRequestSchema**

Defines validation rules for creating new admin dice configurations.

**Purpose**: Validates configuration creation requests with required and optional fields.

**Validation Rules**:
- **`config`**: Complete DiceBoxAdminConfig object without ID
- **Required Fields**: All configuration properties with appropriate defaults
- **Optional Fields**: Icon color and other nullable properties

**Usage Examples**:
- **New Configuration Creation**: Validates admin configuration creation requests
- **Configuration Templates**: Validates template-based configuration creation
- **Default Configuration**: Validates default configuration creation

### **UpdateDiceBoxAdminConfigRequestSchema**

Defines validation rules for updating existing admin dice configurations.

**Purpose**: Validates configuration update requests with partial or complete data.

**Validation Rules**:
- **`config`**: Partial or complete DiceBoxAdminConfig object
- **Optional Fields**: All configuration properties are optional for updates
- **Validation**: Maintains existing validation rules for provided fields

**Usage Examples**:
- **Configuration Updates**: Validates configuration modification requests
- **Property Updates**: Validates individual property updates
- **Bulk Updates**: Validates multiple property updates

### **GetAllDiceConfigsResponseSchema**

Defines validation rules for configuration listing responses.

**Purpose**: Validates responses containing multiple configuration objects.

**Validation Rules**:
- **`total`**: Integer representing total configuration count
- **`results`**: Array of DiceBoxAdminConfig objects

**Usage Examples**:
- **Configuration Lists**: Validates admin configuration listing responses
- **User Selection**: Validates available configuration responses for users
- **Admin Management**: Validates configuration management interface data

### **UpdateUserDiceConfigRequestSchema**

Defines validation rules for user dice configuration updates.

**Purpose**: Validates user-specific configuration override requests.

**Validation Rules**:
- **`diceConfigBase`**: Positive integer referencing admin configuration
- **`diceConfigOverrides`**: Array of user-specific property overrides
- **Override Validation**: Each override contains property name and value

**Usage Examples**:
- **User Preferences**: Validates user configuration preference updates
- **Property Overrides**: Validates individual property customization
- **Configuration Switching**: Validates base configuration changes

### **UserDiceConfigSchema**

Defines validation rules for user dice configuration data.

**Purpose**: Validates complete user configuration data including base and overrides.

**Validation Rules**:
- **`diceConfigBase`**: Positive integer referencing admin configuration
- **`diceConfigOverrides`**: Array of user-specific property overrides
- **Override Structure**: Each override contains ID, user ID, property name, and value

**Usage Examples**:
- **User Configuration Retrieval**: Validates user configuration response data
- **Configuration Display**: Validates configuration data for user interface
- **Configuration Management**: Validates configuration data for admin management

## 🔗 **Cross-System Validation**

### **User Management Integration**

The Dice Box system validation integrates with user management validation:

**User Authentication**: Validates user authentication for configuration operations
**User Authorization**: Validates user permissions for configuration management
**User Data Validation**: Validates user references in configuration overrides
**Profile Integration**: Validates user profile integration with dice preferences

**Related Documentation**: [User Management Validation Schemas](../user-management/validation-schemas.md)

### **Static Data Integration**

The Dice Box system validation integrates with static data validation:

**Theme Validation**: Validates 3D dice theme references against static data
**Color Validation**: Validates color values against theme requirements
**Enum Validation**: Validates enum values against static data definitions
**Reference Validation**: Validates references to static data entities

**Related Documentation**: [Static Data](static-data.md)

## 📊 **Validation Patterns**

### **Configuration Property Validation**

**Physics Properties**: Numeric validation with appropriate ranges and defaults
**Visual Properties**: Color validation, boolean flags, and numeric ranges
**Theme Properties**: Enum validation against available 3D dice themes
**Scale Properties**: Numeric validation for rendering and display properties

### **User Override Validation**

**Property Names**: String validation for configuration property names
**Property Values**: String validation for override values with type conversion
**Uniqueness**: Validation for unique property overrides per user
**Inheritance**: Validation for proper configuration inheritance relationships

### **API Request Validation**

**Parameter Validation**: Path parameter validation for configuration operations
**Body Validation**: Request body validation for configuration data
**Response Validation**: Response data validation for configuration operations
**Error Validation**: Error response validation for failed operations

## 🔧 **Error Handling**

### **Validation Error Messages**

**Property Validation**: Clear error messages for invalid property values
**Range Validation**: Specific error messages for out-of-range values
**Required Fields**: Clear indication of missing required fields
**Type Validation**: Specific error messages for type mismatches

### **Error Response Patterns**

**Validation Errors**: Structured error responses for validation failures
**Configuration Errors**: Specific error messages for configuration issues
**User Errors**: User-friendly error messages for user-related issues
**System Errors**: Technical error messages for system-related issues

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Dice Box system database models and relationships
- **[Static Data](static-data.md)** - 3D dice themes and RPG dice types
- **[Backend Implementation](backend-implementation.md)** - Dice Box system backend implementation
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns
- **[User Management Validation Schemas](../user-management/validation-schemas.md)** - User management integration
- **[Static Data Integration](../application-overview/static-data.md)** - Static data validation patterns

## Summary

The Dice Box system validation schemas provide comprehensive type safety and data validation for all dice configuration operations. The schemas ensure data integrity, provide clear validation rules, and integrate properly with other system validation patterns.

Key features include:
- **Comprehensive Validation**: Complete validation for all configuration properties
- **Type Safety**: Full TypeScript integration with Zod validation
- **Cross-System Integration**: Proper integration with user management and static data
- **Error Handling**: Clear error messages and validation feedback
- **Performance Optimization**: Efficient validation with appropriate caching
- **Extension Support**: Extensible validation for future enhancements

The validation schemas are designed to support the full range of Dice Box system features while maintaining data integrity and providing clear validation feedback for users and developers.
