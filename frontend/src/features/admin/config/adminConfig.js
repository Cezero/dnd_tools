import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import AdminDashboardContent from '@/features/admin/pages/AdminDashboardContent';
import { routes as referenceTableRoutes } from '@/features/admin/features/ReferenceTableMgmt/config/ReferenceTableConfig';

export const routes = [
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
        ],
    },
];

export const navigation = null; // Admin features will be in a sidebar, not main navigation 