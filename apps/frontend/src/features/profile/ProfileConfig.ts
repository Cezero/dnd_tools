import { ProfilePage } from './ProfilePage';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: '/profile', component: ProfilePage, exact: true, requireAuth: true, routeType: 'detail' },
]; 
