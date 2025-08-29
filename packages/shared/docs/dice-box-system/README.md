# Dice Box System

*Comprehensive documentation for the Dice Box system, a full-stack 3D dice rolling interface with physics simulation, theme management, and user personalization capabilities.*

## 📋 **Overview**

The Dice Box system provides a sophisticated 3D dice rolling interface that enhances the user experience across the D&D Tools application. It combines advanced physics simulation, customizable themes, and user personalization to deliver an immersive dice rolling experience that integrates seamlessly with character sheets, combat systems, and other game mechanics.

The system spans the complete application stack, from database models for configuration storage to frontend components for user interaction, with comprehensive admin tools for system management.

**Source Files**:
- **Frontend Components**: `frontend/src/components/dice-box/` (DiceBoxProvider.tsx, DiceBoxManager.ts, DiceButton.tsx, DiceResultRenderer.tsx)
- **Backend Implementation**: `backend/src/features/diceBox/` (diceBoxController.ts, diceBoxService.ts, diceBoxRoutes.ts)
- **Database Models**: `backend/prisma/schema.prisma` (DiceBoxAdminConfig, UserDiceConfigOverride)
- **Validation Schemas**: `shared/schema/src/diceBox.ts`
- **Static Data**: `shared/static-data/src/DiceData.ts` (3D dice themes)
- **Admin Interface**: `frontend/src/features/admin/features/dice-configuration/`

## 🏗️ **System Architecture**

The Dice Box system follows the shared [System Architecture](../application-overview/system-architecture.md) patterns with dice-specific implementations:

**Component Structure**: Hierarchical component organization with clear responsibilities
**State Management**: Global singleton pattern with React context for application-wide access
**Configuration Management**: Admin-defined base configurations with user-specific overrides
**Physics Integration**: Real-time physics simulation with configurable properties
**Theme System**: Multiple 3D dice themes with visual customization options

### **Dice-Specific Component Structure**

**Core Components**: DiceBoxProvider, DiceBoxManager, DiceButton, DiceResultRenderer
**Configuration Components**: Admin configuration interface, user preference management
**Integration Components**: Toast notifications, [Log Panel Component](../application-overview/log-panel.md) integration, React context
**Utility Components**: Color scheme generation, theme management, physics configuration

## 🔧 **Core Features**

### **3D Physics Simulation**
- **Real-time Physics**: Advanced physics engine with configurable properties
- **Physics Properties**: Gravity, mass, friction, restitution, damping, forces
- **Visual Effects**: Shadows, lighting, transparency, scale, and positioning
- **Performance Optimization**: Efficient rendering and memory management

### **Theme Management System**
- **Multiple Themes**: Rock, gemstone, wooden, metallic, and custom themes
- **Theme Customization**: Color schemes, visual properties, and appearance options
- **Dynamic Loading**: On-demand theme loading and switching
- **Icon Integration**: Synchronized dice button icons with 3D dice appearance

### **User Personalization**
- **Base Configurations**: Admin-defined configuration templates
- **User Overrides**: Individual user customization of specific properties
- **Configuration Inheritance**: User configurations inherit from admin base configurations
- **Real-time Updates**: Immediate application of configuration changes

### **Admin Management**
- **Configuration CRUD**: Create, read, update, and delete dice configurations
- **Default Management**: Set and manage default configurations for new users
- **Theme Administration**: Manage available 3D dice themes and properties
- **User Configuration**: View and manage user-specific configuration overrides

## 🔗 **Integration Patterns**

### **User Management Integration**
The Dice Box system integrates with the user management system through configuration relationships:

**User Configuration**: Users can customize their dice experience through personal configuration overrides
**Configuration Inheritance**: User configurations inherit from admin-defined base configurations
**User Preferences**: Dice preferences are stored as part of user profile data
**Admin Controls**: Administrators can manage user configurations and set system defaults

**Related Documentation**: [User Management System](../user-management/README.md)

### **Application-Wide Integration**
The Dice Box system provides dice rolling capabilities across all systems:

**Character Management**: Dice rolling for ability checks, saving throws, and skill checks
**Combat System**: Dice rolling for attack rolls, damage calculations, and initiative
**Spell System**: Dice rolling for spell effects, damage, and healing
**General Gameplay**: Universal dice rolling for any game mechanic requiring randomization

### **Frontend Component Integration**
The system integrates with shared frontend components and patterns:

**Toast Notifications**: Dice roll results displayed through the toast notification system
**Log Panel**: Dice roll history and results logged through the [Log Panel Component](../application-overview/log-panel.md)
**Generic List**: Admin configuration management uses the GenericList component
**Form Components**: Configuration editing uses shared form validation and components

**Related Documentation**: [Frontend Components](../application-overview/frontend-components.md)

## 📊 **Performance Considerations**

### **Physics Simulation Optimization**
- **Efficient Rendering**: Optimized 3D rendering with configurable quality settings
- **Memory Management**: Proper cleanup and resource management for 3D assets
- **Batch Processing**: Efficient handling of multiple dice rolls and results
- **Caching Strategies**: Theme and configuration caching for improved performance

### **User Experience Optimization**
- **Responsive Design**: Dice interface adapts to different screen sizes and devices
- **Loading States**: Proper loading indicators and state management
- **Error Handling**: Graceful error handling for physics simulation and configuration issues
- **Accessibility**: Keyboard navigation and screen reader support for dice interface

## 🔧 **Development Guidelines**

### **Configuration Management**
- **Type Safety**: All configuration properties use TypeScript types and Zod validation
- **Default Values**: Comprehensive default values for all configuration properties
- **Validation Rules**: Strict validation rules for physics and visual properties
- **Migration Support**: Backward compatibility for configuration changes

### **Theme Development**
- **Theme Standards**: Consistent theme structure and property definitions
- **Color Schemes**: Formulaic color scheme generation from base colors
- **Asset Management**: Proper 3D asset loading and caching strategies
- **Customization Options**: Extensible theme customization system

### **Integration Development**
- **Context Usage**: Proper React context usage for global dice state management
- **Event Handling**: Consistent event handling for dice roll completion and errors
- **State Synchronization**: Proper synchronization between 3D dice and UI components
- **Error Boundaries**: Error boundaries for physics simulation and rendering issues

## 🔗 **Related Documentation**

- **[Database Schema](database-schema.md)** - Dice Box system database models and relationships
- **[Validation Schemas](validation-schemas.md)** - Dice Box system validation rules and schemas
- **[Static Data](static-data.md)** - 3D dice themes and RPG dice types
- **[Backend Implementation](backend-implementation.md)** - Dice Box system backend implementation
- **[Frontend Components](frontend-components.md)** - Dice Box system frontend components
- **[Admin Interface](admin-interface.md)** - Admin configuration management interface
- **[User Management System](../user-management/README.md)** - User configuration integration
- **[Frontend Component Patterns](../application-overview/frontend-components.md)** - Shared frontend patterns
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Shared database patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Shared validation patterns

## Summary

The Dice Box system provides a comprehensive, full-stack solution for 3D dice rolling in the D&D Tools application. It combines advanced physics simulation, customizable themes, and user personalization to deliver an immersive and flexible dice rolling experience.

Key features include:
- **Advanced Physics**: Real-time 3D physics simulation with configurable properties
- **Theme Management**: Multiple 3D dice themes with extensive customization options
- **User Personalization**: Individual user configuration with admin-defined base templates
- **Admin Management**: Comprehensive admin interface for system configuration
- **Application Integration**: Seamless integration with all game systems and user interfaces
- **Performance Optimization**: Efficient rendering and resource management
- **Type Safety**: Complete TypeScript integration with Zod validation

The system follows established architectural patterns while providing dice-specific functionality that enhances the overall user experience across the application.
