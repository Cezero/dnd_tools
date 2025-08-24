# D&D Tools System Overview

*Comprehensive overview of all systems, components, and their relationships in the D&D Tools application.*

## 🎯 **System Architecture Overview**

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

## 🏗️ **System Layers**

### **1. Presentation Layer (Frontend)**

#### **Core Components**
- **[ValidatedForm System](../frontend-components/validated-form-system.md)** - Type-safe form validation with Zod
- **[GenericList System](../frontend-components/generic-list-system.md)** - Reusable list/table components with filtering
- **[API Integration](../frontend-components/api-integration-patterns.md)** - Type-safe API client with `typedApi`

#### **Specialized Components**
- **DiceBox** - 3D dice rolling with physics and customization
- **Layout Components** - Navigation, notifications, and page structure
- **Character Sheet** - Dynamic character display and calculations

### **2. Business Logic Layer (Backend)**

#### **Service Architecture**
- **[Service Layer Patterns](../backend/backend-patterns.md)** - Business logic separation and patterns
- **Controller Layer** - HTTP request handling and validation
- **Middleware** - Authentication, error handling, and request processing

#### **Core Services**
- **Feature System Service** - Core game engine for feature calculations
- **Character Service** - Character CRUD and advancement logic
- **Calculation Service** - Real-time character stat calculations

### **3. Data Layer (Database)**

#### **Schema Organization**
- **Feature System Schema** - Core feature definitions and relationships
- **Character Schema** - Character data and advancement tracking
- **Game Content Schema** - Classes, races, spells, items, skills, feats
- **User Schema** - User accounts and preferences

## 🔄 **System Interactions**

### **Feature System as the Core Engine**

The **Feature System** is the central nervous system that powers all other game systems:

#### **How Other Systems Use the Feature System**

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

#### **Integration Patterns**

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

### **Frontend-Backend Integration**

#### **API Communication Flow**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Components    │    │   Services      │    │   Schema        │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│                 │    │                 │    │                 │
│ • ValidatedForm │    │ • Feature       │    │ • Feature       │
│ • GenericList   │◄──►│   Service       │◄──►│   Tables        │
│ • typedApi      │    │ • Character     │    │ • Character     │
│ • State Mgmt    │    │   Service       │    │   Tables        │
│                 │    │ • Calculation   │    │ • Game Content  │
│                 │    │   Service       │    │   Tables        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Data Flow Patterns**

1. **Form Submission**
   - `ValidatedForm` → `typedApi` → Backend Service → Database
   - Zod validation at both frontend and backend
   - Type-safe request/response handling

2. **Data Display**
   - Database → Backend Service → `typedApi` → `GenericList`
   - Consistent data structures across layers
   - Real-time filtering and sorting

3. **Feature Calculations**
   - Character Data → Feature System → Calculation Service → Frontend
   - Real-time stat calculations
   - Dynamic UI updates

## 📚 **System Documentation Structure**

### **Core Systems**

#### **Feature System** (`feature-system/`)
- **[Overview](feature-system/README.md)** - Core concepts and architecture
- **[Schema Reference](feature-system/schema-reference.md)** - Database models and relationships
- **[Implementation Guides](feature-system/)** - Class features, racial traits, languages
- **[Advanced Topics](feature-system/)** - Formulas, runtime calculations, testing

#### **Character Management** (`character-management/`)
- **[Overview](character-management/README.md)** - Character creation and advancement
- **[Schema Reference](character-management/schema-reference.md)** - Character database models
- **[Implementation Guides](character-management/)** - Creation, advancement, multiclassing

#### **Class System** (`class-system/`)
- **[Overview](class-system/README.md)** - Class definitions and spellcasting
- **[Schema Reference](class-system/schema-reference.md)** - Class database models
- **[Implementation Guides](class-system/)** - Class features, spellcasting, BAB/saves

#### **Race System** (`race-system/`)
- **[Overview](race-system/README.md)** - Race definitions and racial features
- **[Schema Reference](race-system/schema-reference.md)** - Race database models
- **[Implementation Guides](race-system/)** - Racial traits, ability adjustments

### **Supporting Systems**

#### **Spell System** (`spell-system/`)
- **[Overview](spell-system/README.md)** - Spell definitions and mechanics
- **[Schema Reference](spell-system/schema-reference.md)** - Spell database models
- **[Implementation Guides](spell-system/)** - Spell preparation, metamagic

#### **Equipment System** (`equipment-system/`)
- **[Overview](equipment-system/README.md)** - Items, weapons, armor
- **[Schema Reference](equipment-system/schema-reference.md)** - Equipment database models
- **[Implementation Guides](equipment-system/)** - Item properties, templates

#### **Reference Data** (`reference-data/`)
- **[Overview](reference-data/README.md)** - Skills, feats, source books
- **[Schema Reference](reference-data/schema-reference.md)** - Reference database models
- **[Implementation Guides](reference-data/)** - Skill system, feat system

#### **User Management** (`user-management/`)
- **[Overview](user-management/README.md)** - User accounts and preferences
- **[Schema Reference](user-management/schema-reference.md)** - User database models
- **[Implementation Guides](user-management/)** - Authentication, dice configuration

### **Technical Infrastructure**

#### **Frontend Components** (`frontend-components/`)
- **[Overview](frontend-components/README.md)** - Reusable React components
- **[ValidatedForm System](frontend-components/validated-form-system.md)** - Form validation
- **[GenericList System](frontend-components/generic-list-system.md)** - List components
- **[API Integration](frontend-components/api-integration-patterns.md)** - API patterns

#### **Backend Patterns** (`backend/`)
- **[Backend Patterns](backend/backend-patterns.md)** - Service layer and controllers
- **Service Architecture** - Business logic organization
- **Middleware Patterns** - Authentication and error handling

#### **API Design** (`api/`)
- **[API Design Standards](api/api-design-standards.md)** - RESTful conventions
- **Request/Response Patterns** - Standard formats and validation
- **Authentication & Authorization** - Security patterns

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
   - Read [Feature System Overview](feature-system/README.md)
   - Understand the core concepts and architecture
   - Review [Implementation Examples](feature-system/class-features.md)

2. **Learn the Frontend Patterns**
   - Study [ValidatedForm System](frontend-components/validated-form-system.md)
   - Review [GenericList System](frontend-components/generic-list-system.md)
   - Understand [API Integration](frontend-components/api-integration-patterns.md)

3. **Explore Backend Architecture**
   - Read [Backend Patterns](backend/backend-patterns.md)
   - Understand service layer organization
   - Review [API Design Standards](api/api-design-standards.md)

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
   - Use typedApi for all API calls
   - Follow service layer patterns for backend

3. **Reference Documentation**
   - Check system-specific docs for domain knowledge
   - Use component docs for UI patterns
   - Reference API docs for integration patterns

---

**Related Documentation**:
- [Feature System](feature-system/README.md) - Core game engine
- [Frontend Components](frontend-components/README.md) - UI patterns
- [Backend Patterns](backend/backend-patterns.md) - Service architecture
- [API Design Standards](api/api-design-standards.md) - Integration patterns
- [Project Management](../project-mgmt/README.md) - Implementation status
