import { RouteConfig } from '@/types';
import { RaceDetail } from '@/features/admin/features/race-management/RaceDetail';
import { RaceEdit } from '@/features/admin/features/race-management/RaceEdit';
import { RaceList } from '@/features/admin/features/race-management/RaceList';
import { RaceTraitDetail } from '@/features/admin/features/race-management/RaceTraitDetail';
import { RaceTraitEdit } from '@/features/admin/features/race-management/RaceTraitEdit';

export const routes: RouteConfig[] = [
    { path: 'races', component: RaceList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'races/:id', component: RaceDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'races/:id/edit', component: RaceEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
    { path: 'races/traits/:slug', component: RaceTraitDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'races/traits/:slug/edit', component: RaceTraitEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
