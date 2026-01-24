# User Management Backend Implementation

*Backend services, controllers, and API endpoints for user authentication and profile management.*

## 📋 **Implementation Overview**

The User Management backend implementation provides secure authentication services, profile management, and user-specific configuration handling. The implementation follows established backend patterns with proper separation of concerns, error handling, and type safety.

**Source Files**:
- `backend/src/features/auth/` - Authentication services and controllers
- `backend/src/features/userProfile/` - Profile management services and controllers

## 🔐 **Authentication System**

### **AuthService**
**Source File**: `backend/src/features/auth/authService.ts`

The AuthService provides user registration, login, and JWT token management functionality.

**Service Interface**:
```typescript
export interface AuthService {
    registerUser: (data: RegisterUserRequest) => Promise<AuthServiceResult>;
    loginUser: (data: LoginUserRequest) => Promise<AuthServiceResult>;
    getUserFromToken: (token: string) => Promise<AuthServiceResult>;
    refreshToken: (token: string) => Promise<AuthServiceResult>;
}
```

**Core Methods**:

#### **registerUser**
**Purpose**: Creates new user accounts with secure password hashing.

**Implementation**:
```typescript
async registerUser(data: RegisterUserRequest): Promise<AuthServiceResult> {
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: data.username },
                    { email: data.email }
                ]
            }
        });

        if (existingUser) {
            return { success: false, error: 'Username or email already exists', token: null, user: null };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: hashedPassword,
                isAdmin: false
            },
            include: {
                diceConfigOverrides: true
            }
        });

        // Generate JWT token
        const userForJwt = transformUserForJwt(user);
        const token = jwt.sign(userForJwt, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

        return { success: true, error: null, token, user };
    } catch (err) {
        console.error('Registration error:', err);
        return { success: false, error: 'Server error', token: null, user: null };
    }
}
```

**Key Features**:
- **Duplicate Prevention**: Checks for existing username/email before creation
- **Password Security**: Uses bcrypt with salt rounds for password hashing
- **JWT Generation**: Creates secure JWT tokens for session management
- **Error Handling**: Comprehensive error handling with user-friendly messages

#### **loginUser**
**Purpose**: Authenticates users and generates JWT tokens for valid credentials.

**Implementation**:
```typescript
async loginUser(data: LoginUserRequest): Promise<AuthServiceResult> {
    try {
        const user = await prisma.user.findFirst({
            where: { username: data.username },
            include: {
                diceConfigOverrides: true
            }
        });
        
        if (!user) {
            return { success: false, error: 'Invalid credentials', token: null, user: null };
        }

        const match = await bcrypt.compare(data.password, user.password);
        if (!match) {
            return { success: false, error: 'Invalid credentials', token: null, user: null };
        }

        const userForJwt = transformUserForJwt(user);
        const token = jwt.sign(userForJwt, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

        return { success: true, error: null, token, user };
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: 'Server error', token: null, user: null };
    }
}
```

**Key Features**:
- **Secure Authentication**: Uses bcrypt for password comparison
- **User Lookup**: Finds users by username with configuration data
- **JWT Generation**: Creates secure tokens for authenticated sessions
- **Security**: Generic error messages prevent credential enumeration

#### **getUserFromToken**
**Purpose**: Validates JWT tokens and retrieves current user data from the database.

**Architecture Decision**: Fetches user from database on each token validation to ensure the user data (including preferred_edition_id) is current, even if user profile changes after token issuance.

**Implementation**:
```typescript
async getUserFromToken(token: string): Promise<AuthServiceResult> {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        
        // Fetch user from DB to ensure current preferred_edition_id and other up-to-date info
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                diceConfigOverrides: true
            }
        });
        
        if (!user) {
            return { success: false, error: 'User not found', token: null, user: null };
        }
        
        return {
            success: true,
            error: null,
            token: null,
            user: user
        };
    } catch (err) {
        console.error('Token verification error:', err);
        return { success: false, error: 'Invalid or expired token', token: null, user: null };
    }
}
```

**Key Features**:
- **Token Validation**: Verifies JWT token signature and expiration
- **Database Lookup**: Fetches current user data to ensure freshness
- **Configuration Data**: Includes dice configuration overrides in response
- **Error Handling**: Returns clear error messages for invalid or expired tokens

#### **refreshToken**
**Purpose**: Generates a new JWT token with refreshed expiration and updated user data.

**Architecture Decision**: Refreshing tokens allows clients to extend sessions without requiring re-authentication, while ensuring tokens contain current user data (like preferred_edition_id).

**Implementation**:
```typescript
async refreshToken(token: string): Promise<AuthServiceResult> {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        
        // Fetch user from DB to get current preferred_edition_id for new token
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
                diceConfigBaseRef: true,
                diceConfigOverrides: true
            }
        });
        
        if (!user) {
            return { success: false, error: 'User not found for token refresh', token: null, user: null };
        }
        
        const userForJwt = transformUserForJwt(user);
        const newToken = jwt.sign(userForJwt, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
        
        return { success: true, error: null, token: newToken, user: user };
    } catch (err) {
        console.error('Token refresh error:', err);
        return { success: false, error: 'Invalid or expired token', token: null, user: null };
    }
}
```

**Key Features**:
- **Token Refresh**: Generates new token with extended expiration
- **Data Freshness**: Includes current user data in new token
- **Configuration Integration**: Includes dice configuration references
- **Error Handling**: Handles invalid tokens and missing users gracefully

### **AuthController**
**Source File**: `backend/src/features/auth/authController.ts`

The AuthController handles HTTP requests for authentication operations.

**Controller Methods**:

#### **registerUser**
**Purpose**: Handles user registration HTTP requests.

**Implementation**:
```typescript
export const registerUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.registerUser(req.body);
        
        if (result.success) {
            res.status(201).json({
                message: 'User registered successfully',
                token: result.token,
                user: result.user
            });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        console.error('Registration controller error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

#### **loginUser**
**Purpose**: Handles user login HTTP requests.

**Implementation**:
```typescript
export async function LoginUser(req: ValidatedBodyT<LoginUserRequest>, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Missing credentials' });
        return;
    }

    const result = await authService.loginUser({ username, password });

    if (!result.success) {
        res.status(401).json(result);
        return;
    }

    res.json(result);
}
```

#### **GetUserFromToken**
**Purpose**: Handles token validation and user retrieval requests.

**Implementation**:
```typescript
export async function GetUserFromToken(req: ValidatedHeadersT<AuthHeaderRequest, AuthServiceResult>, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.getUserFromToken(token);

    if (!result.success) {
        res.status(403).json(result);
        return;
    }

    res.json(result);
}
```

#### **RefreshToken**
**Purpose**: Handles token refresh requests.

**Implementation**:
```typescript
export async function RefreshToken(req: ValidatedHeadersT<AuthHeaderRequest, AuthServiceResult>, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.refreshToken(token);

    if (!result.success) {
        res.status(403).json(result);
        return;
    }

    res.json(result);
}
```

### **AuthRoutes**
**Source File**: `backend/src/features/auth/authRoutes.ts`

Defines authentication API endpoints with proper validation.

**Route Definitions**:
```typescript
import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { RegisterUserSchema, LoginUserSchema, AuthHeaderSchema } from '@shared/schema';

import { RegisterUser, LoginUser, GetUserFromToken, RefreshToken } from './authController.js';

const { router: AuthRouter, post, get } = buildValidatedRouter();

post('/register', { body: RegisterUserSchema }, RegisterUser);
post('/login', { body: LoginUserSchema }, LoginUser);
get('/me', { headers: AuthHeaderSchema }, GetUserFromToken);
post('/refresh-token', { headers: AuthHeaderSchema }, RefreshToken);

export { AuthRouter };
```

**API Endpoints**:
- **`POST /api/auth/register`**: User registration (public)
- **`POST /api/auth/login`**: User login (public)
- **`GET /api/auth/me`**: Get current user from token (authenticated)
- **`POST /api/auth/refresh-token`**: Refresh JWT token (authenticated)

## 👤 **User Profile System**

### **UserProfileService**
**Source File**: `backend/src/features/userProfile/userProfileService.ts`

The UserProfileService provides profile management and configuration handling.

**Service Interface Source**: `apps/backend/src/features/userProfile/types.ts` (`UserProfileService`).

**Core Methods**:

#### **getUserProfile**
**Purpose**: Retrieves complete user profile data including configuration overrides.

**Implementation**:
```typescript
async getUserProfile(userId: number): Promise<UserProfileResponse | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                diceConfigOverrides: true
            }
        });

        if (!user) return null;

        return user; // User object directly matches UserProfile schema
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}
```

**Key Features**:
- **Complete Data**: Includes all user fields and configuration overrides
- **Type Safety**: Returns data that matches UserProfile schema
- **Error Handling**: Graceful error handling with null returns

#### **updateUserProfile**
**Purpose**: Updates user profile data and generates new JWT tokens.

**Implementation**:
```typescript
async updateUserProfile(userId: number, data: UpdateUserProfileRequest): Promise<UserProfileUpdateResponse> {
    const { preferredEditionId, diceConfigBase, diceConfigOverrides } = data;

    // Prepare update data
    const updateData: { preferredEditionId?: number; diceConfigBase?: number } = {};
    if (preferredEditionId !== undefined) {
        updateData.preferredEditionId = preferredEditionId;
    }
    if (diceConfigBase !== undefined) {
        updateData.diceConfigBase = diceConfigBase;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
            diceConfigOverrides: true
        }
    });

    // Update dice configuration overrides if provided
    if (diceConfigOverrides !== undefined) {
        await DiceBoxService.updateUserDiceConfig(
            userId,
            diceConfigBase || updatedUser.diceConfigBase || 1,
            diceConfigOverrides
        );
    }

    // Get updated user with dice config
    const userWithDiceConfig = await this.getUserProfile(userId);

    if (!userWithDiceConfig) {
        throw new Error('Failed to retrieve updated user profile');
    }

    // Create new JWT token
    const userForJwt = {
        id: updatedUser.id,
        username: updatedUser.username,
        isAdmin: updatedUser.isAdmin
    };

    const newToken = jwt.sign(userForJwt, config.jwt.secret, { expiresIn: '12h' });

    return {
        message: 'User profile updated successfully',
        user: userWithDiceConfig,
        token: newToken
    };
}
```

**Key Features**:
- **Partial Updates**: Only updates provided fields
- **Configuration Integration**: Updates DiceBox configuration overrides
- **Token Refresh**: Generates new JWT tokens with updated data
- **Data Consistency**: Ensures updated data is properly retrieved

#### **verifyToken**
**Purpose**: Verifies JWT tokens and extracts user information.

**Implementation**:
```typescript
async verifyToken(token: string) {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as { id: number };
        return { success: true, userId: decoded.id };
    } catch (_error) {
        return { success: false, error: 'Invalid token' };
    }
}
```

**Key Features**:
- **Token Verification**: Validates JWT tokens using secret key
- **User Extraction**: Extracts user ID from valid tokens
- **Error Handling**: Returns clear success/error status

### **UserProfileController**
**Source File**: `backend/src/features/userProfile/userProfileController.ts`

The UserProfileController handles HTTP requests for profile management.

**Controller Methods**:

#### **getUserProfile**
**Purpose**: Handles user profile retrieval requests.

**Implementation**:
```typescript
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await userProfileService.getUserProfile(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

#### **updateUserProfile**
**Purpose**: Handles user profile update requests.

**Implementation**:
```typescript
export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const result = await userProfileService.updateUserProfile(userId, req.body);
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### **UserProfileRoutes**
**Source File**: `backend/src/features/userProfile/userProfileRoutes.ts`

Defines profile management API endpoints with authentication requirements.

**Route Definitions**:
```typescript
import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { UpdateUserProfileSchema } from '@shared/schema';

const router = buildValidatedRouter();

router.get('/profile', getUserProfile);

router.put('/profile', {
    body: UpdateUserProfileSchema
}, updateUserProfile);

export default router;
```

## 🔧 **Helper Functions**

### **transformUserForJwt**
**Purpose**: Transforms user data for JWT token generation.

**Implementation**:
```typescript
function transformUserForJwt(user: AuthUser): Omit<JwtPayload, 'iat' | 'exp'> {
    return {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
    };
}
```

**Key Features**:
- **Minimal Data**: Only includes essential authentication data
- **Type Safety**: Ensures proper JWT payload structure
- **Security**: Excludes sensitive information from tokens

## 🔐 **Security Implementation**

### **Password Security**
- **Hashing Algorithm**: bcrypt with 10 salt rounds
- **Password Requirements**: Minimum 8 characters, uppercase, lowercase, number
- **Storage**: Only hashed passwords stored in database

### **JWT Token Security**
- **Secret Key**: Configurable JWT secret from environment
- **Expiration**: Configurable token expiration (default: 12 hours)
- **Payload**: Minimal user data (id, username, isAdmin)
- **Verification**: Proper token verification in middleware

### **Input Validation**
- **Zod Schemas**: Comprehensive validation for all inputs
- **Type Safety**: Full TypeScript integration
- **Error Messages**: User-friendly validation errors

### **Error Handling**
- **Generic Errors**: Prevents information leakage
- **Logging**: Comprehensive error logging for debugging
- **Graceful Degradation**: Proper error responses

## 🔗 **Integration Points**

### **DiceBox Service Integration**
- **Configuration Updates**: Updates user dice configuration overrides
- **Base Configuration**: References DiceBoxAdminConfig for base settings
- **Override Management**: Handles user-specific configuration changes

### **Database Integration**
- **Prisma Client**: Type-safe database access
- **Transaction Support**: Ensures data consistency
- **Relationship Loading**: Includes related data (diceConfigOverrides)

### **Middleware Integration**
- **Authentication Middleware**: JWT token validation
- **Error Middleware**: Centralized error handling
- **Validation Middleware**: Request validation using Zod schemas

## 📊 **API Endpoints**

### **Authentication Endpoints**
- **`POST /api/auth/register`**: User registration (public)
- **`POST /api/auth/login`**: User login (public)
- **`GET /api/auth/me`**: Get current user from token (authenticated)
- **`POST /api/auth/refresh-token`**: Refresh JWT token (authenticated)

### **Profile Management Endpoints**
- **`GET /api/user/profile`**: Get user profile (authenticated)
- **`PUT /api/user/profile`**: Update user profile (authenticated)

### **Request/Response Examples**

#### **User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123"
}
```

**Response**:
```json
{
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "isAdmin": false,
        "preferredEditionId": null,
        "diceConfigBase": null,
        "diceConfigOverrides": []
    }
}
```

#### **User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "john_doe",
    "password": "SecurePass123"
}
```

**Response**:
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "isAdmin": false,
        "preferredEditionId": 1,
        "diceConfigBase": 1,
        "diceConfigOverrides": [
            {
                "id": 1,
                "userId": 1,
                "propertyName": "theme",
                "propertyValue": "2"
            }
        ]
    }
}
```

#### **Profile Update**
```http
PUT /api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "preferredEditionId": 2,
    "diceConfigBase": 1,
    "diceConfigOverrides": [
        {
            "userId": 1,
            "propertyName": "theme",
            "propertyValue": "3"
        }
    ]
}
```

**Response**:
```json
{
    "message": "User profile updated successfully",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "isAdmin": false,
        "preferredEditionId": 2,
        "diceConfigBase": 1,
        "diceConfigOverrides": [
            {
                "id": 1,
                "userId": 1,
                "propertyName": "theme",
                "propertyValue": "3"
            }
        ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🔄 **Error Handling**

### **Common Error Scenarios**
- **Duplicate Username/Email**: 400 Bad Request with clear error message
- **Invalid Credentials**: 401 Unauthorized with generic error message
- **Invalid Token**: 401 Unauthorized for authentication failures
- **User Not Found**: 404 Not Found for missing user data
- **Server Errors**: 500 Internal Server Error with logging

### **Error Response Format**
```json
{
    "error": "Error message description"
}
```

## Summary

The User Management backend implementation provides a robust, secure, and scalable foundation for user authentication and profile management. The implementation follows established patterns, provides comprehensive error handling, and ensures data integrity through proper validation and type safety.

Key strengths include:
- **Secure Authentication**: bcrypt password hashing and JWT token management
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Comprehensive error handling with proper logging
- **Integration Ready**: Seamless integration with DiceBox and other systems
- **Maintainable**: Clear separation of concerns and well-documented code

The implementation is designed to scale with the application and provides the necessary security and functionality for user management operations.
