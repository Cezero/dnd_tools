import AdminDashboardPage from '@/features/admin/pages/AdminDashboardPage';
import AdminDashboardContent from '@/features/admin/pages/AdminDashboardContent';
import ReferenceTablesPage from '@/features/admin/pages/ReferenceTableMgmt/List';
import NewReferenceTablePage from '@/features/admin/pages/ReferenceTableMgmt/New';
import EditReferenceTablePage from '@/features/admin/pages/ReferenceTableMgmt/Edit';
import ReferenceTableContentPage from '@/features/admin/pages/ReferenceTableMgmt/View';

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
                component: ReferenceTablesPage,
                exact: true,
            },
            {
                path: 'reference-tables/new',
                component: NewReferenceTablePage,
            },
            {
                path: 'reference-tables/:id',
                component: ReferenceTableContentPage,
            },
            {
                path: 'reference-tables/:id/edit',
                component: EditReferenceTablePage,
            },
        ],
    },
];

export const navigation = null; // Admin features will be in a sidebar, not main navigation 