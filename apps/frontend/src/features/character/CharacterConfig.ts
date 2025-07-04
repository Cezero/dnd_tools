import { CharactersPage } from '@/features/character/CharacterPage';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    { path: '/characters', component: CharactersPage, exact: true, requireAuth: true },
];

export const navigation: NavigationItem = {
    label: "Characters",
    path: "/characters",
};
