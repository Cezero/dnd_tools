# Equipment System

*Complete documentation for the equipment system, including items, weapons, armor, properties, and character equipment management.*

## 📋 **Overview**

The equipment system provides comprehensive support for D&D 3.5 equipment management, including base items, weapons, armor, item properties, and character equipment. This system enables the creation, management, and customization of equipment with complex property systems and character integration.

**Source Files**:
- **Database Schema**: `prisma/schema.prisma` (Item-related models)
- **Validation Schemas**: `shared/schema/src/item.ts`
- **Static Data**: `shared/static-data/src/ItemData.ts`
- **Backend Implementation**: `backend/src/features/item/`
- **Frontend Components**: `frontend/src/features/item/`

## 🏗️ **System Architecture**

### **Core Components**

The equipment system consists of several interconnected components:

- **Base Items**: Foundation items with basic properties (name, description, cost, weight)
- **Weapons**: Specialized items with combat properties (damage, critical, range, type)
- **Armor**: Protective items with defense properties (bonus, penalties, spell failure)
- **Item Properties**: Modular properties that can be applied to items (materials, enhancements, special abilities)
- **Character Equipment**: Character-specific instances of items with applied properties
- **Item Templates**: Pre-configured item-property combinations

### **Key Principles**

- **Modular Design**: Items are composed of base properties plus optional weapon/armor details
- **Property System**: Flexible property system allows for complex item customization
- **Character Integration**: Character equipment links to base items with applied properties
- **D&D 3.5 Compliance**: Complete adherence to D&D 3.5 equipment rules and mechanics
- **Type Safety**: Full TypeScript and Zod validation throughout the system

## 📚 **Documentation Structure**

### **Core Documentation**
- **[Database Schema](database-schema.md)**: Complete Prisma model documentation
- **[Validation Schemas](validation-schemas.md)**: Zod validation rules and type safety
- **[Static Data](static-data.md)**: Enums, reference tables, and utility functions
- **[Backend Implementation](backend-implementation.md)**: Services, controllers, and API
- **[Frontend Components](frontend-components.md)**: React components and UI patterns

### **Specialized Documentation**
- **[Item Properties](item-properties.md)**: Property system mechanics and rules
- **[Weapon System](weapon-system.md)**: Weapon categories, types, and combat mechanics
- **[Armor System](armor-system.md)**: Armor categories, bonuses, and penalties
- **[Character Equipment](character-equipment.md)**: Character equipment management
- **[Item Templates](item-templates.md)**: Template system for pre-configured items

## 🎯 **Getting Started**

### **For New Team Members**
1. **Start with [Database Schema](database-schema.md)** to understand the data structure
2. **Review [Static Data](static-data.md)** to understand equipment categories and types
3. **Examine [Backend Implementation](backend-implementation.md)** for API patterns
4. **Study [Frontend Components](frontend-components.md)** for UI patterns

### **For Developers**
- **Item Creation**: Use the property system to create complex items
- **Character Equipment**: Link items to characters with applied properties
- **API Integration**: Use the RESTful API for equipment management
- **Validation**: Leverage Zod schemas for type safety

### **For System Integration**
- **Character System**: Equipment integrates with character inventory and stats
- **Feature System**: Equipment properties can be granted by features
- **Spell System**: Equipment can have spell-related properties
- **Reference System**: Equipment can reference source books and tables

## 🔗 **Cross-System Integration**

### **Character System Integration**
- **Character Equipment**: Characters own instances of items with properties
- **Equipment Effects**: Equipment properties affect character statistics
- **Inventory Management**: Character inventory and equipment slots
- **Equipment Choices**: Character feature choices can grant equipment

**Related Documentation**: [Character System](../character-system/README.md)

### **Feature System Integration**
- **Equipment Features**: Features can grant equipment or equipment properties
- **Property Modifiers**: Features can modify equipment properties
- **Equipment Choices**: Feature choices can include equipment selection

**Related Documentation**: [Feature System](../feature-system/README.md)

### **Reference System Integration**
- **Source Attribution**: Equipment references source books and page numbers
- **Reference Tables**: Equipment can use reference table data
- **Edition Support**: Equipment supports multiple D&D editions

**Related Documentation**: [Reference Data System](../reference-data-system/README.md)

## 📊 **Implementation Status**

### **Complete Infrastructure**
- ✅ **Database Schema**: All equipment models implemented
- ✅ **Validation Schemas**: Complete Zod validation rules
- ✅ **Static Data**: All equipment categories and types
- ✅ **Backend API**: Full CRUD operations for equipment
- ✅ **Frontend Components**: Complete equipment management UI

### **Implementation Gaps**
- 🔄 **Property System**: Advanced property interactions and incompatibilities
- 🔄 **Character Equipment**: Character equipment management interface
- 🔄 **Item Templates**: Template system for pre-configured items
- 🔄 **Equipment Effects**: Real-time equipment effect calculations

## 🎮 **Quick Reference**

### **Equipment Categories**
- **Weapons**: Simple, Martial, Exotic weapons with combat properties
- **Armor**: Light, Medium, Heavy armor with defense properties
- **Shields**: Defensive equipment with special properties
- **General Items**: Miscellaneous equipment and tools

### **Property Types**
- **Materials**: Base materials (steel, mithral, adamantine)
- **Enhancements**: Magical enhancements (+1, +2, etc.)
- **Special Abilities**: Unique abilities (vorpal, flaming, etc.)
- **Structural**: Physical modifications (masterwork, etc.)

### **Common Operations**
- **Create Item**: Create base items with optional weapon/armor details
- **Apply Properties**: Add properties to items with cost calculations
- **Character Equipment**: Assign items to characters with properties
- **Equipment Queries**: Search and filter equipment by various criteria

## 📋 **Development Guidelines**

### **Adding New Equipment**
1. **Create Base Item**: Add item with basic properties
2. **Add Specialization**: Add weapon or armor details if needed
3. **Apply Properties**: Add relevant properties with cost calculations
4. **Update Static Data**: Add new categories or types if needed
5. **Test Integration**: Verify character system integration

### **Property System Extensions**
1. **Define Property**: Create new property with type and effects
2. **Set Applicability**: Define which item types can use the property
3. **Configure Costs**: Set cost modifiers and multipliers
4. **Handle Incompatibilities**: Define property incompatibilities
5. **Update Validation**: Add validation rules for new properties

### **Character Equipment Management**
1. **Equipment Assignment**: Assign items to character equipment slots
2. **Property Application**: Apply properties to character equipment
3. **Effect Calculation**: Calculate equipment effects on character stats
4. **Inventory Management**: Manage character inventory and encumbrance
5. **Equipment Choices**: Handle equipment choices from features

## 📖 **Related Documentation**

### **System Documentation**
- **[Class System](../class-system/README.md)**: Character classes and equipment proficiency
- **[Feature System](../feature-system/README.md)**: Equipment-related features
- **[Character System](../character-system/README.md)**: Character equipment management
- **[Reference Data System](../reference-data-system/README.md)**: Equipment source attribution

### **Application Overview**
- **[Database Schema Patterns](../application-overview/database-schema.md)**: Shared database patterns
- **[Validation Patterns](../application-overview/validation-schemas.md)**: Shared validation patterns
- **[Backend Implementation](../application-overview/backend-implementation.md)**: Shared backend patterns
- **[Frontend Components](../application-overview/frontend-components.md)**: Shared frontend patterns

## Summary

The equipment system provides a comprehensive foundation for D&D 3.5 equipment management, with a flexible property system that enables complex item customization. The system integrates with character management, feature systems, and reference data to provide a complete equipment experience.

For detailed implementation information, refer to the individual documentation files and always consult the source files for the most current implementation details.
