import { CharacterEdit } from '@/features/character/CharacterEdit';
import { CharacterList } from '@/features/character/CharacterList';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    { path: '/characters', component: CharacterList, exact: true, requireAuth: true, routeType: 'list' },
    { path: '/characters/new/create', component: CharacterEdit, exact: true, requireAuth: true, routeType: 'edit' },
    // TODO: Add detail and edit routes when those components are created
    // { path: '/characters/:id', component: CharacterDetail, exact: true, requireAuth: true, routeType: 'detail' },
    // { path: '/characters/:id/edit', component: CharacterEdit, exact: true, requireAuth: true, routeType: 'edit' },
    // { path: '/characters/new/edit', component: CharacterEdit, exact: true, requireAuth: true, routeType: 'edit' },
];

export const navigation: NavigationItem = {
    label: "Characters",
    path: "/characters",
};
