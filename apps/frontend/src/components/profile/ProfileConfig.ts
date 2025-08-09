import { RouteConfig } from '@/types';

import { ProfilePage } from './ProfilePage';

export const routes: RouteConfig[] = [
    { path: 'profile', component: ProfilePage, exact: true, requireAuth: true, routeType: 'detail' },
]; 
