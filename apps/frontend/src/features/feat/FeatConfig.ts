import { FeatDetail } from '@/features/feat/FeatDetail';
import { FeatEdit } from '@/features/feat/FeatEdit';
import { FeatList } from '@/features/feat/FeatList';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'feats', component: FeatList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'feats/:id', component: FeatDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'feats/:id/edit', component: FeatEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
