import { DiceConfigurationPage } from './DiceConfigurationPage';
import { RouteConfig } from '@/types';

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
