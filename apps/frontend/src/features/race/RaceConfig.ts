import { RouteConfig } from '@/types';
import { RaceDetail } from './RaceDetail';
import { RaceEdit } from './RaceEdit';
import { RaceList } from './RaceList';

export const routes: RouteConfig[] = [
    { path: 'races', component: RaceList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'races/:id', component: RaceDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'races/:id/edit', component: RaceEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
