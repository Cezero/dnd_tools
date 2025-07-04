import React from 'react';

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
    component: React.ComponentType<Record<string, unknown>>;
    exact?: boolean;
    children?: RouteConfig[];
    requireAuth?: boolean; // Requires authentication
    requireAdmin?: boolean; // Requires admin privileges
    redirectTo?: string; // Custom redirect path for unauthorized access
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
    [key: string]: unknown;
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
    details?: unknown;
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