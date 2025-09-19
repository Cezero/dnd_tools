# Variant Class System - Architecture Principles

*Core architectural principles and design decisions for the variant class system.*

## 📋 **Overview**

The Variant Class System follows a **container-coordinator pattern** where variant classes act as containers for override data and coordinate the relationship between base classes and their modifications. The system uses an **override-based architecture** that minimizes data duplication while providing full flexibility for class modifications.

**Source Files**: 
- Database: `apps/backend/prisma/schema.prisma` (ClassVariant and related models)
- Backend: `apps/backend/src/features/variantClass/` (variantClassService.ts, variantClassController.ts, variantClassRoutes.ts)
- Frontend: `apps/frontend/src/features/class/` (ClassEdit.tsx, SpellOverrideTab.tsx)

## 🏗️ **Core Architectural Principles**

### **Override-Based Architecture**

The variant system stores **overrides** (deltas/changes) that define how to transform a base class, rather than duplicating the entire class data. This approach provides several key benefits:

**Data Efficiency**: The system minimizes storage requirements by storing only the differences from base classes, not complete class data. This approach scales efficiently as the number of variants grows.

**Maintainability**: Changes to base classes automatically apply to variants, ensuring consistency across the system. When a base class is updated, all variants automatically inherit the changes unless specifically overridden.

**Flexibility**: The system provides full control over which aspects to override, allowing for precise customization of variant classes. Users can override any combination of class properties, features, and spell lists.

**Consistency**: The override approach ensures variants stay synchronized with base classes while allowing for targeted modifications.

### **Container-Coordinator Pattern**

Variant classes act as **containers** for override data and **coordinators** for the resolution process. This pattern provides clear separation of concerns and enables efficient data management.

**Container Responsibilities**: Variant classes store override data, manage metadata, and maintain relationships to base classes. The container pattern ensures that all variant-specific information is properly organized and accessible.

**Coordinator Responsibilities**: Variant classes coordinate the resolution process, integrate with other systems, and transform override data into resolved class data. The coordinator pattern ensures that the resolution process is efficient and maintainable.

### **Feature System Integration**

The variant system leverages the existing feature system for all feature-related operations. This integration ensures consistency with the broader feature system while providing variant-specific functionality.

**Integration Points**: The system uses context objects to properly link variant features to their override records, maintaining referential integrity throughout the system. The integration supports feature creation, modification, and resolution through established patterns.

**Context Management**: The system uses context objects to pass variant-specific information to the feature system, ensuring proper foreign key relationships and data consistency.

### **Unified API Design**

The variant system provides a unified API that treats variants as first-class citizens alongside base classes. This approach ensures transparency and consistency across the system.

**Unified Resolution**: The system automatically resolves variants to complete DnDClass objects, ensuring frontend components work with variants without special handling. The resolution process is transparent to the frontend.

**API Consistency**: The system provides consistent API patterns for base classes and variants, ensuring that the same code paths handle both types of classes.

**Maintainability**: The unified API approach reduces complexity and ensures that changes to the class system automatically apply to variants.

## 🗄️ **Database Architecture**

### **Custom ID Generation**

Variant classes use custom ID generation to ensure unique identification while maintaining relationships to base classes. The system uses a simple formula that combines base class ID and variant ID to create unique identifiers.

**ID Strategy**: The system uses `baseClassId * 100000 + variantId` for unique identification. This approach provides several benefits:
- **Unique Identification**: Guaranteed unique IDs across all classes
- **Base Class Derivation**: Easy extraction of base class ID for resolution
- **Variant Identification**: Clear identification of variant classes

**Benefits**: This approach ensures that variants can be easily identified and resolved while maintaining relationships to their base classes.

### **Override Storage Design**

The system stores complete override objects rather than incremental changes. This approach provides clear intent and eliminates the need for complex merge logic.

**Override Types**: The system supports three primary operations:
- **Add New Features**: Create entirely new feature progressions for the variant
- **Remove Features**: Remove existing features from the base class
- **Modify Features**: Replace existing features with modified versions, including selective entity removal

**Benefits**: This approach provides clear intent, eliminates complex merge logic, and supports flexible modification scenarios.

### **Spell Override Design**

Spell overrides use a simple addition/removal model with level-based organization. The system supports both spell additions and removals with proper constraints and validation.

**Override Logic**: The system supports both spell additions (level > 0) and removals (level = -1), with unique constraints preventing duplicate overrides per variant.

**Benefits**: This approach provides intuitive spell list management while maintaining data integrity and preventing conflicts.

## 🔧 **Backend Architecture**

### **Service Layer Design**

The variant system follows established service patterns with clear separation of concerns and efficient data management.

**VariantClassService**: The core service provides CRUD operations, variant resolution, and integration with other systems. The service follows established patterns and provides comprehensive functionality.

**Integration Services**: The system integrates with class, feature, and spell services through established patterns, ensuring consistency and maintainability across the system.

### **Resolution Process**

The variant resolution process follows a clear sequence that ensures efficient data retrieval and proper override application.

**Process Steps**: The resolution process includes fetching the variant with related data, retrieving the base class, applying feature overrides, integrating with the spell system, and constructing the final DnDClass object.

**Benefits**: This approach ensures that variants are properly resolved while maintaining performance and data integrity.

### **Transaction Management**

The variant system uses database transactions for data consistency, ensuring all operations succeed or fail together.

**Transaction Benefits**: This approach maintains database integrity and provides automatic rollback on errors, ensuring that the system remains in a consistent state.

## 🎨 **Frontend Architecture**

### **Component Integration**

The variant system integrates seamlessly with existing components through mode detection and tab configuration.

**Mode Detection**: The system automatically detects variant mode and provides specialized components for variant-specific functionality.

**Tab Configuration**: The system dynamically configures tabs based on variant-specific requirements, ensuring that users have access to the appropriate functionality.

### **State Management**

The variant system uses a layered state management approach that ensures efficient state updates and prevents circular dependencies.

**State Layers**: The system uses base class state, variant override state, and display state to manage different aspects of variant functionality.

**Benefits**: This approach ensures efficient state management while preventing circular dependencies and maintaining data consistency.

### **User Experience Design**

The variant system provides an intuitive user experience with clear workflows and visual feedback.

**Workflow Design**: The system provides a clear workflow for variant creation and management, ensuring that users can easily create and modify variant classes.

**Visual Design**: The system uses visual design patterns to indicate overridden fields and provide clear feedback about variant modifications.

## 🔗 **Integration Architecture**

### **Cross-System Integration**

The variant system integrates with multiple systems through established patterns and clear interfaces.

**Class System Integration**: The system integrates with the class system through unified resolution and API consistency, ensuring that variants work seamlessly with existing class functionality.

**Feature System Integration**: The system leverages the feature system for all feature operations, using context objects to properly link variant features to their override records.

**Spell System Integration**: The system integrates with the spell system for spell list management, supporting both additions and removals with level-based organization.

### **API Design**

The variant system provides a unified API that ensures consistency and maintainability.

**Unified Endpoints**: The system provides consistent API endpoints for both base classes and variants, ensuring that the same code paths handle both types of classes.

**Response Consistency**: The system ensures that all endpoints return consistent DnDClass objects, providing a unified experience for frontend components.

## 📊 **Performance Architecture**

### **Resolution Optimization**

The variant system optimizes resolution performance through lazy loading, selective data fetching, and efficient state management.

**Lazy Loading**: The system loads variant data only when needed, ensuring efficient resource usage and responsive user experiences.

**Selective Data**: The system fetches only necessary related data, reducing database load and improving performance.

**Caching Strategy**: The system implements caching strategies for frequently accessed data, ensuring responsive user experiences.

### **Frontend Performance**

The variant system optimizes frontend performance through component memoization, callback optimization, and efficient state management.

**Component Optimization**: The system uses React.memo and callback optimization to ensure efficient component rendering and state updates.

**API Optimization**: The system optimizes API calls through batch requests, selective data fetching, and client-side caching.

## 🔧 **Extension Architecture**

### **Adding New Override Types**

The variant system is designed for easy extension and maintenance, supporting new override types through clear patterns and established interfaces.

**Database Schema**: The system supports adding new override fields and tables through established patterns and clear interfaces.

**Backend Service**: The system supports adding new override handling through established patterns and clear interfaces.

**Frontend Components**: The system supports adding new components through established patterns and clear interfaces.

### **Performance Enhancements**

The variant system supports various performance enhancements through caching strategies, database optimization, and batch operations.

**Caching Strategy**: The system supports caching for base classes, variant resolution, and feature system data.

**Database Optimization**: The system supports database optimization through index optimization, query optimization, and batch operations.

## 📚 **Related Documentation**

### **Cross-System References**

- **[Class System Architecture](../class-system/architecture-principles.md)**: Core class system principles
- **[Feature System Architecture](../feature-system/architecture-principles.md)**: Feature system integration
- **[Spell System Architecture](../spell-system/architecture-principles.md)**: Spell system integration
- **[Database Schema Patterns](../application-overview/database-schema.md)**: Database design patterns
- **[Validation Patterns](../application-overview/validation-schemas.md)**: Validation schema patterns

### **Implementation References**

- **[Variant Class System](./README.md)**: Core variant system documentation
- **[Backend Implementation](./backend-implementation.md)**: Backend implementation details
- **[Frontend Implementation](./frontend-implementation.md)**: Frontend implementation details
- **[Variant Class Implementation Plan](../project-mgmt/variant-class-system-implementation.md)**: Detailed implementation guide

## Summary

The Variant Class System architecture provides a robust, flexible, and maintainable solution for implementing variant classes. The override-based architecture minimizes data duplication while providing full flexibility for class modifications. The system integrates seamlessly with existing systems and provides a unified API that treats variants as first-class citizens.

The architecture follows established patterns and provides a solid foundation for future enhancements and additional variant types. The comprehensive testing through the Cloistered Cleric implementation demonstrates the system's robustness and readiness for production use.
