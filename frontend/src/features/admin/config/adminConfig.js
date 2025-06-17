import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import AdminDashboardContent from '@/features/admin/pages/AdminDashboardContent';
import ReferenceTablesList from '@/features/admin/pages/ReferenceTableMgmt/ReferenceTablesList';
import ReferenceTableEditor from '@/features/admin/pages/ReferenceTableMgmt/ReferenceTableEditor';
import ReferenceTableViewer from '@/features/admin/pages/ReferenceTableMgmt/ReferenceTableViewer';

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
            {
                path: 'reference-tables',
                component: ReferenceTablesList,
                exact: true,
            },
            {
                path: 'reference-tables/:id/edit',
                component: ReferenceTableEditor,
            },
            {
                path: 'reference-tables/:id',
                component: ReferenceTableViewer,
            },
        ],
    },
];

export const navigation = null; // Admin features will be in a sidebar, not main navigation 