import { RouteConfig, NavigationItem } from '@/types';

import { MonsterDetail } from './MonsterDetail';
import { MonsterEdit } from './MonsterEdit';
import { MonsterList } from './MonsterList';

export const routes: RouteConfig[] = [
    { path: 'monsters', component: MonsterList, exact: true, requireAuth: true, routeType: 'list' },
    { path: 'monsters/:id', component: MonsterDetail, exact: true, requireAuth: true, routeType: 'detail' },
    { path: 'monsters/:id/edit', component: MonsterEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];

export const navigation: NavigationItem = {
    label: 'Monsters',
    path: '/monsters',
};

