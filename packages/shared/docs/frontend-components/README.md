# Frontend Components System

*Complete documentation for reusable React components, form validation, and UI patterns in D&D Tools.*

## 📋 **Quick Navigation**

### **Getting Started**
- **[validated-form-system.md](validated-form-system.md)** — Form validation and form components
- **[generic-list-system.md](generic-list-system.md)** — Generic list and table components
- **[dice-box-components.md](dice-box-components.md)** — Dice box and dice rolling components
- **[layout-components.md](layout-components.md)** — Layout and navigation components

### **Component Architecture**
- **[component-patterns.md](component-patterns.md)** — React component patterns and best practices
- **[state-management.md](state-management.md)** — State management patterns and hooks

## 🎯 **System Overview**

The frontend components system provides a comprehensive set of reusable React components for building the D&D Tools user interface. This includes form validation, generic lists, dice box functionality, and layout components.

> **💡 See [System Overview](../system-overview.md) for how frontend components integrate with the broader architecture.**

### **Core Architecture**
```
ValidatedForm (Form Validation System)
├── FormComponents (Input Components)
├── SliderControl (Slider Input)
└── Validation Schemas (Zod Validation)

GenericList (List and Table System)
├── FilterTooltipUtils (Filtering)
├── UsePersistentTableState (State Management)
├── FloatingTextInput (Search Input)
└── ColumnUtils (Column Configuration)

DiceBox (Dice Rolling System)
├── DiceBoxManager (Dice Management)
├── DiceButton (Dice Controls)
├── DiceResultRenderer (Result Display)
└── DiceBoxProvider (Context Provider)

Layout (Layout System)
├── ToastProvider (Notifications)
├── GenericToast (Toast Components)
└── Layout (Main Layout)
```

### **Key Principles**
- **Reusable Components**: Components are designed for reuse across the application
- **Type Safety**: Full TypeScript integration with proper type definitions
- **Validation**: Comprehensive form validation using Zod schemas
- **State Management**: Consistent state management patterns
- **Accessibility**: Components follow accessibility best practices

## 🚀 **Getting Started**

### **For New Team Members**
1. Start with **[validated-form-system.md](validated-form-system.md)** for form handling
2. Review **[generic-list-system.md](generic-list-system.md)** for list components
3. Study **[component-patterns.md](component-patterns.md)** for React patterns
4. Use **[state-management.md](state-management.md)** for state handling

### **For Component Implementation**
1. **Use validated forms** following **[validated-form-system.md](validated-form-system.md)**
2. **Implement lists** using **[generic-list-system.md](generic-list-system.md)**
3. **Add dice functionality** as shown in **[dice-box-components.md](dice-box-components.md)**
4. **Follow patterns** from **[component-patterns.md](component-patterns.md)**

## 📚 **Documentation Structure**

### **Component Guides** (~200-300 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[validated-form-system.md](validated-form-system.md)** | Form validation and components | ~300 |
| **[generic-list-system.md](generic-list-system.md)** | Generic list and table components | ~250 |
| **[dice-box-components.md](dice-box-components.md)** | Dice box and rolling components | ~300 |
| **[layout-components.md](layout-components.md)** | Layout and navigation components | ~200 |

### **Architecture Guides** (~150-200 lines each)
| Document | Purpose | Lines |
|----------|---------|-------|
| **[component-patterns.md](component-patterns.md)** | React component patterns | ~200 |
| **[state-management.md](state-management.md)** | State management patterns | ~200 |

## 🎯 **Key Capabilities**

- ✅ **Comprehensive form validation** with Zod schemas and error handling
- ✅ **Generic list system** with filtering, sorting, and pagination
- ✅ **Advanced dice box** with 3D physics and customization
- ✅ **Layout components** for consistent UI structure
- ✅ **Type-safe components** with full TypeScript integration
- ✅ **Accessible components** following WCAG guidelines

## 📈 **System Status**

- **Current Coverage**: 90% of frontend component features
- **Target Coverage**: 95%+ with planned enhancements
- **Type Safety**: Complete TypeScript integration
- **Documentation Status**: Comprehensive and AI-friendly

## 🔧 **Quick Examples**

### **Validated Form**
```typescript
import { ValidatedForm, FormComponents } from '@/components/forms';

const CharacterForm = () => {
    const schema = z.object({
        name: z.string().min(1, "Name is required"),
        level: z.number().min(1).max(20),
        classId: z.number().positive()
    });

    return (
        <ValidatedForm schema={schema} onSubmit={handleSubmit}>
            <FormComponents.TextInput name="name" label="Character Name" />
            <FormComponents.NumberInput name="level" label="Level" />
            <FormComponents.Select name="classId" label="Class" options={classes} />
        </ValidatedForm>
    );
};
```

### **Generic List**
```typescript
import { GenericList } from '@/components/generic-list';

const CharacterList = () => {
    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'level', label: 'Level', sortable: true },
        { key: 'class', label: 'Class', sortable: true }
    ];

    return (
        <GenericList
            data={characters}
            columns={columns}
            onRowClick={handleCharacterSelect}
            searchable={true}
            sortable={true}
        />
    );
};
```

### **Dice Box**
```typescript
import { DiceBox, DiceButton } from '@/components/dice-box';

const DiceRoller = () => {
    return (
        <DiceBox>
            <DiceButton sides={20} label="d20" />
            <DiceButton sides={6} label="d6" />
            <DiceButton sides={100} label="d%" />
        </DiceBox>
    );
};
```

For complete examples, see **[validated-form-system.md](validated-form-system.md)** and **[generic-list-system.md](generic-list-system.md)**.

---

**Related Documentation**:
- **[System Overview](../system-overview.md)** - How frontend components fit into the broader architecture
- **[ValidatedForm System](validated-form-system.md)** - Form validation and integration patterns
- **[GenericList System](generic-list-system.md)** - List component integration
- **[API Integration](api-integration-patterns.md)** - Frontend-backend communication patterns
- **[Backend Patterns](../backend/backend-patterns.md)** - Corresponding backend service patterns
