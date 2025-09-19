# Variant Class System - Database Schema

*Complete database schema documentation for the variant class system.*

## 📋 **Overview**

The variant class system uses a custom ID generation strategy and override-based storage to minimize data duplication while providing full flexibility for class modifications. The schema integrates with existing class, feature, and spell systems through foreign key relationships.

## 🗄️ **Core Models**

### **ClassVariant Model**

The main variant class model serves as the central container for variant-specific information. The model uses custom ID generation to ensure unique identification while maintaining relationships to base classes.

**Key Design Decisions:**
- **Custom ID Generation**: Uses `baseClassId * 100000 + variantId` for unique identification
- **Override Fields**: Nullable fields for class properties that can be overridden
- **Base Class Relationship**: Direct reference to the base class being modified
- **Unique Constraints**: Ensures variant names are unique within each base class

**Field Descriptions:**
- `id`: Custom generated ID using base class ID and variant ID
- `name`: Display name for the variant class
- `abbreviation`: Short abbreviation for the variant
- `baseClassId`: Foreign key to the base class being modified
- `description`: Optional description of the variant
- Override fields for class properties (hit die, skill points, progressions)

### **ClassVariantFeatureProgressionOverride Model**

This model stores complete feature progression overrides with support for adding, removing, and modifying features. The model uses a flexible design that supports three primary override types.

**Override Types:**
- **Add New Feature**: Creates entirely new feature progressions for the variant
- **Remove Feature**: Removes existing features from the base class
- **Modify Feature**: Replaces existing features with modified versions, including selective entity removal

**Field Descriptions:**
- `id`: Primary key for the override record
- `variantId`: Foreign key to the variant class
- `originalFeatureProgressionId`: ID of the original feature progression being modified
- `replacementFeatureProgression`: Array of replacement feature progressions
- `removeEntities`: Array of entities to remove from the original progression

### **ClassVariantFeatureProgressionRemoveEntityMap Model**

This model maps entities to remove from original feature progressions. The model provides fine-grained control over feature modifications by allowing selective entity removal.

**Purpose**: Tracks which specific entities should be removed from original feature progressions when applying overrides.

**Field Descriptions:**
- `classVariantFeatureProgressionOverrideId`: Foreign key to the override record
- `featureEntityId`: ID of the feature entity to remove

### **ClassVariantSpellOverride Model**

This model manages spell list modifications for variant classes. The model uses a simple addition/removal model with level-based organization.

**Spell Override Logic:**
- **Additions**: `level > 0` adds spell to the specified level
- **Removals**: `level = -1` removes spell from all levels
- **Unique Constraint**: Prevents duplicate spell overrides per variant

**Field Descriptions:**
- `id`: Primary key for the spell override record
- `variantId`: Foreign key to the variant class
- `spellId`: Foreign key to the spell being overridden
- `level`: Spell level for additions (> 0) or removal indicator (-1)

### **ClassVariantSourceMap Model**

This model stores source book information for variant classes. The model allows variant classes to have their own source book information, distinct from their base class.

**Purpose**: Allows variant classes to have their own source book information, distinct from their base class.

**Field Descriptions:**
- `variantId`: Foreign key to the variant class
- `pageNumber`: Optional page number in the source book
- `sourceBookId`: Foreign key to the source book

## 🔗 **Cross-System Integration**

### **Feature System Integration**

The variant system integrates with the feature system through the `FeatureProgression` model. The integration uses `variantOverrideId` to link feature progressions to variant overrides and `FeatureSourceType.ClassVariant` for variant features.

**Integration Points:**
- **Variant Override ID**: Links feature progressions to variant overrides
- **Source Type**: Uses `FeatureSourceType.ClassVariant` for variant features
- **Context Management**: Proper foreign key relationships for variant features

### **Class System Integration**

The variant system integrates with the class system through custom ID generation. The integration ensures unique identification while maintaining relationships to base classes.

**Custom ID Strategy:**
The system uses `baseClassId * 100000 + variantId` for unique identification. This approach provides several benefits:
- **Unique Identification**: Guaranteed unique IDs across all classes
- **Base Class Derivation**: Easy extraction of base class ID
- **Variant Identification**: Clear identification of variant classes

### **Spell System Integration**

The variant system integrates with the spell system through the `ClassVariantSpellOverride` model. The integration supports both spell additions and removals with proper foreign key relationships.

**Spell Override Integration:**
- **Spell References**: Direct foreign key to `Spell` model
- **Level Management**: Supports both additions and removals
- **Unique Constraints**: Prevents duplicate overrides

## 📊 **Database Constraints**

### **Primary Key Constraints**

The system uses various primary key strategies:
- **ClassVariant**: Custom ID with primary key
- **ClassVariantFeatureProgressionOverride**: Auto-increment primary key
- **ClassVariantSpellOverride**: Auto-increment primary key
- **ClassVariantSourceMap**: Composite primary key

### **Foreign Key Constraints**

The system maintains referential integrity through foreign key constraints:
- **ClassVariant**: Links to base class
- **ClassVariantFeatureProgressionOverride**: Links to variant and original progression
- **ClassVariantSpellOverride**: Links to variant and spell
- **ClassVariantSourceMap**: Links to variant and source book

### **Unique Constraints**

The system ensures data integrity through unique constraints:
- **ClassVariant**: Variant names unique within each base class
- **ClassVariantSpellOverride**: Prevents duplicate spell overrides
- **ClassVariantSourceMap**: One source book entry per variant

### **Check Constraints**

The system validates data through check constraints:
- **ClassVariantSpellOverride**: Level range validation (-1 to 9)
- **ClassVariant**: Property range validation

## 🔧 **Index Strategy**

### **Primary Indexes**

The system uses primary indexes for efficient data access:
- **ClassVariant**: Primary key and base class ID indexes
- **ClassVariantFeatureProgressionOverride**: Primary key and variant ID indexes
- **ClassVariantSpellOverride**: Primary key and variant ID indexes

### **Composite Indexes**

The system uses composite indexes for unique constraints and performance:
- **ClassVariant**: Name and base class ID unique index
- **ClassVariantSpellOverride**: Variant, spell, and level unique index
- **ClassVariantSourceMap**: Variant and source book unique index

### **Performance Indexes**

The system uses performance indexes for common query patterns:
- **ClassVariantFeatureProgressionOverride**: Variant and original progression indexes
- **ClassVariantSpellOverride**: Variant and spell indexes

## 📈 **Data Access Patterns**

### **Common Query Patterns**

The system uses several common query patterns for variant resolution:
- **Variant Resolution**: Fetch variant with related data
- **Feature Override Resolution**: Get feature overrides for variant
- **Spell Override Resolution**: Get spell overrides for variant

### **Performance Considerations**

The system optimizes performance through:
- **Selective Includes**: Only fetch necessary related data
- **Batch Operations**: Group related database operations
- **Index Usage**: Leverage indexes for fast lookups

**Caching Strategy:**
- **Base Class Caching**: Cache frequently accessed base classes
- **Variant Resolution Caching**: Cache resolved variant data
- **Feature Population Caching**: Cache feature system data

## 🔧 **Migration Strategy**

### **Schema Evolution**

The system supports schema evolution through:
- **Adding New Override Types**: Add new fields and tables
- **Performance Enhancements**: Add new indexes and optimize queries
- **Data Migration**: Migrate existing data to new schema

### **Data Migration**

The system supports data migration through:
- **Custom ID Migration**: Update existing variants with custom IDs
- **Override Data Migration**: Migrate existing feature overrides
- **Spell Override Migration**: Migrate existing spell overrides

## 📚 **Related Documentation**

### **Cross-System References**

- **[Variant Class System](./README.md)**: Core variant system documentation
- **[Class System Database Schema](../class-system/database-schema.md)**: Base class system schema
- **[Feature System Database Schema](../feature-system/database-schema.md)**: Feature system schema
- **[Spell System Database Schema](../spell-system/database-schema.md)**: Spell system schema
- **[Database Schema Patterns](../application-overview/database-schema.md)**: Database design patterns

### **Implementation References**

- **[Backend Implementation](./backend-implementation.md)**: Backend implementation details
- **[Architecture Principles](./architecture-principles.md)**: Architectural principles
- **[Variant Class Implementation Plan](../project-mgmt/variant-class-system-implementation.md)**: Detailed implementation guide

## Summary

The variant class database schema provides a robust foundation for storing variant class data with minimal duplication. The custom ID generation strategy ensures unique identification while the override-based storage model provides full flexibility for class modifications. The schema integrates seamlessly with existing systems and provides a solid foundation for variant class management.

The design follows established database patterns and provides comprehensive constraints, indexes, and relationships to ensure data integrity and performance. The schema is designed for easy extension and supports future enhancements to the variant class system.
