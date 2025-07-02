import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminDashboardContent } from '@/features/admin/pages/AdminDashboardContent';
import { routes as referenceTableRoutes } from '@/features/admin/features/reference-table-management/ReferenceTableConfig';
import { routes as raceRoutes } from '@/features/admin/features/race-management/RaceConfig';
import { routes as classRoutes } from '@/features/admin/features/class-management/ClassConfig';
import { routes as skillRoutes } from '@/features/admin/features/skill-management/SkillConfig';
import { routes as featRoutes } from '@/features/admin/features/feat-management/FeatConfig';
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
            ...raceRoutes,
            ...classRoutes,
            ...skillRoutes,
            ...featRoutes,
        ],
    },
];

export const navigation: NavigationItem | null = null; // Admin features will be in a sidebar, not main navigation 