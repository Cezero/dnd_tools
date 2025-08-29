# Documentation Standards

*Guiding principles and standards for creating and maintaining high-quality documentation across the D&D Tools project.*

## 📋 **Core Principles**

### **Natural Language Over Code Dumps**
- **Focus on explanations**: Use natural language to describe functionality, purpose, and relationships
- **Avoid raw code**: Replace large code snippets with descriptive text and source file references
- **Link to source**: Provide direct links to underlying source files where raw code can be found
- **Explain intent**: Describe what the code does and why, not just what it is

### **Layered Architecture Approach**
- **Application Overview**: Document shared patterns, conventions, and cross-cutting concerns
- **Database Schema**: Document the "lowest layer" with complete model descriptions and relationships
- **Validation Schemas**: Document Zod validation rules and type safety mechanisms
- **Static Data**: Document enums, maps, and reference data structures
- **Backend Implementation**: Document services, controllers, and business logic
- **Frontend Components**: Document UI components and user interactions
- **Specialized Systems**: Document formula, modifier, choice, and special effect systems

### **Cross-Layer Integration**
- **Explicit Relationships**: Clearly identify when database fields reference static data entities
- **Enum References**: Use `@EnumName` notation to reference static data enums
- **Source File Links**: Provide direct paths to relevant source files
- **Join Relationships**: Document how database fields join with static data maps
- **Avoid Duplication**: Reference lower-layer documentation rather than duplicating information
- **Cross-System References**: Link to related system documentation rather than duplicating schema information

## 🏗️ **Documentation Structure**

### **Documentation Consolidation Approach**

The D&D Tools project follows a consolidation approach to eliminate duplication and improve maintainability:

#### **Application Overview Documentation**
- **Shared Patterns**: Common patterns, conventions, and strategies used across multiple systems
- **Cross-Cutting Concerns**: Database schema patterns, validation patterns, error handling, testing strategies
- **Integration Patterns**: How systems communicate and share data
- **Best Practices**: Standardized approaches for common problems

#### **System-Specific Documentation**
- **Focused Content**: Only system-specific details, avoiding duplication of shared concepts
- **Cross-References**: Links to application-overview documentation for shared patterns
- **Related System Links**: References to other system documentation for shared models
- **Unique Features**: System-specific functionality and implementation details

#### **Consolidation Benefits**
- **Single Source of Truth**: Common concepts documented once in application-overview
- **Reduced Maintenance**: Changes to shared patterns only need to be made in one place
- **Improved Focus**: System documentation focuses only on system-specific details
- **Better Navigation**: Clear separation between shared and system-specific information

### **Required Sections for System Documentation**
- **Overview**: High-level description of the system's purpose and scope
- **Core Models/Components**: Detailed descriptions of primary entities
- **Integration Points**: How the system connects with other systems
- **Database Constraints**: Primary keys, foreign keys, and validation rules
- **Data Access Patterns**: Common query patterns and performance considerations
- **Extension Points**: Future enhancement possibilities and flexibility
- **Cross-System References**: Links to related system documentation for shared models and patterns

### **Architecture Principles Documentation**
- **Core Architectural Principles**: Fundamental design decisions and patterns
- **Component Architecture**: Relationships and responsibilities using Mermaid diagrams
- **Integration Architecture**: How systems interact and communicate
- **Design Decisions**: Rationale behind architectural choices
- **Extension Points**: How the system can be extended and enhanced
- **Error Handling**: Error management strategies and patterns
- **Performance**: Performance considerations and optimization strategies

## 📊 **Static Data Documentation Standards**

### **Enum and Reference Data**
- **Purpose and Scope**: Explain what the enum represents and its usage
- **Value Definitions**: Document each enum value with its meaning and context
- **Source File References**: Provide direct links to source files
- **Usage Examples**: Show how the enum is used in practice
- **Integration Points**: Document how enums integrate with database schemas

### **Map and Reference Tables**
- **Structure Description**: Explain the data structure and its fields
- **Purpose and Usage**: Describe when and how the map is used
- **Performance Considerations**: Document caching and access patterns
- **Extension Guidelines**: Explain how to add new entries

## 🔗 **Integration Documentation**

### **Cross-System Relationships**
- **Explicit References**: Use `@SystemName` notation for cross-system references
- **Relationship Diagrams**: Use Mermaid ER diagrams to visualize relationships
- **Dependency Mapping**: Document which systems depend on which others
- **Data Flow**: Explain how data flows between systems

### **Cross-System Documentation References**
- **Shared Models**: Link to system documentation for shared models rather than duplicating schema information
- **Feature System Integration**: Systems using FeatureProgression should link to feature-system documentation
- **Related System Links**: Include links to documentation for systems that share models or have strong relationships
- **Avoid Schema Duplication**: Do not repeat schema definitions for models defined in other systems

**Examples**:
- **Class System**: Links to feature-system documentation for FeatureProgression models
- **Race System**: Links to feature-system documentation for FeatureProgression models
- **Feature System**: Links to class-system and race-system documentation for source entities

### **Static Data Integration**
- **Database Field References**: Explicitly identify database fields that reference static data
- **Enum Constants**: Use specific enum constant names (e.g., `SizeId.Fine`)
- **Source File Paths**: Provide complete paths to static data source files
- **Join Relationships**: Document how database values join with static data maps

### **Application Overview References**
- **Shared Pattern Links**: Reference application-overview documentation for common patterns and conventions
- **Cross-Cutting Concerns**: Link to shared documentation for database patterns, validation patterns, error handling, etc.
- **Standard Format**: Use `[Documentation Title](../application-overview/document-name.md#section-name)` format for links
- **Avoid Duplication**: Do not repeat information that is documented in application-overview files

**Examples**:
- **Database Schema Patterns**: `[Database Schema Patterns](../application-overview/database-schema.md#identity-and-audit-fields)`
- **Performance Optimization**: `[Performance Optimization](../application-overview/performance-optimization.md)`
- **Maintenance and Extension**: `[Maintenance and Extension](../application-overview/maintenance-and-extension.md)`

## 📝 **Content Quality Standards**

### **Clarity and Precision**
- **Clear Language**: Use precise, unambiguous language
- **Consistent Terminology**: Use consistent terms and naming conventions
- **Logical Flow**: Organize content in logical, progressive order
- **Complete Coverage**: Ensure all aspects of the system are documented

### **Accuracy and Currency**
- **Source Verification**: Verify documentation against actual source code
- **Regular Updates**: Update documentation when code changes
- **Version Alignment**: Ensure documentation matches current codebase
- **Error Correction**: Promptly correct inaccuracies and outdated information

### **Completeness**
- **All Layers**: Document all architectural layers for each system
- **All Relationships**: Document all system relationships and dependencies
- **All Constraints**: Document all validation rules and constraints
- **All Integration Points**: Document all ways systems interact
- **All Cross-References**: Include all necessary links to shared and related system documentation

## 🎯 **Documentation Goals**

### **For Developers**
- **Quick Understanding**: Enable rapid comprehension of system purpose and structure
- **Implementation Guidance**: Provide clear guidance for implementing features
- **Troubleshooting Support**: Help identify and resolve issues
- **Onboarding**: Enable new developers to understand the codebase quickly

### **For AI Agents**
- **Explicit Relationships**: Clear identification of dependencies and relationships
- **Source File References**: Direct paths to relevant source code
- **Implementation Context**: Understanding of how systems work together
- **Validation Rules**: Clear understanding of constraints and requirements

### **For Maintenance**
- **Consistency**: Standardized format across all documentation
- **Traceability**: Clear links between documentation and source code
- **Completeness**: Comprehensive coverage of all system aspects
- **Accuracy**: Documentation that reflects the actual codebase

## 📋 **Documentation Creation Guidelines**

### **When Creating New System Documentation**
1. **Check Application Overview**: First check if the concept is already documented in application-overview
2. **Review Source Code**: Always review the actual source code to ensure accuracy
3. **Identify Shared Patterns**: Determine if the pattern/concept is used across multiple systems
4. **Create Application Overview**: If it's a shared pattern, document it in application-overview first
5. **System-Specific Focus**: Focus system documentation only on system-specific details
6. **Add Cross-References**: Include links to application-overview and related system documentation
7. **Validate Against Source**: Ensure all documentation matches the actual source code implementation

### **Source Code Validation Requirements**

**Mandatory Source Review**:
- **Always Review Source**: Never create documentation without reviewing the actual source code
- **Verify Implementation**: Ensure documented patterns match actual implementation
- **Check File Paths**: Verify all source file references are accurate and current
- **Validate Examples**: Ensure code examples match actual source code
- **Confirm Relationships**: Verify documented relationships match actual code structure

**Source Code Review Process**:
1. **Scan Source Files**: Use tools to examine actual source code files
2. **Verify Patterns**: Confirm documented patterns exist in source code
3. **Check Dependencies**: Verify documented dependencies and relationships
4. **Validate Examples**: Ensure code examples are accurate and current
5. **Update Documentation**: Correct any discrepancies found during review

### **Dynamic Consolidation Updates**

**New Pattern Discovery**:
- **Identify New Patterns**: When creating system documentation, identify any new shared patterns
- **Update Application Overview**: Immediately update application-overview with new shared patterns
- **Update Existing Systems**: Update all existing system documentation that has duplicated information
- **Add Cross-References**: Add references to the new shared documentation
- **Remove Duplication**: Remove duplicated content from system-specific documentation

**Example Process**:
1. **Creating Race System Backend Documentation**:
   - Review actual race system source code
   - Discover new authentication pattern not in application-overview
   - Update `application-overview/backend-implementation.md` with new pattern
   - Update class system and feature system backend docs to reference new pattern
   - Remove duplicated authentication content from system-specific docs

2. **Creating Feature System Validation Documentation**:
   - Review actual feature system validation schemas
   - Discover new validation pattern not in application-overview
   - Update `application-overview/validation-schemas.md` with new pattern
   - Update race system and class system validation docs to reference new pattern
   - Remove duplicated validation content from system-specific docs

### **When Documenting Database Schemas**
1. **Review Source Code**: Examine actual Prisma schema files
2. **Reference Shared Patterns**: Link to database-schema.md for common patterns (identity fields, source attribution, etc.)
3. **Cross-System Models**: Link to other system documentation for shared models (e.g., FeatureProgression)
4. **System-Specific Details**: Focus on unique aspects of the system's database schema
5. **Integration Points**: Document how the system integrates with other systems
6. **Validate Relationships**: Ensure documented relationships match actual schema

### **When Documenting Validation Schemas**
1. **Review Source Code**: Examine actual Zod schema files
2. **Reference Shared Patterns**: Link to validation-schemas.md for common validation patterns
3. **System-Specific Rules**: Document only validation rules unique to the system
4. **Cross-System Validation**: Link to related system validation documentation
5. **Error Handling**: Reference shared error handling patterns
6. **Validate Schemas**: Ensure documented schemas match actual source code

### **When Documenting Backend Implementation**
1. **Review Source Code**: Examine actual service, controller, and route files
2. **Reference Shared Patterns**: Link to backend-implementation.md for common implementation patterns
3. **System-Specific Logic**: Focus on business logic unique to the system
4. **Integration Services**: Document how the system integrates with other services
5. **Error Handling**: Reference shared error handling and middleware patterns
6. **Validate Implementation**: Ensure documented implementation matches actual source code

### **When Documenting Frontend Components**
1. **Review Source Code**: Examine actual component files
2. **Reference Shared Patterns**: Link to frontend-patterns.md for common component patterns
3. **System-Specific UI**: Focus on UI components unique to the system
4. **State Management**: Document system-specific state management patterns
5. **User Interactions**: Document system-specific user interaction patterns
6. **Validate Components**: Ensure documented components match actual source code

## 📋 **Documentation Maintenance**

### **Update Triggers**
- **Code Changes**: Update documentation when source code changes
- **Schema Changes**: Update documentation when database schemas change
- **New Features**: Document new features and capabilities
- **Bug Fixes**: Update documentation when bugs reveal documentation gaps
- **Shared Pattern Changes**: Update application-overview when shared patterns change
- **New Pattern Discovery**: Update application-overview when new shared patterns are discovered

### **Source Code Validation Process**

**Regular Validation**:
- **Periodic Reviews**: Regularly review documentation against source code
- **Change Monitoring**: Monitor source code changes and update documentation accordingly
- **Accuracy Checks**: Verify documentation accuracy against actual implementation
- **Example Validation**: Ensure code examples are current and accurate

**Validation Tools**:
- **Source Scanning**: Use tools to scan and analyze source code
- **File Path Verification**: Verify all source file references are valid
- **Pattern Matching**: Confirm documented patterns exist in source code
- **Relationship Validation**: Verify documented relationships match actual code

### **Review Process**
- **Regular Reviews**: Periodically review documentation for accuracy
- **Cross-Reference Checks**: Verify documentation against source code
- **Relationship Validation**: Ensure all relationships are correctly documented
- **Completeness Audits**: Check that all systems are fully documented
- **Consolidation Checks**: Verify that shared patterns are documented in application-overview
- **Duplication Audits**: Check for and eliminate duplicated content across system documentation
- **Source Code Validation**: Ensure all documentation matches actual source code implementation

## Summary

These documentation standards ensure that all documentation in the D&D Tools project:

- **Provides Value**: Offers meaningful insights and guidance
- **Maintains Accuracy**: Reflects the actual state of the codebase
- **Enables Understanding**: Helps developers and AI agents comprehend the system
- **Supports Maintenance**: Makes the codebase easier to maintain and extend
- **Follows Best Practices**: Uses proven documentation patterns and approaches
- **Eliminates Duplication**: Consolidates shared patterns in application-overview documentation
- **Improves Focus**: Keeps system documentation focused on system-specific details
- **Enhances Navigation**: Provides clear cross-references between related documentation

By following these standards, we create documentation that serves as a reliable, comprehensive, and valuable resource for understanding and working with the D&D Tools codebase. The consolidation approach ensures that common patterns are documented once and referenced appropriately, while system-specific documentation remains focused and maintainable.
