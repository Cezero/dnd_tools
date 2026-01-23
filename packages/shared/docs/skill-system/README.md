# Skill System

*Comprehensive skill definitions, mechanics, and character skill advancement system for the D&D Tools application.*

## 📋 **System Overview**

The Skill System provides complete skill definitions, mechanics, and character skill advancement capabilities. The system integrates with the Character Management System for skill ranks and points, the Feature System for class skills, and provides the foundation for skill-based character abilities and checks.

### **Core Components**
- **Skill Definitions**: Complete skill information including descriptions, mechanics, and properties
- **Skill Types**: Standard skills, trained-only skills, and analog skills (feature-linked)
- **Class Skills**: Integration with feature system for class-specific skill access
- **Character Skills**: Skill ranks, points, and advancement tracking
- **Skill Mechanics**: Check descriptions, action types, retry rules, and special notes

### **Key Features**
- **Comprehensive Skill Data**: 46 core skills with complete mechanical information
- **Flexible Skill Types**: Support for standard, trained-only, and analog skills
- **Class Integration**: Skills tied to specific classes through feature system
- **Character Advancement**: Skill points, ranks, and progression tracking
- **Mechanical Details**: Check descriptions, action types, retry rules, and restrictions

## 📚 **Documentation Structure**

### **Core Documentation**
- **[Database Schema](database-schema.md)** - Prisma schema models and relationships
- **[Validation Schemas](validation-schemas.md)** - Zod validation rules and type safety
- **[Static Data](static-data.md)** - Skill definitions and reference data
- **[Backend Implementation](backend-implementation.md)** - Skill services and API
- **[Frontend Components](frontend-components.md)** - React components and user interface

### **Integration Documentation**
- **[Character Integration](character-integration.md)** - Character skill advancement and ranks
- **[Feature Integration](feature-integration.md)** - Class skills and feature-linked skills
- **[Ability Integration](ability-integration.md)** - Ability score associations and modifiers

## 🔗 **Cross-System References**

### **Related System Documentation**
- **[Character Management System](../character-management/README.md)** - Character skill ranks and points
- **[Feature System](../feature-system/README.md)** - Class skills and feature-linked skills
- **[Ability Score System](../ability-score-system/README.md)** - Ability modifiers and calculations
- **[Backend Implementation Patterns](../application-overview/backend-implementation.md)** - Common backend patterns
- **[Database Schema Patterns](../application-overview/database-schema.md)** - Common database patterns
- **[Validation Schema Patterns](../application-overview/validation-schemas.md)** - Common validation patterns

### **Shared Models and Patterns**
- **Skill Model**: Core skill definition data and relationships
- **AdvancementSkill**: Character skill advancement tracking
- **FeaturePrerequisite**: Skill prerequisites for features
- **Skill Types**: Standard, trained-only, and analog skill patterns
- **Skill Mechanics**: Check descriptions, action types, and retry rules

## 🏗️ **Architecture Overview**

### **System Layers**
```
Frontend Components (React)
├── SkillEdit (Skill Creation/Editing)
├── SkillList (Skill Browsing)
├── SkillDetail (Skill Information)
└── SkillQueryHooks (API Communication)

Backend Services
├── SkillService (Skill CRUD Operations)
├── SkillController (HTTP Request Handling)
└── SkillRoutes (API Endpoint Definition)

Database Models
├── Skill (Core Skill Data)
├── AdvancementSkill (Character Skill Ranks)
└── FeaturePrerequisite (Skill Prerequisites)

Static Data
├── SkillData (Skill Definitions)
└── SkillRetryTypes (Retry Type References)
```

### **Data Flow**
```
Skill Definition → SkillService → Database Storage
Character Creation → Skill Points → Skill Ranks
Class Features → Class Skills → Skill Access
Skill Check → Ability Modifier → Skill Ranks → Total Bonus
```

## 🎯 **Skill Types**

### **Standard Skills**
- **Definition**: Skills that can be used by any character with appropriate training
- **Examples**: Climb, Jump, Swim, Hide, Move Silently
- **Mechanics**: Use skill ranks + ability modifier + miscellaneous modifiers
- **Training**: Can be used untrained (unless specified otherwise)

### **Trained-Only Skills**
- **Definition**: Skills that require specific training to use effectively
- **Examples**: Decipher Script, Disable Device, Spellcraft, Use Magic Device
- **Mechanics**: Cannot be used untrained, requires at least 1 skill rank
- **Training**: Must have at least 1 rank to attempt skill checks

### **Analog Skills (Feature-Linked)**
- **Definition**: Skills that use "class level + ability modifier" instead of skill ranks
- **Examples**: Wild Empathy (Druid/Ranger), Turn Undead (Cleric), Lay on Hands (Paladin)
- **Mechanics**: Formula-based calculation using class levels and ability modifiers
- **Training**: Only available to specific classes through features

## 📊 **Database Models**

### **Primary Models**
- **`Skill`**: Core skill definition with all mechanical properties
- **`AdvancementSkill`**: Character skill advancement and ranks
- **`FeaturePrerequisite`**: Skill prerequisites for features

### **Key Relationships**
- **Skill → AdvancementSkill**: One-to-many character skill ranks
- **Skill → FeaturePrerequisite**: One-to-many skill prerequisites
- **Character → AdvancementSkill**: Character skill advancement tracking

## 🎯 **Common Use Cases**

### **Skill Definition Creation**
1. Define skill name and basic properties
2. Set governing ability score
3. Configure skill type (standard, trained-only, analog)
4. Add mechanical descriptions (check, action, retry)
5. Set armor check penalty and restrictions

### **Class Skill Assignment**
1. Create feature progression for class
2. Link feature to specific skill
3. Set skill as class skill for the class
4. Configure skill point cost (1 point for class skills)

### **Character Skill Advancement**
1. Calculate skill points based on class and intelligence
2. Allocate skill points to desired skills
3. Track skill ranks and total bonuses
4. Apply armor check penalties and other modifiers

### **Skill Check Resolution**
1. Determine governing ability score
2. Calculate ability modifier
3. Add skill ranks and class skill bonus
4. Apply miscellaneous modifiers
5. Roll d20 and add total bonus

## 🔧 **Configuration Management**

### **Skill Properties**
- **Ability Association**: Governing ability score for each skill
- **Training Requirements**: Whether skill requires training
- **Armor Check Penalty**: Whether skill is affected by armor
- **Retry Rules**: Whether and how skill can be retried
- **Special Restrictions**: Any special limitations or requirements

### **Skill Descriptions**
- **Check Description**: How to perform the skill check
- **Action Description**: Action type required (standard, full-round, etc.)
- **Retry Description**: Rules for retrying the skill
- **Special Notes**: Additional mechanical information
- **Synergy Notes**: Bonuses from related skills
- **Untrained Notes**: Special rules for untrained use

## 📈 **Performance Considerations**

### **Skill Data Access**
- **Static Data**: Skill definitions cached in frontend for performance
- **Database Queries**: Efficient queries for skill lists and details
- **Character Skills**: Optimized queries for character skill advancement
- **Caching**: Skill data cached to reduce database load

### **Skill Calculations**
- **Real-time Updates**: Skill bonuses calculated in real-time
- **Modifier Tracking**: Efficient tracking of all skill modifiers
- **Armor Penalties**: Automatic application of armor check penalties
- **Class Bonuses**: Automatic application of class skill bonuses

## 🔄 **Maintenance and Extension**

### **Adding New Skills**
1. Add skill definition to static data
2. Update database schema if needed
3. Add skill to backend services
4. Update frontend components
5. Add skill to class skill lists
6. Update documentation

### **Modifying Skill Mechanics**
1. Update skill definition in static data
2. Modify database schema if needed
3. Update validation schemas
4. Update frontend components
5. Test skill calculations
6. Update documentation

### **Adding Skill Types**
1. Define new skill type properties
2. Update database schema
3. Update validation schemas
4. Update frontend components
5. Add type-specific logic
6. Update documentation

## 📝 **Development Guidelines**

### **Skill Definition Development**
- Always include complete mechanical descriptions
- Ensure proper ability score associations
- Set appropriate training requirements
- Include all relevant restrictions and notes
- Test skill calculations thoroughly

### **Class Skill Integration**
- Use feature system for class skill assignments
- Ensure proper skill point cost calculations
- Test class skill bonus applications
- Verify skill access restrictions

### **Character Skill Management**
- Implement proper skill point calculations
- Track skill ranks accurately
- Apply all relevant modifiers
- Handle armor check penalties correctly
- Support multiclass skill point calculations

### **Testing Requirements**
- Test skill definition creation and editing
- Test class skill assignments and access
- Test character skill advancement and ranks
- Test skill check calculations and modifiers
- Test armor check penalty applications
- Test trained-only skill restrictions
- Test analog skill calculations

## Summary

The Skill System provides a comprehensive foundation for skill definitions, mechanics, and character skill advancement. The system follows established patterns, integrates with multiple subsystems, and provides a solid foundation for skill-based character abilities and checks.

Key strengths include:
- **Complete Skill Definitions**: 46 core skills with full mechanical information
- **Flexible Skill Types**: Support for standard, trained-only, and analog skills
- **Class Integration**: Seamless integration with class skills through feature system
- **Character Advancement**: Comprehensive skill point and rank tracking
- **Mechanical Detail**: Complete skill mechanics including descriptions and restrictions

The system is designed to scale with the application and provides the necessary foundation for skill-based gameplay mechanics and character development.
