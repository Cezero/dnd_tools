# User Management System

*Complete documentation for user accounts, authentication, preferences, and dice configuration in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[user-accounts.md](user-accounts.md)** — User account creation and management
- **[authentication.md](authentication.md)** — Authentication and security
- **[user-preferences.md](user-preferences.md)** — User preferences and settings
- **[dice-configuration.md](dice-configuration.md)** — Dice box configuration and customization

### **Database Schema**
- **[schema-reference.md](schema-reference.md)** — User-related database models and relationships

## 🎯 **System Overview**

The user management system handles all aspects of user accounts, authentication, preferences, and dice configuration in D&D Tools. This includes user registration, authentication, profile management, and the sophisticated dice box configuration system.

> **💡 See [System Overview](../system-overview.md) for how the User Management System provides the foundation for all user interactions and character ownership.**

### **Core Architecture**
```
User (User Account)
├── UserCharacter (Character Ownership)
├── UserDiceConfigOverride (User Preferences)
└── DiceBoxAdminConfig (Base Configuration)
    └── User (Users Using This Config)
```

### **Key Principles**
- **Account Security**: Secure authentication and password management
- **Character Ownership**: Users own and manage their characters
- **Preference System**: Users can customize their experience
- **Dice Configuration**: Sophisticated dice box customization system
- **Admin Controls**: Administrative configuration management

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[user-accounts.md](user-accounts.md)** for account management
2. Review **[schema-reference.md](schema-reference.md)** for database structure
3. Study **[authentication.md](authentication.md)** for security implementation
4. Use **[dice-configuration.md](dice-configuration.md)** for dice system

### **For User System Implementation**
1. **Create user accounts** following **[user-accounts.md](user-accounts.md)**
2. **Implement authentication** using **[authentication.md](authentication.md)**
3. **Set up preferences** as shown in **[user-preferences.md](user-preferences.md)**
4. **Configure dice system** using **[dice-configuration.md](dice-configuration.md)**

## 📚 **Documentation Structure**

### **Functional Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[user-accounts.md](user-accounts.md)** | User account creation and management | ~250 |
| **[authentication.md](authentication.md)** | Authentication and security | ~300 |
| **[user-preferences.md](user-preferences.md)** | User preferences and settings | ~200 |
| **[dice-configuration.md](dice-configuration.md)** | Dice box configuration system | ~300 |

### **Schema Reference** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[schema-reference.md](schema-reference.md)** | User-related database models and relationships | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Complete user account management** with registration and profiles
- ✅ **Secure authentication system** with password hashing
- ✅ **User preference system** with customizable settings
- ✅ **Advanced dice configuration** with physics and visual properties
- ✅ **Admin configuration management** for system-wide settings
- ✅ **Character ownership tracking** and permissions

## 📈 **System Status**

- **Current Coverage**: 90% of user management features
- **Target Coverage**: 95%+ with planned enhancements
- **Schema Status**: Complete and optimized
- **API Status**: Full CRUD operations implemented
- **Documentation Status**: Comprehensive and AI-friendly

## 🔧 **Quick Examples**

### **User Account**
```typescript
const userAccount = {
    username: "dungeonmaster",
    email: "dm@example.com",
    password: "hashedPassword123",
    isAdmin: false,
    preferredEditionId: 1,
    diceConfigBase: 1 // References DiceBoxAdminConfig
};
```

### **Dice Configuration**
```typescript
const diceConfig = {
    name: "Default Configuration",
    isDefault: true,
    gravity: 1.0,
    mass: 1.0,
    friction: 0.8,
    restitution: 0,
    theme: 1,
    themeColor: "#2e8555",
    scale: 6.0
};
```

### **User Preference Override**
```typescript
const userOverride = {
    userId: 1,
    propertyName: "themeColor",
    propertyValue: "#ff0000" // Red theme
};
```

For complete examples, see **[user-accounts.md](user-accounts.md)** and **[dice-configuration.md](dice-configuration.md)**.
