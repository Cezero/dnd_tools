# User Management Frontend Components

*React components and user interface for authentication, profile management, and user-specific configurations.*

## 📋 **Component Overview**

The User Management frontend components provide a complete user interface for authentication, profile management, and user-specific configurations. The components use React with TypeScript, integrate with the authentication context, and provide a seamless user experience.

**Source Files**:
- `frontend/src/components/auth/` - Authentication components and context
- `frontend/src/components/profile/` - Profile management components

## 🔐 **Authentication Components**

### **AuthProvider**
**Source File**: `frontend/src/components/auth/AuthProvider.tsx`

The AuthProvider provides authentication context and state management for the entire application.

**Component Interface**:
```typescript
interface AuthContextType {
    user: AuthUser | null;
    Login: (username: string, password: string) => Promise<boolean>;
    Logout: () => void;
    isLoading: boolean;
    UpdatePreferredEdition: (editionId: number) => Promise<boolean>;
    UpdateUserProfile: (data: UpdateUserProfileRequest) => Promise<boolean>;
    userDiceConfig: UserDiceConfig | null;
    isLoadingDiceConfig: boolean;
    refreshDiceConfig: () => Promise<void>;
}
```

**Key Features**:
- **Authentication State**: Manages user authentication state across the application
- **JWT Token Management**: Handles token storage, validation, and automatic refresh
- **DiceBox Integration**: Manages user-specific dice configuration
- **Profile Updates**: Handles user profile updates with token refresh
- **Error Handling**: Comprehensive error handling and user feedback

**Core Methods**:

#### **Login**
**Purpose**: Authenticates users and establishes session.

**Implementation**:
```typescript
const Login = async (username: string, password: string): Promise<boolean> => {
    try {
        setIsLoading(true);
        const response = await AuthApi.login(username, password);
        
        if (response.success) {
            localStorage.setItem('token', response.token);
            setUser(response.user);
            
            // Set up token refresh
            setupTokenRefresh(response.token);
            
            return true;
        } else {
            console.error('Login failed:', response.error);
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        return false;
    } finally {
        setIsLoading(false);
    }
};
```

#### **Logout**
**Purpose**: Clears authentication state and removes tokens.

**Implementation**:
```typescript
const Logout = (): void => {
    localStorage.removeItem('token');
    setUser(null);
    setUserDiceConfig(null);
    
    if (refreshTokenTimeoutRef.current) {
        clearTimeout(refreshTokenTimeoutRef.current);
        refreshTokenTimeoutRef.current = null;
    }
};
```

#### **UpdateUserProfile**
**Purpose**: Updates user profile and refreshes authentication state.

**Implementation**:
```typescript
const UpdateUserProfile = async (data: UpdateUserProfileRequest): Promise<boolean> => {
    try {
        const response = await UserProfileApi.updateUserProfile(data);
        
        if (response.success) {
            // Update token and user data
            localStorage.setItem('token', response.token);
            setUser(response.user);
            
            // Refresh dice configuration
            await refreshDiceConfig();
            
            return true;
        } else {
            console.error('Profile update failed:', response.error);
            return false;
        }
    } catch (error) {
        console.error('Profile update error:', error);
        return false;
    }
};
```

### **LoginPage**
**Source File**: `frontend/src/components/auth/LoginPage.tsx`

The LoginPage component provides the user login interface with form validation and error handling.

**Component Features**:
- **Form Validation**: Zod validation for login credentials
- **Error Display**: Clear error messages for authentication failures
- **Loading States**: Visual feedback during authentication
- **Navigation**: Redirect to registration or dashboard
- **Responsive Design**: Works across different screen sizes

**Form Validation**:
```typescript
const loginSchema = LoginUserSchema.extend({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});
```

**Key Methods**:
- **handleSubmit**: Processes login form submission
- **handleInputChange**: Manages form input changes
- **validateForm**: Validates form data using Zod schemas

### **RegisterPage**
**Source File**: `frontend/src/components/auth/RegisterPage.tsx`

The RegisterPage component provides the user registration interface with comprehensive validation.

**Component Features**:
- **Form Validation**: Comprehensive validation for registration data
- **Password Requirements**: Visual feedback for password strength
- **Duplicate Detection**: Handles username/email conflicts
- **Auto-Login**: Automatically logs in after successful registration
- **Error Handling**: Clear error messages for validation failures

**Form Validation**:
```typescript
const registerSchema = RegisterUserSchema.extend({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
```

**Key Methods**:
- **handleSubmit**: Processes registration form submission
- **validatePassword**: Validates password strength requirements
- **handleInputChange**: Manages form input changes with validation

### **ProtectedRoute**
**Source File**: `frontend/src/components/auth/ProtectedRoute.tsx`

The ProtectedRoute component provides route protection for authenticated-only pages.

**Component Features**:
- **Authentication Check**: Verifies user authentication status
- **Loading States**: Shows loading indicator while checking auth
- **Redirect Logic**: Redirects unauthenticated users to login
- **Admin Protection**: Optional admin-only route protection

**Implementation**:
```typescript
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requireAdmin = false 
}) => {
    const { user, isLoading } = UseAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !user.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
```

## 👤 **Profile Management Components**

### **ProfilePage**
**Source File**: `frontend/src/components/profile/ProfilePage.tsx`

The ProfilePage component provides comprehensive profile management interface.

**Component Features**:
- **Profile Display**: Shows current user profile information
- **Edition Selection**: User's preferred D&D edition setting
- **DiceBox Configuration**: User-specific dice configuration management
- **Form Validation**: Comprehensive validation for profile updates
- **Real-time Updates**: Immediate feedback for configuration changes

**Profile Sections**:

#### **Basic Information**
- **Username**: Display-only username field
- **Email**: Display-only email field
- **Admin Status**: Display admin privileges (if applicable)

#### **Edition Preferences**
- **Preferred Edition**: Dropdown selection for D&D edition
- **Edition Description**: Information about selected edition
- **Content Availability**: Shows how edition affects available content

#### **DiceBox Configuration**
- **Base Configuration**: Selection from admin-configured templates
- **Custom Overrides**: User-specific configuration modifications
- **Live Preview**: Real-time preview of dice configuration
- **Reset Options**: Ability to reset to default configuration

**Key Methods**:
- **handleEditionChange**: Updates user's preferred edition
- **handleDiceConfigChange**: Updates dice configuration settings
- **handleOverrideChange**: Manages individual configuration overrides
- **saveProfile**: Saves all profile changes
- **resetConfiguration**: Resets configuration to defaults

### **UserProfileApi**
**Source File**: `frontend/src/components/profile/UserProfileApi.ts`

The UserProfileApi provides API communication for profile management operations.

**API Methods**:

#### **getUserProfile**
**Purpose**: Retrieves current user profile data.

**Implementation**:
```typescript
export const getUserProfile = async (): Promise<UserProfileResponse> => {
    const response = await api.get('/user/profile');
    return UserProfileResponseSchema.parse(response.data);
};
```

#### **updateUserProfile**
**Purpose**: Updates user profile with new data.

**Implementation**:
```typescript
export const updateUserProfile = async (data: UpdateUserProfileRequest): Promise<UserProfileUpdateResponse> => {
    const response = await api.put('/user/profile', data);
    return UserProfileUpdateResponseSchema.parse(response.data);
};
```

### **AuthApi**
**Source File**: `frontend/src/components/auth/AuthApi.ts`

The AuthApi provides API communication for authentication operations.

**API Methods**:

#### **login**
**Purpose**: Authenticates user with credentials.

**Implementation**:
```typescript
export const login = async (username: string, password: string): Promise<AuthServiceResult> => {
    const response = await api.post('/auth/login', { username, password });
    return AuthServiceResultSchema.parse(response.data);
};
```

#### **register**
**Purpose**: Creates new user account.

**Implementation**:
```typescript
export const register = async (data: RegisterUserRequest): Promise<AuthServiceResult> => {
    const response = await api.post('/auth/register', data);
    return AuthServiceResultSchema.parse(response.data);
};
```

## 🔧 **Utility Components**

### **useAuthAuto**
**Source File**: `frontend/src/components/auth/useAuthAuto.tsx`

Custom hook for automatic authentication state management.

**Features**:
- **Token Validation**: Automatically validates stored JWT tokens
- **State Restoration**: Restores authentication state on page load
- **Token Refresh**: Handles automatic token refresh
- **Error Recovery**: Handles authentication errors gracefully

### **useAdminAuth**
**Source File**: `frontend/src/components/auth/useAdminAuth.tsx`

Custom hook for admin-specific authentication checks.

**Features**:
- **Admin Verification**: Checks if current user has admin privileges
- **Route Protection**: Provides admin-only route protection
- **Permission Checking**: Validates admin permissions for actions

### **useRequireAuth**
**Source File**: `frontend/src/components/auth/useRequireAuth.tsx`

Custom hook for requiring authentication in components.

**Features**:
- **Authentication Requirement**: Ensures component only renders for authenticated users
- **Error Handling**: Throws errors for unauthenticated access
- **Loading States**: Handles authentication loading states

## 🎨 **UI/UX Features**

### **Form Validation**
- **Real-time Validation**: Immediate feedback for form inputs
- **Error Display**: Clear, user-friendly error messages
- **Success Feedback**: Positive feedback for successful operations
- **Loading States**: Visual indicators during async operations

### **Responsive Design**
- **Mobile Support**: Optimized for mobile devices
- **Tablet Support**: Responsive layout for tablet screens
- **Desktop Support**: Full-featured desktop interface
- **Accessibility**: WCAG compliant accessibility features

### **User Feedback**
- **Toast Notifications**: Success and error notifications
- **Loading Indicators**: Visual feedback during operations
- **Progress Indicators**: Progress tracking for long operations
- **Confirmation Dialogs**: Confirmation for destructive actions

## 🔗 **Integration Points**

### **Authentication Context Integration**
- **Global State**: Authentication state available throughout application
- **Token Management**: Automatic token storage and refresh
- **User Data**: User profile data accessible to all components
- **Configuration**: User-specific configurations available globally

### **DiceBox Integration**
- **Configuration Management**: User-specific dice configuration
- **Live Preview**: Real-time preview of configuration changes
- **Override System**: User-specific configuration overrides
- **Default Configuration**: Base configuration templates

### **Navigation Integration**
- **Route Protection**: Protected routes for authenticated users
- **Admin Routes**: Admin-only route protection
- **Redirect Logic**: Automatic redirects based on authentication state
- **Deep Linking**: Support for deep links with authentication

### **API Integration**
- **HTTP Client**: Centralized API communication
- **Error Handling**: Consistent error handling across API calls
- **Type Safety**: Full TypeScript integration with API responses
- **Validation**: Runtime validation of API responses

## 📱 **Component Usage Examples**

### **Basic Authentication Usage**
```typescript
import { UseAuth } from '@/components/auth';

function MyComponent() {
    const { user, Login, Logout, isLoading } = UseAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (user) {
        return (
            <div>
                <p>Welcome, {user.username}!</p>
                <button onClick={Logout}>Logout</button>
            </div>
        );
    }

    return (
        <button onClick={() => Login('username', 'password')}>
            Login
        </button>
    );
}
```

### **Admin-Only Component**
```typescript
import { useAdminAuth } from '@/components/auth';

function AdminComponent() {
    const { isAdmin, isLoading } = useAdminAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return <div>Access denied</div>;
    }

    return <div>Admin content here</div>;
}
```

### **Protected Route Usage**
```typescript
import { ProtectedRoute } from '@/components/auth';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin" 
                    element={
                        <ProtectedRoute requireAdmin>
                            <AdminPanel />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}
```

### **Profile Management Usage**
```typescript
import { UseAuth } from '@/components/auth';

function ProfileComponent() {
    const { user, UpdateUserProfile } = UseAuth();

    const handleEditionChange = async (editionId: number) => {
        const success = await UpdateUserProfile({
            preferredEditionId: editionId
        });
        
        if (success) {
            // Show success message
        } else {
            // Show error message
        }
    };

    return (
        <div>
            <h2>Profile</h2>
            <p>Username: {user?.username}</p>
            <p>Email: {user?.email}</p>
            <select 
                value={user?.preferredEditionId || ''} 
                onChange={(e) => handleEditionChange(Number(e.target.value))}
            >
                <option value="">Select Edition</option>
                <option value="1">D&D 3.5</option>
                <option value="2">D&D 5e</option>
            </select>
        </div>
    );
}
```

## 🔄 **State Management**

### **Authentication State**
- **User Data**: Current user information and preferences
- **Token Management**: JWT token storage and validation
- **Loading States**: Authentication operation loading states
- **Error States**: Authentication error handling

### **Profile State**
- **Profile Data**: User profile information
- **Configuration State**: User-specific configuration data
- **Form State**: Profile form data and validation
- **Update State**: Profile update operation states

### **DiceBox State**
- **Configuration**: Current dice configuration
- **Overrides**: User-specific configuration overrides
- **Preview State**: Live preview configuration state
- **Loading State**: Configuration loading states

## Summary

The User Management frontend components provide a comprehensive, user-friendly interface for authentication and profile management. The components are built with React and TypeScript, provide excellent user experience, and integrate seamlessly with the backend services.

Key strengths include:
- **Comprehensive Authentication**: Complete login, registration, and session management
- **Profile Management**: Full-featured profile editing and configuration
- **Type Safety**: Full TypeScript integration with proper type checking
- **User Experience**: Excellent UX with validation, feedback, and responsive design
- **Integration Ready**: Seamless integration with other system components

The components are designed to provide a smooth, intuitive user experience while maintaining security and data integrity throughout the authentication and profile management processes.
