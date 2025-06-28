import { CharactersPage } from '@/features/characters/components/CharactersPage';
import { RouteConfig, NavigationItem } from '@/types';

export const routes: RouteConfig[] = [
    { path: '/characters', component: CharactersPage, exact: true },
];

export const navigation: NavigationItem = {
    label: "Characters",
    path: "/characters",
};
