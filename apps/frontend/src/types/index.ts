// Common types used throughout the application

// API Response types
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
}

// User types
export interface User {
    id: string;
    email: string;
    username?: string;
    createdAt: string;
    updatedAt: string;
}

// Authentication types
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    username?: string;
}

// Route configuration types
export interface RouteConfig {
    path: string;
    component: React.ComponentType<any>;
    exact?: boolean;
    children?: RouteConfig[];
    auth?: boolean;
    admin?: boolean;
}

export interface NavigationItem {
    label: string;
    path: string;
    icon?: string;
    children?: NavigationItem[];
}

// Generic list types
export interface ListItem {
    id: string;
    [key: string]: any;
}

export interface ListState<T extends ListItem> {
    items: T[];
    loading: boolean;
    error: string | null;
    selectedItem: T | null;
}

// Form types
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
    required?: boolean;
    options?: { value: string; label: string }[];
    validation?: {
        pattern?: RegExp;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
    };
}

// Component prop types
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

// Error types
export interface AppError {
    message: string;
    code?: string;
    details?: any;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Pagination types
export interface PaginationParams {
    page: number;
    limit: number;
    total?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationParams;
} 