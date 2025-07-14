import React from 'react';

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
