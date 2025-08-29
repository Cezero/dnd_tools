# User Management Database Schema

*Database schema documentation for user accounts, authentication, and user-specific configurations.*

## 📊 **Core User Models**

### **User Model**
**Database Table**: `User`

The User model defines the core structure for user accounts, including authentication information, profile data, and user-specific configurations.

**Source File**: `backend/prisma/schema.prisma`

**Database Fields**:
- **`id`**: Primary key (Int, auto-increment)
- **`username`**: Unique username (String)
- **`email`**: User email address (String)
- **`password`**: Hashed password (String)
- **`isAdmin`**: Admin privileges flag (Boolean, default: false)
- **`createdAt`**: Account creation timestamp (DateTime, default: now())
- **`updatedAt`**: Last update timestamp (DateTime, updatedAt)
- **`preferredEditionId`**: User's preferred D&D edition (Int, nullable)
- **`diceConfigBase`**: Reference to base DiceBox configuration (Int, nullable)

**Database Relationships**:
- **`characters`**: One-to-many with `UserCharacter` (user owns multiple characters)
- **`diceConfigOverrides`**: One-to-many with `UserDiceConfigOverride` (user has multiple configuration overrides)
- **`diceConfigBaseRef`**: Many-to-one with `DiceBoxAdminConfig` (UserDiceConfigBase relation)

**Database Constraints**:
- **Unique Constraints**: `username`, `email`
- **Foreign Key**: `diceConfigBase` references `DiceBoxAdminConfig.id` (SET NULL on delete)

**Identity and Audit Fields**: Follows [Database Schema Patterns](../application-overview/database-schema.md#identity-and-audit-fields)

## 🎲 **DiceBox Configuration Models**

### **DiceBoxAdminConfig Model**
**Database Table**: `DiceBoxAdminConfig`

Defines system-wide DiceBox configurations that can be used as base configurations for users. These configurations provide templates for dice physics and visual properties.

**Source File**: `backend/prisma/schema.prisma`

**Database Fields**:
- **`id`**: Primary key (Int, auto-increment)
- **`name`**: Configuration name (String, default: "Default Configuration")
- **`isDefault`**: Whether this is the default configuration (Boolean, default: false)

**Physics Properties**:
- **`gravity`**: Gravity strength (Float, default: 1)
- **`mass`**: Dice mass (Float, default: 1)
- **`friction`**: Surface friction (Float, default: 0.8)
- **`restitution`**: Bounce factor (Float, default: 0)
- **`angularDamping`**: Angular velocity damping (Float, default: 0.4)
- **`linearDamping`**: Linear velocity damping (Float, default: 0.4)
- **`spinForce`**: Spin force multiplier (Float, default: 4)
- **`throwForce`**: Throw force multiplier (Float, default: 5)
- **`startingHeight`**: Starting height for dice (Int, default: 8)
- **`settleTimeout`**: Timeout for dice settling (Int, default: 5000)

**Visual Properties**:
- **`lightIntensity`**: Light intensity (Float, default: 1)
- **`enableShadows`**: Whether shadows are enabled (Boolean, default: true)
- **`shadowTransparency`**: Shadow transparency (Float, default: 0.8)
- **`theme`**: 3D dice theme ID (Int, default: 1)
- **`themeColor`**: Theme color (String, default: "#2e8555")
- **`iconColor`**: Color for DiceButton icons (String, nullable)
- **`scale`**: Dice scale (Float, default: 6)

**Metadata**:
- **`createdAt`**: Creation timestamp (DateTime, default: now())
- **`updatedAt`**: Last update timestamp (DateTime, updatedAt)

**Database Relationships**:
- **`users`**: One-to-many with `User` (UserDiceConfigBase relation)

**Database Constraints**:
- **Unique Constraint**: Only one configuration can be marked as default (`isDefault`)

### **UserDiceConfigOverride Model**
**Database Table**: `UserDiceConfigOverride`

Defines user-specific overrides for DiceBox configuration properties. These overrides allow users to customize specific aspects of their dice configuration while inheriting the base configuration.

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

## 🔗 **Key Relationships**

### **User Definition Flow**
```
User (User Account)
├── UserCharacter (User's Characters)
├── DiceBoxAdminConfig (Base Dice Configuration)
└── UserDiceConfigOverride (User-Specific Overrides)
```

### **DiceBox Configuration Flow**
```
DiceBoxAdminConfig (Base Configuration)
├── Physics Properties (Gravity, Mass, Friction, etc.)
├── Visual Properties (Theme, Colors, Scale, etc.)
└── User Overrides (UserDiceConfigOverride)
```

### **User Configuration Flow**
```
User → DiceBoxAdminConfig (Base Config)
├── Inherit Base Configuration
├── Apply User Overrides
└── Generate Final Configuration
```

## 📋 **Database Constraints**

### **Unique Constraints**
- **`User.username`**: Ensures unique usernames across the system
- **`User.email`**: Ensures unique email addresses across the system
- **`UserDiceConfigOverride[userId, propertyName]`**: Ensures unique overrides per property per user
- **`DiceBoxAdminConfig.isDefault`**: Only one configuration can be marked as default

### **Foreign Key Relationships**
- **`User.preferredEditionId`**: References edition information (nullable)
- **`User.diceConfigBase`**: References `DiceBoxAdminConfig.id` (nullable, SET NULL on delete)
- **`UserDiceConfigOverride.userId`**: References `User.id` (CASCADE on delete)

### **Cascade Rules**
- **User Deletion**: Cascades to `UserDiceConfigOverride` records
- **DiceBoxAdminConfig Deletion**: Sets `User.diceConfigBase` to NULL
- **UserCharacter**: Handled by Character Management System

## 🎯 **Data Validation Rules**

### **User Creation**
- **Username**: Must be unique, 3-50 characters, alphanumeric + underscores only
- **Email**: Must be unique, valid email format, max 255 characters
- **Password**: Must be properly hashed using bcrypt with salt rounds
- **Admin Flag**: Must be boolean value
- **Preferred Edition**: Must reference valid edition (nullable)

### **DiceBox Configuration**
- **Default Configuration**: Only one configuration can be marked as default
- **Physics Properties**: Must be within valid ranges (positive values, reasonable limits)
- **Visual Properties**: Must be valid (hex colors, positive scales, valid theme IDs)
- **Configuration Name**: Must be provided and non-empty

### **User Overrides**
- **User Existence**: User must exist in the system
- **Property Name**: Must be a valid configuration property name
- **Property Value**: Must be convertible to appropriate type (string, number, boolean)
- **Uniqueness**: Only one override per property per user

## 📊 **Common Database Patterns**

### **User Account Creation**
```sql
INSERT INTO User (username, email, password, isAdmin, preferredEditionId) VALUES
('john_doe', 'john@example.com', 'hashed_password', false, 1);
```

### **DiceBox Configuration Creation**
```sql
INSERT INTO DiceBoxAdminConfig (
    name, isDefault, gravity, mass, friction, theme, themeColor, scale
) VALUES (
    'Default Configuration', true, 1.0, 1.0, 0.8, 1, '#2e8555', 6.0
);
```

### **User Dice Configuration**
```sql
-- Set user's base configuration
UPDATE User SET diceConfigBase = 1 WHERE id = 1;

-- Add user-specific overrides
INSERT INTO UserDiceConfigOverride (userId, propertyName, propertyValue) VALUES
(1, 'theme', '2'),
(1, 'scale', '8.0'),
(1, 'gravity', '0.8');
```

### **User Profile Retrieval**
```sql
SELECT u.*, 
       GROUP_CONCAT(CONCAT(udco.propertyName, ':', udco.propertyValue)) as overrides
FROM User u
LEFT JOIN UserDiceConfigOverride udco ON u.id = udco.userId
WHERE u.id = ?
GROUP BY u.id;
```

## 🔄 **Data Access Patterns**

### **Authentication Queries**
- **User Lookup by Username**: `SELECT * FROM User WHERE username = ?`
- **User Lookup by Email**: `SELECT * FROM User WHERE email = ?`
- **Password Verification**: Compare bcrypt hash with provided password

### **Profile Management Queries**
- **User Profile Retrieval**: `SELECT * FROM User WHERE id = ?`
- **Profile Update**: `UPDATE User SET ... WHERE id = ?`
- **Configuration Overrides**: `SELECT * FROM UserDiceConfigOverride WHERE userId = ?`

### **DiceBox Configuration Queries**
- **Base Configuration**: `SELECT * FROM DiceBoxAdminConfig WHERE id = ?`
- **Default Configuration**: `SELECT * FROM DiceBoxAdminConfig WHERE isDefault = true`
- **User Overrides**: `SELECT * FROM UserDiceConfigOverride WHERE userId = ?`

## 🏗️ **Extension Points**

### **Adding New User Fields**
1. **Database Schema**: Add new fields to User model
2. **Validation**: Update Zod schemas for new fields
3. **Services**: Update backend services to handle new fields
4. **Frontend**: Update React components for new fields
5. **Documentation**: Update this documentation

### **Adding New Configuration Properties**
1. **DiceBoxAdminConfig**: Add new properties to base configuration
2. **UserDiceConfigOverride**: New properties can be overridden
3. **Validation**: Update Zod schemas for new properties
4. **Frontend**: Update DiceBox components for new properties
5. **Documentation**: Update configuration documentation

### **Adding New User Types**
1. **User Model**: Add new fields for user type differentiation
2. **Authorization**: Update authorization logic for new user types
3. **Validation**: Update validation rules for new user types
4. **Frontend**: Update UI for new user type features
5. **Documentation**: Update user type documentation

## 🔗 **Cross-System References**

### **Character Management Integration**
- **UserCharacter Model**: References `User.id` for character ownership
- **Character Data Isolation**: Users can only access their own characters
- **Character Creation**: Requires valid user authentication

### **DiceBox System Integration**
- **DiceBoxAdminConfig**: Provides base configurations for DiceBox system
- **UserDiceConfigOverride**: Provides user-specific customizations
- **Configuration Merging**: Combines base and override configurations

**Related Documentation**: [Dice Box System Database Schema](../dice-box-system/database-schema.md)

### **Edition System Integration**
- **Preferred Edition**: User's preferred D&D edition affects available content
- **Edition Validation**: Ensures preferred edition references valid edition data
- **Content Filtering**: Edition preferences affect character creation options

## Summary

The User Management database schema provides a robust foundation for user authentication, profile management, and user-specific configurations. The schema follows established patterns for identity and audit fields, implements proper foreign key relationships, and provides comprehensive constraint validation.

Key features include:
- **Secure User Storage**: Proper password hashing and authentication data
- **Flexible Configuration**: Base configurations with user-specific overrides
- **Data Integrity**: Comprehensive constraints and validation rules
- **Scalable Design**: Extension points for future enhancements
- **Cross-System Integration**: Proper relationships with character and DiceBox systems

The schema is designed to support the full range of user management features while maintaining data integrity and providing clear extension points for future development.
