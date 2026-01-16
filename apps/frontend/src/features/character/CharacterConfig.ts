import { CharacterDetail, CharacterEdit, CharacterList } from '@/features/character';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    { path: '/characters', component: CharacterList, exact: true, requireAuth: true, routeType: 'list' },
    { path: '/characters/new/create', component: CharacterEdit, exact: true, requireAuth: true, routeType: 'edit' },
    { path: '/characters/:id/edit', component: CharacterEdit, exact: true, requireAuth: true, routeType: 'edit' },
    { path: '/characters/:id', component: CharacterDetail, exact: true, requireAuth: true, routeType: 'detail' },
];

export const navigation: NavigationItem = {
    label: "Characters",
    path: "/characters",
};
