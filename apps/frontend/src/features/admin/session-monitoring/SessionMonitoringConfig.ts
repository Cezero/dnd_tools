import { RouteConfig } from '@/types';

import { SessionMonitoringPage } from './SessionMonitoringPage';

/**
 * Route configuration for admin session monitoring.
 * 
 * @see SessionMonitoringPage - The page component
 */
export const routes: RouteConfig[] = [
    {
        path: '/admin/session-monitoring',
        component: SessionMonitoringPage,
        requireAuth: true,
        requireAdmin: true,
        exact: true,
    },
];
