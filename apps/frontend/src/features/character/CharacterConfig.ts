import { CharacterEdit, CharacterList } from '@/features/character';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    { path: '/characters', component: CharacterList, exact: true, requireAuth: true, routeType: 'list' },
    { path: '/characters/new/create', component: CharacterEdit, exact: true, requireAuth: true, routeType: 'edit' },
    { path: '/characters/:id/edit', component: CharacterEdit, exact: true, requireAuth: true, routeType: 'edit' },
    // TODO: Add detail route when that component is created
    // { path: '/characters/:id', component: CharacterDetail, exact: true, requireAuth: true, routeType: 'detail' },
];

export const navigation: NavigationItem = {
    label: "Characters",
    path: "/characters",
};
