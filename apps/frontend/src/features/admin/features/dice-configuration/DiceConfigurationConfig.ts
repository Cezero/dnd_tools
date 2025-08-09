import { RouteConfig } from '@/types';

import { DiceConfigurationPage } from './DiceConfigurationPage';

export const routes: RouteConfig[] = [
    {
        path: 'dice-configuration',
        component: DiceConfigurationPage,
        exact: true,
        requireAuth: true,
        requireAdmin: true,
        routeType: 'edit'
    }
]; 
