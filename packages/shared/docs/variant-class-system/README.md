# Variant Class System

*Comprehensive documentation for the variant class system that enables Unearthed Arcana variant classes like Cloistered Cleric.*

## 📋 **Overview**

The Variant Class System allows the creation of modified versions of existing base classes, enabling Unearthed Arcana variant classes while minimizing data duplication. The system uses an **override-based architecture** where variants store only the differences from their base class, with the backend resolving complete class data on demand.

**Target Use Cases:**
- Unearthed Arcana variant classes (Cloistered Cleric, Urban Ranger, etc.)
- Custom variant classes for homebrew campaigns
- Class modifications that maintain the core identity of the base class

## 🏗️ **Architecture Principles**

### **Core Architecture: Override System + Feature System Integration**

The variant class system follows a **container-coordinator pattern** where:

- **Variant System**: Stores overrides (deltas/changes) that define how to transform a base class
- **Feature System**: Handles actual FeatureProgression and FeatureEntity creation/modification
- **Backend Resolution**: Combines base class data with variant overrides to return complete DnDClass objects
- **Frontend Workflow**: Uses existing ClassEdit patterns with variant-specific override tracking

### **Override System Design**

The system stores complete FeatureProgression objects with their nested FeatureEntity objects in override records. This approach eliminates the need for separate entity override tables and complex override type enums, providing a clean and maintainable solution for class modifications.

The override system supports three primary operations:
- **Add New Features**: Create entirely new feature progressions for the variant
- **Remove Features**: Remove existing features from the base class
- **Modify Features**: Replace existing features with modified versions, including selective entity removal

### **Integration with Feature System**

The variant system leverages the existing feature system for all feature-related operations. This integration ensures consistency with the broader feature system while providing variant-specific functionality. The system uses context objects to properly link variant features to their override records, maintaining referential integrity throughout the system.

## 🗄️ **Database Schema**

The variant class system uses a custom ID generation strategy and override-based storage to minimize data duplication. The schema integrates with existing class, feature, and spell systems through foreign key relationships.

### **Core Models**

The system centers around the `ClassVariant` model, which stores variant-specific information and references to override data. The model uses custom ID generation to ensure unique identification while maintaining relationships to base classes.

**Key Design Decisions:**
- **Custom ID Generation**: Uses `baseClassId * 100000 + variantId` for unique identification
- **Override Fields**: Nullable fields for class properties that can be overridden
- **Base Class Relationship**: Direct reference to the base class being modified
- **Unique Constraints**: Ensures variant names are unique within each base class

### **Override Storage**

The system stores complete override objects rather than incremental changes. This approach provides clear intent and eliminates the need for complex merge logic. The override system supports three primary operations: adding new features, removing existing features, and modifying features with selective entity removal.

### **Spell Override Management**

Spell overrides use a simple addition/removal model with level-based organization. The system supports both spell additions (level > 0) and removals (level = -1), with unique constraints preventing duplicate overrides per variant.

## 🔧 **Backend Implementation**

The variant class backend provides comprehensive services for managing variant classes, including CRUD operations, variant resolution, and integration with the feature and spell systems.

### **Variant Resolution Process**

The backend resolution process follows a clear sequence: fetch the variant with related data, retrieve the base class, apply feature overrides using shared utilities, integrate with the spell system for spell resolution, and construct the final DnDClass object.

### **Service Integration**

The variant system integrates with existing services through established patterns. The class service provides base class data, the feature system service handles feature creation and management, and the spell service manages spell list resolution and modifications.

### **Transaction Management**

The variant system uses database transactions for data consistency, ensuring all operations succeed or fail together. This approach maintains database integrity and provides automatic rollback on errors.

## 🎨 **Frontend Implementation**

The variant class frontend provides seamless integration with the existing ClassEdit component, enabling variant class creation and management through a unified interface.

### **Component Integration**

The variant system integrates with existing components through mode detection and tab configuration. The system automatically detects variant mode and provides specialized components for variant-specific functionality.

### **User Experience Design**

The variant system provides an intuitive user experience with a clear workflow: base class selection, variant configuration, feature modifications, spell modifications, and save/review. The system uses visual design patterns to indicate overridden fields and provide clear feedback.

### **State Management**

The variant system uses a layered state management approach with base class state, variant override state, and display state. This approach ensures efficient state updates and prevents circular dependencies.

## 🔗 **Integration Points**

### **Class System Integration**

The variant system integrates with the class system through unified resolution and API consistency. Variants resolve to complete DnDClass objects, ensuring frontend components work with variants without special handling.

### **Feature System Integration**

The variant system leverages the feature system for all feature operations, using context objects to properly link variant features to their override records. This integration maintains consistency with the broader feature system.

### **Spell System Integration**

The variant system integrates with the spell system for spell list management, supporting both additions and removals with level-based organization. The system provides intuitive spell list management for variant classes.

## 📊 **Validation and Error Handling**

The variant class system uses comprehensive Zod validation for all operations, ensuring type safety and data integrity. The system provides clear error messages and efficient validation performance.

### **Validation Patterns**

The system follows established validation patterns with Base, Summary, Create, and Update schemas. This approach ensures consistent validation across all API endpoints and frontend components.

### **Error Handling**

The system provides comprehensive error handling with field-specific messages, range validation, and business rule validation. The system uses custom validation for complex business rules and cross-field validation.

## 🚀 **Performance Considerations**

The variant system optimizes performance through lazy loading, selective data fetching, and efficient state management. The system uses caching strategies and query optimization to ensure responsive user experiences.

### **Database Optimization**

The system uses selective includes, batch operations, and index usage for optimal database performance. The system implements caching strategies for frequently accessed data.

### **Frontend Performance**

The system optimizes frontend performance through component memoization, callback optimization, and efficient state management. The system uses API optimization and client-side caching for repeated requests.

## 🔧 **Maintenance and Extension**

The variant system is designed for easy extension and maintenance. The system supports adding new override types, extending the override system, and implementing performance enhancements.

### **Adding New Override Types**

The system supports adding new override types through database schema updates, backend service modifications, and frontend component additions. The system provides clear patterns for extension.

### **Performance Enhancements**

The system supports various performance enhancements including caching strategies, database optimization, and batch operations. The system provides clear patterns for performance improvement.

## 📋 **Testing Strategy**

The variant system uses comprehensive testing strategies including unit testing, integration testing, and user acceptance testing. The system provides clear testing patterns and examples.

### **Unit Testing**

The system provides unit testing for services, components, and validation logic. The system uses clear testing patterns and examples.

### **Integration Testing**

The system provides integration testing for end-to-end workflows and system integration. The system uses clear testing patterns and examples.

### **User Acceptance Testing**

The system provides user acceptance testing for variant creation workflows and real-world testing scenarios. The system uses clear testing patterns and examples.

## 📚 **Related Documentation**

### **Cross-System References**

- **[Class System Architecture](../class-system/architecture-principles.md)**: Core class system principles
- **[Feature System Architecture](../feature-system/architecture-principles.md)**: Feature system integration
- **[Spell System Architecture](../spell-system/architecture-principles.md)**: Spell system integration
- **[Database Schema Patterns](../application-overview/database-schema.md)**: Database design patterns
- **[Validation Patterns](../application-overview/validation-schemas.md)**: Validation schema patterns

### **Implementation References**

- **[Variant Class Implementation Plan](../project-mgmt/variant-class-system-implementation.md)**: Detailed implementation guide
- **[Architecture Principles](./architecture-principles.md)**: Architectural principles and design decisions
- **[Backend Implementation](./backend-implementation.md)**: Backend implementation details
- **[Frontend Implementation](./frontend-implementation.md)**: Frontend implementation details
- **[Database Schema](./database-schema.md)**: Database schema documentation
- **[Validation Schemas](./validation-schemas.md)**: Validation schema documentation
- **[Static Data](./static-data.md)**: Static data and constants
- **[Feature System Integration](../feature-system/integration-patterns.md)**: Feature system integration patterns

## Summary

The Variant Class System provides a comprehensive solution for implementing Unearthed Arcana variant classes while maintaining the integrity of the existing class system. The override-based architecture minimizes data duplication while providing full flexibility for class modifications. The system integrates seamlessly with the existing feature and spell systems, providing a unified experience for variant class management.

The implementation follows established architectural patterns and provides a solid foundation for future enhancements and additional variant types. The comprehensive testing through the Cloistered Cleric implementation demonstrates the system's robustness and readiness for production use.
