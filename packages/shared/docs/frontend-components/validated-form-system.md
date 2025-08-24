# Validated Form System

*Complete documentation for form validation, form components, and form patterns in D&D Tools.*

## Overview

The ValidatedForm system is the primary solution for building forms in D&D Tools. It provides a complete, type-safe form handling system that automatically validates user input, manages form state, and provides consistent error handling across the application.

Think of ValidatedForm as a smart form builder that knows how to validate your data. You define what your form should look like and what rules the data should follow - it handles all the validation, error display, and form state management automatically.

## Core Concepts

### What ValidatedForm Does

ValidatedForm transforms your form requirements into a fully functional, validated form with these built-in capabilities:

- **Automatic Validation**: Validates user input as they type or when they leave a field
- **Type Safety**: Ensures your form data matches your expected types
- **Error Display**: Shows validation errors in real-time with clear messages
- **Form State Management**: Keeps track of all form data and validation state
- **Nested Data Support**: Handles complex nested form structures
- **Accessibility**: Provides proper labels, error associations, and keyboard navigation
- **Dark Mode Support**: Automatically adapts to your theme

### How It Works

1. **Schema Definition**: You define a Zod schema that describes your form's data structure and validation rules
2. **Form Setup**: You create a form with the schema and initial data
3. **Field Components**: You add input components that automatically connect to the validation system
4. **User Interaction**: As users interact with the form, validation happens automatically
5. **Submission**: When the form is submitted, you get validated, type-safe data

The system automatically manages the complex state of form data, validation errors, and user interactions, so you don't have to write that logic yourself.

## Getting Started

### Basic Setup

To create a simple validated form, you need three things:

1. **A Zod schema** that defines your data structure and validation rules
2. **Form state management** using the `useValidatedForm` hook
3. **Form components** that connect to the validation system

Here's the minimal setup:

```typescript
import { ValidatedForm, ValidatedInput, useValidatedForm } from '@/components/forms';
import { z } from 'zod';

const MyForm = () => {
    // Define your validation schema
    const schema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        age: z.number().min(18, "Must be at least 18 years old")
    });

    // Set up form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: 18
    });

    const { formData, setFormData, validation } = useValidatedForm(
        schema,
        formData,
        setFormData
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validation.validateForm(formData)) {
            console.log('Form is valid:', formData);
        }
    };

    return (
        <ValidatedForm
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
            validation={validation}
        >
            <ValidatedInput
                field="name"
                label="Name"
                type="text"
                required
            />
            <ValidatedInput
                field="email"
                label="Email"
                type="email"
                required
            />
            <ValidatedInput
                field="age"
                label="Age"
                type="number"
                min={18}
                required
            />
            <button type="submit">Submit</button>
        </ValidatedForm>
    );
};
```

That's it! You now have a fully functional form with automatic validation, error display, and type safety.

## Schema Definition

### Understanding Zod Schemas

Zod schemas define both the structure of your data and the validation rules it must follow. They serve as a contract between your form and your application logic.

### Basic Schema Types

#### String Validation
```typescript
const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    description: z.string().max(500, "Description too long")
});
```

#### Number Validation
```typescript
const schema = z.object({
    age: z.number().min(18, "Must be at least 18"),
    level: z.number().min(1).max(20, "Level must be between 1 and 20"),
    strength: z.number().positive("Strength must be positive")
});
```

#### Boolean Validation
```typescript
const schema = z.object({
    isActive: z.boolean(),
    hasPermission: z.boolean().refine(val => val, "Permission required")
});
```

#### Complex Validation
```typescript
const schema = z.object({
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain uppercase letter")
        .regex(/[0-9]/, "Password must contain number"),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});
```

### Schema Best Practices

1. **Use descriptive error messages**: Help users understand what went wrong
2. **Validate at the right level**: Don't over-validate simple fields
3. **Group related validations**: Use `.refine()` for complex cross-field validation
4. **Keep schemas reusable**: Define schemas that can be used across multiple forms

## Form Components

### Understanding Form Components

Form components are the building blocks of your validated forms. Each component automatically connects to the validation system and provides appropriate input handling for different data types.

### ValidatedInput Component

The `ValidatedInput` component is the most versatile form component, supporting multiple input types:

#### Text Inputs
```typescript
<ValidatedInput
    field="name"
    label="Character Name"
    type="text"
    required
    placeholder="Enter character name"
/>
```

#### Number Inputs
```typescript
<ValidatedInput
    field="level"
    label="Level"
    type="number"
    min={1}
    max={20}
    required
/>
```

#### Email Inputs
```typescript
<ValidatedInput
    field="email"
    label="Email Address"
    type="email"
    required
    placeholder="user@example.com"
/>
```

#### Text Areas
```typescript
<ValidatedInput
    field="description"
    label="Description"
    type="textarea"
    rows={4}
    placeholder="Enter description..."
/>
```

### ValidatedCustomSelect Component

For dropdown selections with predefined options:

```typescript
<ValidatedCustomSelect
    field="classId"
    label="Character Class"
    options={[
        { value: 1, label: 'Fighter' },
        { value: 2, label: 'Wizard' },
        { value: 3, label: 'Cleric' }
    ]}
    required
    placeholder="Select a class"
/>
```

### Component Props Explained

#### Common Props
- **`field`**: The name of the field in your form data (must match schema)
- **`label`**: The display label for the field
- **`required`**: Whether the field is required (shows asterisk)
- **`disabled`**: Whether the field is disabled
- **`placeholder`**: Placeholder text for the input

#### Styling Props
- **`componentExtraClassName`**: Additional CSS classes for the component wrapper
- **`labelExtraClassName`**: Additional CSS classes for the label
- **`inputExtraClassName`**: Additional CSS classes for the input element

#### Advanced Props
- **`nested`**: Whether this field accesses nested data (e.g., "user.profile.name")
- **`min`/`max`**: For number inputs, the minimum and maximum values
- **`rows`**: For textarea inputs, the number of rows to display

## Validation System

### How Validation Works

The validation system provides real-time feedback to users as they interact with the form:

1. **Field-Level Validation**: Each field validates its own value
2. **Form-Level Validation**: The entire form validates when submitted
3. **Error Display**: Errors appear immediately below the relevant field
4. **State Management**: Validation state is automatically managed

### Validation Triggers

Validation can be triggered in several ways:

- **On Change**: Validates as the user types (configurable)
- **On Blur**: Validates when the user leaves a field
- **On Submit**: Validates the entire form before submission
- **Manual**: You can trigger validation programmatically

### Validation Options

You can configure when validation happens:

```typescript
const { formData, setFormData, validation } = useValidatedForm(
    schema,
    formData,
    setFormData,
    {
        validateOnChange: true,  // Validate as user types
        validateOnBlur: true,    // Validate when field loses focus
        debounceMs: 300         // Wait 300ms after typing before validating
    }
);
```

### Error Handling

#### Field Errors
Field errors appear automatically below the input field:

```typescript
<ValidatedInput
    field="email"
    label="Email"
    type="email"
    // Error will appear automatically if validation fails
/>
```

#### Form Errors
Form-level errors appear at the bottom of the form:

```typescript
<ValidatedForm
    onSubmit={handleSubmit}
    formData={formData}
    setFormData={setFormData}
    validation={validation}
    validationState={validation.validationState} // Shows form-level errors
>
    {/* Form fields */}
</ValidatedForm>
```

## Form State Management

### Understanding Form State

Form state includes all the data users enter, validation errors, and the current state of the form. The ValidatedForm system manages this automatically.

### State Structure

```typescript
// Form data - what users have entered
const formData = {
    name: "Gandalf",
    level: 20,
    classId: 2
};

// Validation state - errors and validation status
const validationState = {
    errors: {
        name: "Name is required"
    },
    isValid: false,
    hasErrors: true
};
```

### State Updates

Form state updates automatically as users interact with the form:

```typescript
// When user types in name field
setFormData(prev => ({
    ...prev,
    name: "New Name"
}));

// Validation automatically runs and updates validation state
```

### Nested Data Support

The system supports complex nested data structures:

```typescript
// Schema with nested data
const schema = z.object({
    user: z.object({
        profile: z.object({
            name: z.string().min(1, "Name is required"),
            email: z.string().email("Invalid email")
        })
    })
});

// Form data with nested structure
const formData = {
    user: {
        profile: {
            name: "John",
            email: "john@example.com"
        }
    }
};

// Access nested fields in components
<ValidatedInput
    field="user.profile.name"
    label="Name"
    nested={true}
/>
```

## Advanced Features

### Custom Validation

You can add custom validation logic beyond what Zod provides:

```typescript
const schema = z.object({
    username: z.string().min(3, "Username too short"),
    password: z.string().min(8, "Password too short")
}).refine(data => {
    // Custom validation logic
    return data.password !== data.username;
}, {
    message: "Password cannot be the same as username",
    path: ["password"]
});
```

### Conditional Validation

You can make validation conditional based on other field values:

```typescript
const schema = z.object({
    hasEmail: z.boolean(),
    email: z.string().email("Invalid email").optional()
}).refine(data => {
    if (data.hasEmail) {
        return data.email && data.email.length > 0;
    }
    return true;
}, {
    message: "Email is required when 'Has Email' is checked",
    path: ["email"]
});
```

### Dynamic Form Fields

You can show/hide fields based on form state:

```typescript
const MyForm = () => {
    const [formData, setFormData] = useState({
        hasEmail: false,
        email: ''
    });

    return (
        <ValidatedForm
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
            validation={validation}
        >
            <ValidatedInput
                field="hasEmail"
                label="Has Email"
                type="checkbox"
            />
            
            {formData.hasEmail && (
                <ValidatedInput
                    field="email"
                    label="Email Address"
                    type="email"
                    required
                />
            )}
        </ValidatedForm>
    );
};
```

### Form Submission

#### Basic Submission
```typescript
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validation.validateForm(formData)) {
        // Form is valid, proceed with submission
        submitForm(formData);
    }
    // If validation fails, errors will be displayed automatically
};
```

#### Async Submission
```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validation.validateForm(formData)) {
        try {
            setIsLoading(true);
            await submitForm(formData);
            // Handle success
        } catch (error) {
            // Handle error
        } finally {
            setIsLoading(false);
        }
    }
};
```

## Best Practices

### Schema Design

1. **Start simple**: Begin with basic validation and add complexity as needed
2. **Use meaningful error messages**: Help users understand what went wrong
3. **Validate at the right level**: Don't over-validate simple fields
4. **Group related validations**: Use `.refine()` for complex cross-field validation

### Form Structure

1. **Logical grouping**: Group related fields together
2. **Clear labels**: Use descriptive, user-friendly labels
3. **Required indicators**: Clearly mark required fields with asterisks
4. **Helpful placeholders**: Provide examples or guidance in placeholders

### User Experience

1. **Immediate feedback**: Validate on change or blur for quick feedback
2. **Clear error messages**: Make error messages specific and actionable
3. **Accessibility**: Ensure forms work with screen readers and keyboard navigation
4. **Loading states**: Show loading indicators during form submission

### Performance

1. **Debounce validation**: Use debouncing for expensive validation operations
2. **Memoize schemas**: Don't recreate schemas on every render
3. **Efficient validation**: Only validate what's necessary
4. **Lazy validation**: Consider validating on blur rather than change for complex fields

## Common Patterns

### Edit Form Pattern

For forms that edit existing data:

```typescript
const EditForm = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState(initialData);
    
    useEffect(() => {
        if (id !== 'new') {
            fetchData(id).then(setFormData);
        }
    }, [id]);

    const { formData, setFormData, validation } = useValidatedForm(
        schema,
        formData,
        setFormData
    );

    return (
        <ValidatedForm
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
            validation={validation}
        >
            {/* Form fields */}
        </ValidatedForm>
    );
};
```

### Multi-Step Form Pattern

For complex forms with multiple steps:

```typescript
const MultiStepForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialData);

    const { formData, setFormData, validation } = useValidatedForm(
        schema,
        formData,
        setFormData
    );

    const handleNext = () => {
        if (validation.validateForm(formData)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <ValidatedForm
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
            validation={validation}
        >
            {currentStep === 1 && (
                <div>
                    <ValidatedInput field="name" label="Name" />
                    <ValidatedInput field="email" label="Email" />
                    <button type="button" onClick={handleNext}>Next</button>
                </div>
            )}
            
            {currentStep === 2 && (
                <div>
                    <ValidatedInput field="address" label="Address" />
                    <button type="submit">Submit</button>
                </div>
            )}
        </ValidatedForm>
    );
};
```

### Form with Custom Components

For forms that need custom input components:

```typescript
const CustomForm = () => {
    const { formData, setFormData, validation } = useValidatedForm(
        schema,
        formData,
        setFormData
    );

    return (
        <ValidatedForm
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
            validation={validation}
        >
            <ValidatedInput field="name" label="Name" />
            
            {/* Custom component that uses form context */}
            <CustomDatePicker
                field="birthDate"
                label="Birth Date"
                value={formData.birthDate}
                onChange={(value) => setFormData(prev => ({ ...prev, birthDate: value }))}
                error={validation.getError('birthDate')}
            />
        </ValidatedForm>
    );
};
```

## Troubleshooting

### Common Issues

**Validation not working**: Make sure your field names match the schema exactly.

**Errors not displaying**: Check that you're using the validation state in your ValidatedForm component.

**Form not submitting**: Ensure your submit handler calls `e.preventDefault()` and checks validation.

**Nested fields not working**: Set `nested={true}` on components that access nested data.

### Debugging Tips

1. **Check console logs**: Look for validation errors in the browser console
2. **Verify schema**: Ensure your Zod schema matches your expected data structure
3. **Test validation manually**: Use `validation.validateForm(data)` to test validation
4. **Check field names**: Ensure field names in components match schema field names
5. **Inspect form state**: Use React DevTools to inspect form data and validation state

The ValidatedForm system is designed to handle most common form scenarios automatically, but understanding these concepts will help you configure it effectively for your specific needs.
