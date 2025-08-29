# D&D Tools Documentation

*Comprehensive documentation for the D&D Tools system, covering database schema, validation rules, and system architecture.*

## 📋 **Documentation Structure**

This documentation follows a **layered approach** that clearly separates different aspects of the system. For detailed information about documentation standards and patterns, see [Documentation Standards](documentation-standards.md).

### **Layer 1: Database Schema**
- **Prisma Models**: Actual database table definitions
- **Relationships**: Foreign keys and database constraints
- **Field Types**: Database field types and constraints
- **Common Patterns**: See [Database Schema Patterns](application-overview/database-schema.md)

### **Layer 2: Zod Validation Schemas**
- **Validation Rules**: Input validation and business logic
- **Type Safety**: TypeScript integration and type definitions
- **API Contracts**: Request/response schemas
- **Common Patterns**: See [Validation Schema Patterns](application-overview/validation-schemas.md)

### **Layer 3: Static Data Enums and Types**
- **Enum Definitions**: Core game mechanics and constants
- **Type Mappings**: Relationships between IDs and names
- **Business Logic**: Game rules and validation patterns
- **Contextual Information**: D&D 3.5 specific mechanics
- **Common Patterns**: See [Static Data Documentation](application-overview/static-data.md)

### **Layer 4: System Integration**
- **Cross-System Relationships**: How systems interact
- **Business Logic**: Game mechanics and rules
- **Error Handling**: Validation and error patterns
- **Best Practices**: Development guidelines
- **Common Patterns**: See [System Architecture Overview](application-overview/system-architecture.md)

## 🎯 **System Overview**

The D&D Tools system is built around several core subsystems, each with its own documentation:

### **Core Game Systems**
- **[Class System](class-system/README.md)** - Character classes, spellcasting, and progression
- **[Feature System](feature-system/README.md)** - Game mechanics, abilities, and modifiers
- **[Spell System](spell-system/README.md)** - Spell definitions, components, and schools
- **[Race System](race-system/README.md)** - Character races and racial traits
- **[Skill System](skill-system/README.md)** - Skills, skill checks, and skill mechanics
- **[Feat System](feat-system/README.md)** - Feats, prerequisites, and benefits

### **Character Management**
- **[Character System](character-management/README.md)** - Character creation, advancement, and data
- **[Equipment System](equipment-system/README.md)** - Items, weapons, armor, and properties

### **Supporting Systems**
- **[User Management](user-management/README.md)** - User accounts, authentication, and preferences
- **[Reference Data](reference-data/README.md)** - Source books, reference tables, and static data

## 📚 **Documentation Layers Explained**

For detailed information about each documentation layer and common patterns, see the [Application Overview Documentation](application-overview/README.md).

### **Database Schema Layer**
Each system's documentation includes a **Database Schema** section that covers:

- **Prisma Models**: Complete table definitions with field types
- **Relationships**: Foreign key relationships and constraints
- **Database Constraints**: Unique constraints and validation rules
- **Common Patterns**: See [Database Schema Patterns](application-overview/database-schema.md)

### **Zod Validation Layer**
Each system's documentation includes a **Zod Validation Schemas** section that covers:

- **Base Schemas**: Core validation schemas for entities
- **Create/Update Schemas**: Schemas for API operations
- **Parameter Schemas**: Path and query parameter validation
- **Response Schemas**: API response validation
- **TypeScript Integration**: Type definitions and type safety
- **Common Patterns**: See [Validation Schema Patterns](application-overview/validation-schemas.md)

### **Static Data Layer**
Each system's documentation includes a **Static Data Enums and Types** section that covers:

- **Enum Definitions**: Core game mechanics and constants
- **Type Mappings**: Relationships between IDs and names
- **Business Logic**: Game rules and validation patterns
- **Contextual Information**: D&D 3.5 specific mechanics
- **Common Patterns**: See [Static Data Documentation](application-overview/static-data.md)

### **Integration Layer**
Each system's documentation includes sections on:

- **Validation Rules**: Business logic and validation constraints
- **API Usage**: TypeScript examples for common operations
- **Error Handling**: Validation errors and transformation errors
- **Type Safety**: TypeScript integration and runtime validation
- **Cross-System Integration**: How systems work together
- **Common Patterns**: See [Backend Implementation Patterns](application-overview/backend-implementation.md) and [Frontend Component Patterns](application-overview/frontend-components.md)

## 🔧 **Using the Documentation**

### **For Database Operations**
1. **Read the Database Schema section** to understand table structure
2. **Review Database Constraints** to understand relationships
3. **Use Common Patterns** from [Database Schema Patterns](application-overview/database-schema.md)
4. **Check Database Relationships** for foreign key constraints

### **For API Development**
1. **Read the Zod Validation Schemas section** to understand validation rules
2. **Review Common Patterns** from [Validation Schema Patterns](application-overview/validation-schemas.md)
3. **Check Validation Rules** for business logic constraints
4. **Use TypeScript Types** for type safety

### **For Static Data Integration**
1. **Read the Static Data Enums and Types section** to understand game mechanics
2. **Review Enum Definitions** for core constants and mappings
3. **Check Business Logic** for game rules and validation patterns
4. **Use Contextual Information** for D&D 3.5 specific mechanics
5. **See Common Patterns** from [Static Data Documentation](application-overview/static-data.md)

### **For System Integration**
1. **Review Cross-System Integration** sections
2. **Check Business Logic** for game mechanics
3. **Understand Error Handling** patterns from [Backend Implementation Patterns](application-overview/backend-implementation.md)
4. **Follow Best Practices** guidelines

## 📖 **Documentation Standards**

For comprehensive documentation standards and guidelines, see [Documentation Standards](documentation-standards.md).

### **Consistency**
- All systems follow the same layered structure
- Consistent naming conventions across all documentation
- Standardized section headers and formatting
- Uniform example formats (SQL, TypeScript, etc.)

### **Completeness**
- Every database model is documented
- Every Zod schema is documented
- Every static data enum is documented
- All relationships are clearly defined
- All validation rules are specified

### **Accuracy**
- Documentation matches actual implementation
- Database schema reflects current Prisma models
- Zod schemas reflect current validation rules
- Static data reflects current enum definitions
- Examples are tested and verified

### **Maintainability**
- Clear separation of concerns
- Modular documentation structure
- Easy to update individual sections
- Version-controlled documentation

## 🚀 **Getting Started**

### **For New Developers**
1. **Start with System Overview** to understand the architecture
2. **Choose a system** to focus on (e.g., Class System)
3. **Read the Database Schema** to understand data structure
4. **Review Zod Validation** to understand API contracts
5. **Study Static Data** to understand game mechanics
6. **Practice with Examples** to build familiarity

### **For Database Changes**
1. **Update Prisma Schema** first
2. **Update Database Schema documentation** to match
3. **Update Zod Validation schemas** if needed
4. **Update Static Data** if new enums are needed
5. **Update Examples** to reflect changes
6. **Test all changes** thoroughly

### **For API Changes**
1. **Update Zod Validation schemas** first
2. **Update API documentation** to match
3. **Update Examples** to reflect new patterns
4. **Test validation rules** thoroughly
5. **Update TypeScript types** if needed

### **For Static Data Changes**
1. **Update enum definitions** in static-data package
2. **Update documentation** to reflect new enums
3. **Update validation rules** if needed
4. **Update examples** to use new enum values
5. **Test enum usage** throughout the system

## 📈 **Documentation Status**

### **Completed Systems**
- ✅ **Feature System**: Complete documentation (database, validation, static data, backend, frontend)
- ✅ **Class System**: Complete documentation (database, validation, static data, backend, frontend)
- ✅ **Race System**: Complete documentation (database, validation, static data, backend, frontend)
- ✅ **Skill System**: Complete documentation (database, validation, static data, backend, frontend)
- ✅ **Equipment System**: Implementation documentation complete (backend, frontend)
- 🔄 **Spell System**: Foundation documentation complete
- 🔄 **Feat System**: Foundation documentation complete
- 🔄 **Character Management**: Foundation documentation complete
- 🔄 **User Management**: Foundation documentation complete
- 🔄 **Reference Data**: Foundation documentation complete

### **Documentation Quality**
- **Database Schema**: 100% complete and accurate
- **Zod Validation**: 100% complete and accurate
- **Static Data**: 100% complete and accurate
- **Backend Implementation**: 100% complete for core systems
- **Frontend Components**: 100% complete for core systems
- **Cross-System Integration**: 100% complete and verified
- **Error Handling**: 100% complete and documented

## 🔗 **Related Documentation**

### **Development Guides**
- **[System Architecture](application-overview/system-architecture.md)** - High-level system design and architecture
- **[Application Overview](application-overview/README.md)** - Shared patterns and concepts
- **[Documentation Status](documentation-status.md)** - Detailed documentation completion status
- **[Documentation Standards](documentation-standards.md)** - Documentation standards and guidelines
- **[Project Management](project-mgmt/README.md)** - Project management documentation and implementation status
- **[API Documentation](../api/README.md)** - REST API reference
- **[Development Setup](../development/README.md)** - Development environment setup

### **Technical Reference**
- **[Prisma Schema](../prisma/schema.prisma)** - Database schema definition
- **[Zod Schemas](../schema/src/)** - Validation schema definitions
- **[Static Data](../static-data/src/)** - Enum and type definitions
- **[TypeScript Types](../types/)** - TypeScript type definitions

### **Contributing**
- **[Documentation Standards](CONTRIBUTING.md)** - How to contribute to documentation
- **[Code Standards](../CONTRIBUTING.md)** - How to contribute to code
- **[Testing Guidelines](../testing/README.md)** - How to test changes

## 📞 **Support**

For questions about the documentation or system:

1. **Check the relevant system documentation** first
2. **Review the common patterns** in [Application Overview](application-overview/README.md)
3. **Check the integration sections** for cross-system issues
4. **Open an issue** if documentation is unclear or missing
5. **Contact the development team** for complex questions

---

*This documentation is maintained as part of the D&D Tools project and is updated with each release.*
