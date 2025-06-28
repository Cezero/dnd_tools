import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminDashboardContent } from '@/features/admin/pages/AdminDashboardContent';
import { routes as referenceTableRoutes } from '@/features/admin/features/ReferenceTableMgmt/config/ReferenceTableConfig';
import { routes as raceRoutes } from '@/features/admin/features/raceMgmt/config/RaceConfig';
import { routes as classRoutes } from '@/features/admin/features/classMgmt/config/ClassConfig';
import { routes as skillRoutes } from '@/features/admin/features/skillMgmt/config/SkillConfig';
import { routes as featRoutes } from '@/features/admin/features/featMgmt/config/FeatConfig';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    {
        path: '/admin',
        component: AdminDashboardPage, // This now acts as a layout for all admin routes
        auth: true, // Requires authentication
        admin: true, // Requires admin privileges
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