# System Architecture Overview

*Comprehensive overview of the D&D Tools system architecture, cross-system dependencies, and development workflows.*

## 🎯 **Architecture Overview**

The D&D Tools application is built around a **feature-driven architecture** where the **Feature System** serves as the core engine that powers all other game systems. This creates a unified, flexible foundation for modeling D&D 3.5 mechanics.

### **Core System Relationships**

```
┌─────────────────────────────────────────────────────────────────┐
│                        D&D Tools Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Frontend      │    │    Backend      │    │   Database   │ │
│  │   Components    │◄──►│    Services     │◄──►│   Schema     │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Feature System                           │ │
│  │              (Core Game Engine)                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Character  │    │   Class      │    │   Race       │ │
│  │  Management  │    │   System     │    │   System     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│           │                       │                       │     │
│           ▼                       ▼                       ▼     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Spell      │    │  Equipment   │    │   Reference  │ │
│  │   System     │    │   System     │    │    Data      │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 **Feature System as the Core Engine**

The **Feature System** is the central nervous system that powers all other game systems:

### **How Other Systems Use the Feature System**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Feature System Integration                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Class      │    │   Race       │    │   Character  │     │
│  │   System     │    │   System     │    │  Management  │     │
│  │              │    │              │    │              │     │
│  │ • Features   │    │ • Features   │    │ • Features   │     │
│  │ • Progression│    │ • Progression│    │ • Progression│     │
│  │ • Modifiers  │    │ • Modifiers  │    │ • Modifiers  │     │
│  │ • Choices    │    │ • Choices    │    │ • Choices    │     │
│  │ • Effects    │    │ • Effects    │    │ • Effects    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│           │                       │                       │     │
│           └───────────────────────┼───────────────────────┘     │
│                                   │                             │
│                                   ▼                             │
│                        ┌─────────────────┐                     │
│                        │   Feature       │                     │
│                        │   System        │                     │
│                        │                 │                     │
│                        │ • Feature       │                     │
│                        │ • Progression   │                     │
│                        │ • Modifier      │                     │
│                        │ • Choice        │                     │
│                        │ • Effect        │                     │
│                        │ • Prerequisite  │                     │
│                        └─────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Integration Patterns**

1. **Class System** → **Feature System**
   - Classes define features (abilities, spellcasting, etc.)
   - Features are granted at specific levels
   - Modifiers provide bonuses to skills, saves, BAB, etc.

2. **Race System** → **Feature System**
   - Races define racial features (ability adjustments, traits)
   - Features provide automatic bonuses and choices
   - Modifiers affect ability scores, skills, etc.

3. **Character Management** → **Feature System**
   - Characters receive features from their classes and races
   - Feature choices are tracked per character
   - Real-time calculations apply feature effects

## 🔗 **Cross-System Dependencies**

### **Feature System Dependencies**
- **Input**: Class definitions, race definitions, character data
- **Output**: Calculated character stats, feature effects, choices
- **Used By**: Character management, class system, race system

### **Character Management Dependencies**
- **Input**: Feature system calculations, user data, game content
- **Output**: Character data, advancement tracking, choices
- **Uses**: Feature system, class system, race system, equipment system

### **Frontend Component Dependencies**
- **Input**: Backend services, user interactions, state management
- **Output**: UI components, form data, user feedback
- **Uses**: API integration, validation schemas, state management

### **Backend Service Dependencies**
- **Input**: Database schema, business rules, authentication
- **Output**: API responses, calculated data, validation results
- **Uses**: Feature system, database models, middleware

## 🎯 **Development Workflows**

### **Adding New Game Content**

1. **Define Content** (Class, Race, Spell, Item)
   - Create database schema updates
   - Define Zod validation schemas
   - Implement backend services

2. **Model Features** (Feature System)
   - Identify features and effects
   - Create feature definitions
   - Implement progression patterns

3. **Build UI** (Frontend Components)
   - Create management interfaces
   - Implement form validation
   - Add to character creation/advancement

4. **Integration** (Cross-System)
   - Update character calculations
   - Test feature interactions
   - Validate user workflows

### **Character Creation Workflow**

1. **User Input** → **ValidatedForm**
   - Name, race, class selection
   - Ability score assignment
   - Feature choices

2. **Validation** → **Backend Services**
   - Zod schema validation
   - Prerequisite checking
   - Business rule validation

3. **Feature Application** → **Feature System**
   - Apply race features
   - Apply class features
   - Calculate derived stats

4. **Persistence** → **Database**
   - Save character data
   - Track choices and advancement
   - Store equipment and spells

### **Real-Time Character Calculations**

1. **Character Data** → **Feature System**
   - Load character features
   - Apply level-based progression
   - Calculate modifiers

2. **Feature Effects** → **Calculation Service**
   - Aggregate bonuses/penalties
   - Apply conditional effects
   - Generate final stats

3. **Results** → **Frontend Display**
   - Update character sheet
   - Show calculated values
   - Highlight changes

## 📈 **System Status and Roadmap**

### **Current Implementation Status**

#### **✅ Fully Implemented**
- **Feature System**: Core engine complete (99%)
- **Frontend Components**: ValidatedForm, GenericList, API integration (90%)
- **Backend Patterns**: Service layer, controllers, middleware (95%)
- **Database Schema**: All major models defined (95%)

#### **⚠️ Partially Implemented**
- **Character Management**: Basic structure, missing advanced features (45%)
- **Class System**: Core classes modeled, missing advanced features (85%)
- **Race System**: Core races modeled, needs feature system migration (75%)

#### **❌ Not Yet Implemented**
- **Advanced Character Features**: Save/load, leveling, spell selection
- **Conditional Logic**: Complex racial feature conditions
- **Advanced UI**: Character sheet, dice box integration

### **Development Priorities**

#### **Immediate (Next 2-4 weeks)**
1. **Character System Integration** - Connect to revamped feature system
2. **Character Save/Load** - Implement persistence functionality
3. **Character Leveling** - Add level-up system
4. **Race Feature Migration** - Update races to new feature system

#### **Short Term (1-2 months)**
1. **Spell Selection** - Add spell selection for spellcasters
2. **Equipment Purchasing** - Implement gold and equipment system
3. **Character Generation** - Add height, weight, age generation
4. **Advanced UI Components** - Character sheet, dice integration

#### **Long Term (3-6 months)**
1. **Conditional Features** - Complex racial feature logic
2. **Advanced Calculations** - Complex formula system
3. **Performance Optimization** - Caching and query optimization
4. **Mobile Support** - Responsive design and touch interactions

## 🔧 **Technical Architecture Decisions**

### **Why Feature-Driven Architecture?**

1. **Unified Modeling**: All game mechanics use the same system
2. **Flexibility**: Easy to add new features and effects
3. **Consistency**: Predictable patterns across all systems
4. **Maintainability**: Centralized logic reduces duplication

### **Why Type-Safe API Integration?**

1. **Compile-Time Safety**: Catch errors before runtime
2. **Developer Experience**: Better IDE support and autocomplete
3. **Documentation**: Types serve as living documentation
4. **Refactoring Safety**: Confident code changes

### **Why Zod Validation?**

1. **Runtime Safety**: Validate data at boundaries
2. **Type Inference**: Automatic TypeScript type generation
3. **Error Messages**: User-friendly validation errors
4. **Schema Evolution**: Easy to update validation rules

## 📖 **Getting Started Guide**

### **For New Developers**

1. **Start with the Feature System**
   - Read [Feature System Overview](../feature-system/README.md)
   - Understand the core concepts and architecture
   - Review [Implementation Examples](../feature-system/class-features.md)

2. **Learn the Frontend Patterns**
   - Study [Frontend Components Overview](./frontend-components.md)
   - Review [ValidatedForm System](../frontend-components/validated-form-system.md)
   - Understand [API Integration](../frontend-components/api-integration-patterns.md)

3. **Explore Backend Architecture**
   - Read [Backend Implementation Patterns](./backend-implementation.md)
   - Understand service layer organization
   - Review [API Design Standards](../api/api-design-standards.md)

4. **Build Something**
   - Create a simple feature using the patterns
   - Implement a basic form with validation
   - Connect frontend to backend via API

### **For AI Assistants**

1. **Understand the Architecture**
   - Feature System is the core engine
   - All systems integrate through the Feature System
   - Frontend and backend use type-safe patterns

2. **Follow Established Patterns**
   - Use ValidatedForm for all forms
   - Use GenericList for all lists
   - Use typedApi for all API calls (see [Frontend API Patterns](frontend-api-patterns.md))
   - Follow service layer patterns for backend

3. **Reference Documentation**
   - Check system-specific docs for domain knowledge
   - Use component docs for UI patterns
   - Reference API docs for integration patterns

## Summary

The D&D Tools application uses a feature-driven architecture where the Feature System serves as the core engine that powers all other game systems. This architecture provides:

- **Unified Modeling**: All game mechanics use the same system
- **Flexibility**: Easy to add new features and effects
- **Consistency**: Predictable patterns across all systems
- **Maintainability**: Centralized logic reduces duplication
- **Type Safety**: Full TypeScript integration with runtime validation
- **Scalability**: Architecture designed for growth and evolution

The system is designed to support complex D&D 3.5 mechanics while maintaining simplicity and consistency across all components.
