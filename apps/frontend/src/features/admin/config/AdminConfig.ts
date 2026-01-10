import { routes as characterExplorerRoutes } from '@/features/admin/features/character-explorer/CharacterExplorerConfig';
import { routes as diceConfigurationRoutes } from '@/features/admin/features/dice-configuration/DiceConfigurationConfig';
import { routes as diceTestingRoutes } from '@/features/admin/features/dice-testing/DiceTestingConfig';
import { routes as referenceTableRoutes } from '@/features/admin/features/reference-table-management/ReferenceTableConfig';
import { AdminDashboardContent } from '@/features/admin/pages/AdminDashboardContent';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    {
        path: '/admin',
        component: AdminDashboardPage, // This now acts as a layout for all admin routes
        requireAuth: true, // Requires authentication
        requireAdmin: true, // Requires admin privileges
        children: [
            {
                path: '', // This path will render when navigating to /admin
                component: AdminDashboardContent,
                exact: true,
            },
            ...referenceTableRoutes,
            ...diceConfigurationRoutes,
            ...diceTestingRoutes,
            ...characterExplorerRoutes
        ],
    },
];

export const navigation: NavigationItem | null = null; // Admin features will be in a sidebar, not main navigation 
