# Dice Box System Database Schema

*Database schema documentation for the Dice Box system, including configuration models, user personalization, and system relationships.*

## 📋 **Overview**

The Dice Box system database schema provides persistent storage for dice configuration management, user personalization, and system administration. The schema supports both admin-defined base configurations and user-specific customization overrides, enabling a flexible and personalized dice rolling experience.

**Source File**: `backend/prisma/schema.prisma`

## 🏗️ **Database Architecture**

The Dice Box system database follows the shared [Database Schema Patterns](../application-overview/database-schema.md) with dice-specific implementations:

**Identity and Audit Fields**: Standard creation and update timestamps
**Foreign Key Relationships**: Proper relationships with user management system
**Unique Constraints**: Ensures data integrity for configuration management
**Cascade Rules**: Proper cleanup of related data on deletion

## 📊 **Core Database Models**

### **DiceBoxAdminConfig Model**
**Database Table**: `DiceBoxAdminConfig`

Defines system-wide Dice Box configurations that serve as base templates for user personalization. These configurations provide comprehensive physics and visual properties for the 3D dice rolling experience.

**Source File**: `backend/prisma/schema.prisma`

**Database Fields**:
- **`id`**: Primary key (Int, auto-increment)
- **`name`**: Configuration name (String, default: "Default Configuration")
- **`isDefault`**: Whether this is the default configuration (Boolean, default: false)

**Physics Properties**:
- **`gravity`**: Gravity strength affecting dice movement (Float, default: 1)
- **`mass`**: Dice mass affecting physics behavior (Float, default: 1)
- **`friction`**: Surface friction affecting dice rolling (Float, default: 0.8)
- **`restitution`**: Bounce factor for dice collisions (Float, default: 0)
- **`angularDamping`**: Angular velocity damping (Float, default: 0.4)
- **`linearDamping`**: Linear velocity damping (Float, default: 0.4)
- **`spinForce`**: Spin force multiplier for dice throws (Float, default: 4)
- **`throwForce`**: Throw force multiplier for dice movement (Float, default: 5)
- **`startingHeight`**: Starting height for dice drops (Int, default: 8)
- **`settleTimeout`**: Timeout for dice settling in milliseconds (Int, default: 5000)

**Visual Properties**:
- **`lightIntensity`**: Light intensity for 3D rendering (Float, default: 1)
- **`enableShadows`**: Whether shadows are enabled (Boolean, default: true)
- **`shadowTransparency`**: Shadow transparency level (Float, default: 0.8)
- **`theme`**: 3D dice theme ID (Int, default: 1, references @ThreeDDiceTheme enum)
- **`themeColor`**: Theme color for dice appearance (String, default: "#2e8555")
- **`iconColor`**: Color for DiceButton icons (String, nullable)
- **`scale`**: Dice scale factor for rendering (Float, default: 6)

**Metadata**:
- **`createdAt`**: Creation timestamp (DateTime, default: now())
- **`updatedAt`**: Last update timestamp (DateTime, updatedAt)

**Database Relationships**:
- **`users`**: One-to-many with `User` (UserDiceConfigBase relation)

**Database Constraints**:
- **Unique Constraint**: Only one configuration can be marked as default (`isDefault`)

**Identity and Audit Fields**: Follows [Database Schema Patterns](../application-overview/database-schema.md#identity-and-audit-fields)

### **UserDiceConfigOverride Model**
**Database Table**: `UserDiceConfigOverride`

Defines user-specific overrides for Dice Box configuration properties. These overrides allow users to customize specific aspects of their dice configuration while inheriting the base configuration from admin-defined templates.

**Source File**: `backend/prisma/schema.prisma`

**Database Fields**:
- **`id`**: Primary key (Int, auto-increment)
- **`userId`**: Reference to user (Int)
- **`propertyName`**: Name of the property to override (String)
- **`propertyValue`**: Override value stored as string (String)

**Database Relationships**:
- **`user`**: Many-to-one with `User` (cascade delete)

**Database Constraints**:
- **Unique Constraint**: `[userId, propertyName]` - One override per property per user
- **Foreign Key**: `userId` references `User.id` (CASCADE on delete)

**Identity and Audit Fields**: Follows [Database Schema Patterns](../application-overview/database-schema.md#identity-and-audit-fields)

## 🔗 **Key Relationships**

### **User Configuration Flow**
```
User (User Account)
├── DiceBoxAdminConfig (Base Configuration)
└── UserDiceConfigOverride (User-Specific Overrides)
```

### **Configuration Inheritance Flow**
```
DiceBoxAdminConfig (Base Configuration)
├── Physics Properties (Gravity, Mass, Friction, etc.)
├── Visual Properties (Theme, Colors, Scale, etc.)
└── User Overrides (UserDiceConfigOverride)
```

### **User Personalization Flow**
```
User → DiceBoxAdminConfig (Base Config)
├── Inherit Base Configuration
├── Apply User Overrides
└── Generate Final Configuration
```

## 📋 **Database Constraints**

### **Unique Constraints**
- **`DiceBoxAdminConfig.isDefault`**: Only one configuration can be marked as default
- **`UserDiceConfigOverride[userId, propertyName]`**: Ensures unique overrides per property per user

### **Foreign Key Relationships**
- **`User.diceConfigBase`**: References `DiceBoxAdminConfig.id` (nullable, SET NULL on delete)
- **`UserDiceConfigOverride.userId`**: References `User.id` (CASCADE on delete)

### **Cascade Rules**
- **User Deletion**: Cascades to `UserDiceConfigOverride` records
- **DiceBoxAdminConfig Deletion**: Sets `User.diceConfigBase` to NULL
- **UserDiceConfigOverride**: Handled by Dice Box system

## 🔗 **Cross-System References**

### **User Management Integration**
- **User Model**: References `User.id` for user configuration ownership
- **User Data Isolation**: Users can only access their own configuration overrides
- **User Configuration**: Requires valid user authentication and profile

### **Static Data Integration**
- **Dice Theme References**: `DiceBoxAdminConfig.theme` references @ThreeDDiceTheme enum
- **Theme Validation**: Ensures theme references valid theme data
- **Theme Configuration**: Theme properties affect dice appearance and behavior

**Related Documentation**: [Static Data](static-data.md)

## 📊 **Data Access Patterns**

### **Configuration Retrieval**
- **Admin Configs**: Retrieve all available configurations for user selection
- **User Configs**: Retrieve user's base configuration and overrides
- **Default Configs**: Retrieve default configuration for new users
- **Config Validation**: Validate configuration properties and relationships

### **Configuration Management**
- **Create Configs**: Create new admin configurations with validation
- **Update Configs**: Update existing configurations with property validation
- **Delete Configs**: Delete configurations with proper cleanup
- **Override Management**: Manage user-specific configuration overrides

### **Performance Considerations**
- **Configuration Caching**: Cache frequently accessed configurations
- **Override Optimization**: Efficient querying of user overrides
- **Theme Loading**: Optimized theme data loading and caching
- **Validation Caching**: Cache validation results for performance

## 🔧 **Extension Points**

### **Future Enhancements**
- **Configuration Templates**: Predefined configuration templates for different use cases
- **Configuration Sharing**: User ability to share custom configurations
- **Configuration Versioning**: Version control for configuration changes
- **Configuration Analytics**: Usage analytics for configuration optimization

### **Integration Opportunities**
- **Character Integration**: Character-specific dice configurations
- **Campaign Integration**: Campaign-wide dice configuration settings
- **System Integration**: Integration with other game systems for specialized dice
- **External Integration**: Integration with external dice rolling services

## 🔗 **Related Documentation**

- **[Validation Schemas](validation-schemas.md)** - Dice Box system validation rules and schemas
- **[Static Data](static-data.md)** - 3D dice themes and RPG dice types
- **[Backend Implementation](backend-implementation.md)** - Dice Box system backend implementation
- **[User Management Database Schema](../user-management/database-schema.md)** - User model relationships
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns
- **[Static Data Integration](../application-overview/static-data.md)** - Static data integration patterns

## Summary

The Dice Box system database schema provides a robust foundation for configuration management, user personalization, and system administration. The schema follows established patterns for identity and audit fields, implements proper foreign key relationships, and provides comprehensive constraint validation.

Key features include:
- **Flexible Configuration**: Admin-defined base configurations with user overrides
- **User Personalization**: Individual user customization of dice properties
- **Data Integrity**: Comprehensive constraints and validation rules
- **Scalable Design**: Extension points for future enhancements
- **Cross-System Integration**: Proper relationships with user management and static data
- **Performance Optimization**: Efficient data access patterns and caching strategies

The schema is designed to support the full range of Dice Box system features while maintaining data integrity and providing clear extension points for future development.
