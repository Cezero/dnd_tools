# User Management System

*Comprehensive user account management, authentication, and user-specific configuration system for the D&D Tools application.*

## 📋 **System Overview**

The User Management System provides secure user authentication, profile management, and user-specific configurations including DiceBox settings. The system integrates with the Character Management System, DiceBox Configuration System, and provides the foundation for user-specific data isolation.

### **Core Components**
- **Authentication System**: User registration, login, JWT token management, and session handling
- **User Profile System**: Profile management, preferences, and user-specific configurations
- **DiceBox Configuration**: User-specific dice physics and visual settings
- **Character Ownership**: User-character relationships and data isolation

### **Key Features**
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Profile Management**: User preferences, edition settings, and configuration overrides
- **Admin Privileges**: Role-based access control with admin user capabilities
- **DiceBox Integration**: Personalized dice physics and visual configurations
- **Character Management**: User-owned character data with proper isolation

## 📚 **Documentation Structure**

### **Core Documentation**
- **[Database Schema](database-schema.md)** - Prisma schema models and relationships
- **[Validation Schemas](validation-schemas.md)** - Zod validation rules and type safety
- **[Backend Implementation](backend-implementation.md)** - Authentication and profile services
- **[Frontend Components](frontend-components.md)** - React components and user interface

### **Integration Documentation**
- **[Authentication Integration](authentication-integration.md)** - JWT tokens, middleware, and security
- **[DiceBox Integration](dicebox-integration.md)** - User-specific dice configurations
- **[Character Integration](character-integration.md)** - User-character relationships

## 🔗 **Cross-System References**

### **Related System Documentation**
- **[Character Management System](../character-management/README.md)** - User character data and ownership
- **[DiceBox Configuration System](../dicebox-system/README.md)** - Dice physics and visual settings
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Common backend patterns
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Common database patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Common validation patterns

### **Shared Models and Patterns**
- **User Model**: Core user account data and relationships
- **DiceBoxAdminConfig**: System-wide dice configuration templates
- **UserDiceConfigOverride**: User-specific configuration overrides
- **Authentication Patterns**: JWT tokens, password hashing, session management
- **Profile Management**: User preferences and configuration updates

## 🏗️ **Architecture Overview**

### **System Layers**
```
Frontend Components (React)
├── AuthProvider (Authentication Context)
├── LoginPage (User Login)
├── RegisterPage (User Registration)
└── ProfilePage (Profile Management)

Backend Services
├── AuthService (Authentication Logic)
├── UserProfileService (Profile Management)
└── DiceBoxService (Configuration Management)

Database Models
├── User (Core User Data)
├── DiceBoxAdminConfig (System Configurations)
└── UserDiceConfigOverride (User Overrides)
```

### **Data Flow**
```
User Registration → AuthService → User Creation → JWT Token
User Login → AuthService → Password Verification → JWT Token
Profile Update → UserProfileService → Database Update → New JWT Token
DiceBox Config → DiceBoxService → Configuration Overrides → User Settings
```

## 🔐 **Security Features**

### **Authentication Security**
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **JWT Tokens**: Secure session management with configurable expiration
- **Input Validation**: Comprehensive Zod validation for all user inputs
- **Error Handling**: Secure error responses that don't leak sensitive information

### **Authorization Features**
- **Role-Based Access**: Admin privileges controlled by `isAdmin` flag
- **Route Protection**: Middleware-based route protection for authenticated routes
- **Admin Routes**: Separate admin-only routes with additional authorization
- **User Isolation**: Users can only access their own data

## 📊 **Database Models**

### **Primary Models**
- **`User`**: Core user account with authentication and profile data
- **`DiceBoxAdminConfig`**: System-wide dice configuration templates
- **`UserDiceConfigOverride`**: User-specific configuration overrides

### **Key Relationships**
- **User → UserCharacter**: One-to-many character ownership
- **User → DiceBoxAdminConfig**: Many-to-one base configuration reference
- **User → UserDiceConfigOverride**: One-to-many configuration overrides

## 🎯 **Common Use Cases**

### **User Registration**
1. User submits registration form with username, email, and password
2. System validates input using Zod schemas
3. System checks for existing username/email
4. Password is hashed using bcrypt
5. User account is created with default settings
6. JWT token is generated and returned

### **User Login**
1. User submits login form with username and password
2. System validates input using Zod schemas
3. System retrieves user by username
4. Password is verified using bcrypt
5. JWT token is generated and returned
6. User session is established

### **Profile Management**
1. User updates profile preferences (edition, dice configuration)
2. System validates input using Zod schemas
3. User profile is updated in database
4. DiceBox configuration overrides are applied
5. New JWT token is generated with updated data
6. Frontend state is updated with new configuration

### **DiceBox Configuration**
1. User selects base configuration from admin templates
2. User applies custom overrides for specific properties
3. System combines base configuration with user overrides
4. Final configuration is applied to DiceBox interface
5. Configuration is persisted for future sessions

## 🔧 **Configuration Management**

### **Environment Variables**
- **JWT Secret**: Secret key for JWT token signing
- **JWT Expiration**: Token expiration time (default: 12 hours)
- **Password Salt Rounds**: bcrypt salt rounds (default: 10)

### **Database Configuration**
- **User Table**: Core user account storage
- **DiceBox Config**: System-wide configuration templates
- **User Overrides**: User-specific configuration modifications

## 📈 **Performance Considerations**

### **Authentication Performance**
- **JWT Tokens**: Stateless authentication reduces database queries
- **Password Hashing**: bcrypt provides security with reasonable performance
- **Token Refresh**: Automatic token refresh prevents session expiration
- **Caching**: User profile data can be cached for improved performance

### **Configuration Performance**
- **Base Configurations**: System-wide templates reduce duplication
- **User Overrides**: Minimal storage for user-specific changes
- **Configuration Merging**: Efficient combination of base and override settings

## 🔄 **Maintenance and Extension**

### **Adding New User Fields**
1. Update Prisma schema with new fields
2. Update Zod validation schemas
3. Update backend services to handle new fields
4. Update frontend components to display/edit new fields
5. Update documentation to reflect changes

### **Adding New Configuration Properties**
1. Update DiceBoxAdminConfig model with new properties
2. Update Zod validation schemas for configuration
3. Update backend services to handle new properties
4. Update frontend DiceBox components
5. Update documentation and examples

### **Security Updates**
1. Review password hashing algorithms
2. Update JWT token security settings
3. Review input validation rules
4. Update error handling for security
5. Test authentication flows

## 📝 **Development Guidelines**

### **Authentication Development**
- Always use Zod validation for user inputs
- Hash passwords using bcrypt with appropriate salt rounds
- Generate secure JWT tokens with proper expiration
- Implement proper error handling without information leakage
- Use middleware for route protection

### **Profile Management Development**
- Validate all profile updates using Zod schemas
- Update JWT tokens when profile data changes
- Handle configuration overrides properly
- Provide clear user feedback for all operations
- Maintain data consistency across related systems

### **Testing Requirements**
- Test user registration with valid and invalid data
- Test user login with correct and incorrect credentials
- Test profile updates with various data combinations
- Test DiceBox configuration inheritance and overrides
- Test admin privilege access controls
- Test error handling and edge cases

## Summary

The User Management System provides a comprehensive foundation for user authentication, profile management, and user-specific configurations. The system follows security best practices, integrates with multiple subsystems, and provides a solid foundation for user-specific data isolation and personalization.

Key strengths include:
- **Secure Authentication**: JWT-based authentication with proper password hashing
- **Flexible Configuration**: User-specific overrides for system-wide settings
- **Role-Based Access**: Admin privileges and proper authorization controls
- **Integration Ready**: Seamless integration with character and DiceBox systems
- **Maintainable**: Clear separation of concerns and comprehensive documentation

The system is designed to scale with the application and provides the necessary foundation for user-specific features and data management.
