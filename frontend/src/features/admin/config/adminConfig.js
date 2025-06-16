import AdminDashboardPage from '../pages/AdminDashboardPage';
import ReferenceTablesPage from '../pages/ReferenceTablesPage';

export const routes = [
    {
        path: '/admin',
        component: AdminDashboardPage,
        auth: true, // Requires authentication
        admin: true, // Requires admin privileges
        children: [
            {
                path: 'reference-tables',
                component: ReferenceTablesPage,
                exact: true,
            },
        ],
    },
];

export const navigation = null; // Admin features will be in a sidebar, not main navigation 