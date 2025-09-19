import { DeityDetail } from '@/features/deity/DeityDetail';
import { DeityEdit } from '@/features/deity/DeityEdit';
import { DeityList } from '@/features/deity/DeityList';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'deities', component: DeityList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'deities/:id', component: DeityDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'deities/:id/edit', component: DeityEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
