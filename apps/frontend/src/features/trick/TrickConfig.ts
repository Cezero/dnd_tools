import { TrickDetail } from '@/features/trick/TrickDetail';
import { TrickEdit } from '@/features/trick/TrickEdit';
import { TrickList } from '@/features/trick/TrickList';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'tricks', component: TrickList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'tricks/:id', component: TrickDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'tricks/:id/edit', component: TrickEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];

