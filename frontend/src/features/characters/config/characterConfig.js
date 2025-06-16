import CharactersPage from '@/features/characters/components/CharactersPage';

export const routes = [
    { path: '/characters', component: CharactersPage, exact: true },
];

export const navigation = {
    label: "Characters",
    path: "/characters",
};
