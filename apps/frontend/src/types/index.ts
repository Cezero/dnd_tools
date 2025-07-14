import React from 'react';

export type RouteType = 'list' | 'detail' | 'edit' | 'delete';

export interface RouteConfig {
    path: string;
    component: React.ComponentType<Record<string, unknown>>;
    exact?: boolean;
    children?: RouteConfig[];
    requireAuth?: boolean; // Requires authentication
    requireAdmin?: boolean; // Requires admin privileges
    redirectTo?: string; // Custom redirect path for unauthorized access
    routeType?: RouteType; // Type of route for navigation purposes
}

export interface NavigationItem {
    label: string;
    path: string;
    icon?: string;
    children?: NavigationItem[];
}
