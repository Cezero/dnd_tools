# User Management Validation Schemas

*Zod validation schemas for user authentication, profile management, and user-specific configurations.*

## 📋 **Schema Overview**

The User Management System uses comprehensive Zod validation schemas to ensure type safety and data integrity across all user-related operations. These schemas provide runtime validation, TypeScript type inference, and clear error messages for user inputs.

**Source File**: `shared/schema/src/auth.ts`

## 🔐 **Authentication Schemas**

### **RegisterUserSchema**
**Purpose**: Validates user registration data during account creation.

**Schema Definition**:
```typescript
export const RegisterUserSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email must be less than 255 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be less than 100 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});
```

**Validation Rules**:
- **Username**: 3-50 characters, alphanumeric + underscores only
- **Email**: Valid email format, max 255 characters
- **Password**: 8-100 characters, must contain lowercase, uppercase, and number

**Usage**: User registration forms, API endpoints for account creation

### **LoginUserSchema**
**Purpose**: Validates user login credentials.

**Schema Definition**:
```typescript
export const LoginUserSchema = z.object({
    username: z.string()
        .min(1, 'Username is required'),
    password: z.string()
        .min(1, 'Password is required'),
});
```

**Validation Rules**:
- **Username**: Required, non-empty string
- **Password**: Required, non-empty string

**Usage**: User login forms, authentication API endpoints

### **AuthHeaderSchema**
**Purpose**: Validates JWT authorization headers.

**Schema Definition**:
```typescript
export const AuthHeaderSchema = z.object({
    authorization: z.string()
        .regex(/^Bearer\s+/, 'Authorization header must start with "Bearer "')
        .min(7, 'Authorization header is too short'),
});
```

**Validation Rules**:
- **Authorization**: Must start with "Bearer " followed by JWT token
- **Format**: Standard Bearer token format for JWT authentication

**Usage**: API middleware for JWT token validation

## 👤 **User Profile Schemas**

### **AuthUserSchema**
**Purpose**: Base schema for authentication user data (minimal data for JWT tokens).

**Schema Definition**:
```typescript
export const AuthUserSchema = z.object({
    id: z.number(),
    username: z.string(),
    isAdmin: z.boolean(),
});
```

**Validation Rules**:
- **id**: Positive integer user ID
- **username**: Non-empty string
- **isAdmin**: Boolean admin flag

**Usage**: JWT token payload, authentication context

### **UserProfileSchema**
**Purpose**: Complete user profile data including all user fields.

**Schema Definition**:
```typescript
export const UserProfileSchema = z.object({
    id: z.number(),
    username: z.string(),
    isAdmin: z.boolean(),
    email: z.string(),
    preferredEditionId: z.number().nullable(),
    diceConfigBase: z.number().nullable(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).default([]),
});
```

**Validation Rules**:
- **id**: Positive integer user ID
- **username**: Non-empty string
- **isAdmin**: Boolean admin flag
- **email**: Valid email format
- **preferredEditionId**: Positive integer or null
- **diceConfigBase**: Positive integer or null
- **diceConfigOverrides**: Array of dice configuration overrides

**Usage**: User profile responses, complete user data

### **UpdateUserProfileSchema**
**Purpose**: Validates user profile update requests.

**Schema Definition**:
```typescript
export const UpdateUserProfileSchema = z.object({
    preferredEditionId: z.number().int().positive().optional(),
    diceConfigBase: z.number().int().positive().optional(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).optional(),
});
```

**Validation Rules**:
- **preferredEditionId**: Optional positive integer
- **diceConfigBase**: Optional positive integer
- **diceConfigOverrides**: Optional array of dice configuration overrides

**Usage**: Profile update forms, API endpoints for profile modifications

## 🎲 **DiceBox Configuration Schemas**

### **UserDiceConfigSchema**
**Purpose**: Validates user dice configuration data.

**Schema Definition**:
```typescript
export const UserDiceConfigSchema = z.object({
    diceConfigBase: z.number().nullable(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).default([])
});
```

**Validation Rules**:
- **diceConfigBase**: Positive integer or null
- **diceConfigOverrides**: Array of configuration overrides (defaults to empty)

**Usage**: DiceBox configuration management, user preferences

### **UserDiceConfigOverrideSchema**
**Purpose**: Validates individual dice configuration override entries.

**Schema Definition**:
```typescript
export const UserDiceConfigOverrideSchema = z.object({
    id: z.number().optional(),
    userId: z.number(),
    propertyName: z.string(),
    propertyValue: z.string(),
});
```

**Validation Rules**:
- **id**: Optional positive integer (for existing overrides)
- **userId**: Positive integer user ID
- **propertyName**: Non-empty string property name
- **propertyValue**: String value for the property

**Usage**: DiceBox configuration overrides, user customization

### **UpdateUserDiceConfigSchema**
**Purpose**: Validates dice configuration update requests.

**Schema Definition**:
```typescript
export const UpdateUserDiceConfigSchema = z.object({
    diceConfigBase: z.number().int().positive(),
    diceConfigOverrides: z.array(UserDiceConfigOverrideSchema).default([])
});
```

**Validation Rules**:
- **diceConfigBase**: Required positive integer
- **diceConfigOverrides**: Array of configuration overrides (defaults to empty)

**Usage**: DiceBox configuration updates, user preference changes

## 🔑 **JWT Token Schemas**

### **JwtPayloadSchema**
**Purpose**: Validates JWT token payload structure.

**Schema Definition**:
```typescript
export const JwtPayloadSchema = AuthUserSchema.extend({
    iat: z.number(),
    exp: z.number(),
});
```

**Validation Rules**:
- **Extends AuthUserSchema**: Includes id, username, isAdmin
- **iat**: Issued at timestamp (number)
- **exp**: Expiration timestamp (number)

**Usage**: JWT token validation, token payload verification

## 📤 **Response Schemas**

### **AuthServiceResultSchema**
**Purpose**: Validates authentication service operation results.

**Schema Definition**:
```typescript
export const AuthServiceResultSchema = z.object({
    success: z.boolean(),
    error: z.string().nullable(),
    token: z.string().nullable(),
    user: UserProfileSchema.nullable(),
});
```

**Validation Rules**:
- **success**: Boolean operation result
- **error**: Error message string or null
- **token**: JWT token string or null
- **user**: User profile data or null

**Usage**: Authentication service responses, login/register results

### **UserProfileResponseSchema**
**Purpose**: Validates user profile response data.

**Schema Definition**:
```typescript
export const UserProfileResponseSchema = UserProfileSchema;
```

**Validation Rules**: Same as UserProfileSchema

**Usage**: User profile API responses

### **UserProfileUpdateResponseSchema**
**Purpose**: Validates user profile update response data.

**Schema Definition**:
```typescript
export const UserProfileUpdateResponseSchema = z.object({
    message: z.string(),
    user: UserProfileResponseSchema,
    token: z.string(),
});
```

**Validation Rules**:
- **message**: Success/error message string
- **user**: Updated user profile data
- **token**: New JWT token with updated data

**Usage**: Profile update API responses

## 🔧 **Parameter Schemas**

### **UserProfileIdParamSchema**
**Purpose**: Validates user ID parameters from URL routes.

**Schema Definition**:
```typescript
export const UserProfileIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});
```

**Validation Rules**:
- **id**: String that can be transformed to positive integer

**Usage**: URL parameter validation, route handlers

## 📝 **Type Inference**

### **Request Types**
```typescript
export type RegisterUserRequest = z.infer<typeof RegisterUserSchema>;
export type LoginUserRequest = z.infer<typeof LoginUserSchema>;
export type AuthHeaderRequest = z.infer<typeof AuthHeaderSchema>;
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export type UpdateUserDiceConfigRequest = z.infer<typeof UpdateUserDiceConfigSchema>;
export type UserProfileIdParamRequest = z.infer<typeof UserProfileIdParamSchema>;
```

### **Response Types**
```typescript
export type AuthServiceResult = z.infer<typeof AuthServiceResultSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
export type UserProfileUpdateResponse = z.infer<typeof UserProfileUpdateResponseSchema>;
```

### **User Types**
```typescript
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserDiceConfig = z.infer<typeof UserDiceConfigSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
```

## 🔄 **Validation Patterns**

### **Common Validation Patterns**
Follows [Validation Schema Patterns](../application-overview/validation-schemas.md#common-validation-patterns)

### **Required vs Optional Fields**
- **Required fields**: Use `.positive()` or `.min(1)` for IDs
- **Optional fields**: Use `.nullable()` or `.optional()`
- **Never use `.partial()`** on required fields

### **Schema Extension**
- **Use `.extend()`** to add fields to existing schemas
- **Use `.omit()`** to remove fields from existing schemas
- **Avoid inline `z.object()`** - create named schemas instead

### **Error Messages**
- **Clear and specific**: Provide helpful error messages for users
- **Consistent format**: Use consistent error message patterns
- **User-friendly**: Avoid technical jargon in user-facing messages

## 🎯 **Usage Examples**

### **User Registration Validation**
```typescript
import { RegisterUserSchema } from '@shared/schema';

const userData = {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123'
};

const result = RegisterUserSchema.safeParse(userData);
if (result.success) {
    // Valid data - proceed with registration
    const validatedData = result.data;
} else {
    // Validation errors
    console.log(result.error.errors);
}
```

### **JWT Token Validation**
```typescript
import { JwtPayloadSchema } from '@shared/schema';

const tokenPayload = {
    id: 1,
    username: 'john_doe',
    isAdmin: false,
    iat: 1234567890,
    exp: 1234567890 + 3600
};

const result = JwtPayloadSchema.safeParse(tokenPayload);
if (result.success) {
    // Valid token payload
    const validatedPayload = result.data;
} else {
    // Invalid token payload
    console.log(result.error.errors);
}
```

### **Profile Update Validation**
```typescript
import { UpdateUserProfileSchema } from '@shared/schema';

const profileUpdate = {
    preferredEditionId: 1,
    diceConfigBase: 2,
    diceConfigOverrides: [
        { userId: 1, propertyName: 'theme', propertyValue: '2' }
    ]
};

const result = UpdateUserProfileSchema.safeParse(profileUpdate);
if (result.success) {
    // Valid profile update data
    const validatedData = result.data;
} else {
    // Validation errors
    console.log(result.error.errors);
}
```

## 🔗 **Cross-System References**

### **Related Validation Schemas**
- **[DiceBox Validation Schemas](../dicebox-system/validation-schemas.md)** - DiceBox configuration validation
- **[Character Validation Schemas](../character-management/validation-schemas.md)** - Character data validation
- **[Common Validation Schemas](../application-overview/validation-schemas.md)** - Shared validation patterns

### **Integration Points**
- **Authentication Middleware**: Uses AuthHeaderSchema for JWT validation
- **Profile Management**: Uses UpdateUserProfileSchema for profile updates
- **DiceBox Integration**: Uses UserDiceConfigSchema for configuration management
- **Character Integration**: Uses UserProfileSchema for user data

## Summary

The User Management validation schemas provide comprehensive type safety and data validation for all user-related operations. The schemas follow established patterns, provide clear error messages, and ensure data integrity across the authentication and profile management systems.

Key features include:
- **Comprehensive Validation**: All user inputs are validated with clear rules
- **Type Safety**: Full TypeScript type inference from Zod schemas
- **Error Handling**: Clear and user-friendly error messages
- **Security**: Proper validation of authentication data and JWT tokens
- **Extensibility**: Easy to extend and modify for new requirements

The validation system ensures data integrity while providing excellent developer experience through TypeScript integration and clear error reporting.
