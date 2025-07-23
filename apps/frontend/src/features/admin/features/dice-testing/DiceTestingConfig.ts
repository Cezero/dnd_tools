import { RouteConfig } from '@/types';
import { DiceTestingPage } from './DiceTestingPage';

export const routes: RouteConfig[] = [
    {
        path: 'dice-testing',
        component: DiceTestingPage,
        requireAuth: true,
        requireAdmin: true,
    },
]; 
