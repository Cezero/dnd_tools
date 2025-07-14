import { RouteConfig, NavigationItem } from '@/types';

import { SpellDetail } from './SpellDetail';
import { SpellEdit } from './SpellEdit';
import { SpellList } from './SpellList';

export const routes: RouteConfig[] = [
    { path: 'spells', component: SpellList, exact: true, requireAuth: true, routeType: 'list' },
    { path: 'spells/:id', component: SpellDetail, exact: true, requireAuth: true, routeType: 'detail' },
    { path: 'spells/:id/edit', component: SpellEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];

export const navigation: NavigationItem = {
    label: "Spells",
    path: "/spells",
};

