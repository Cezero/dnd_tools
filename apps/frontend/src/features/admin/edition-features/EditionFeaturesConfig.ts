import { RouteConfig, NavigationItem } from '@/types';

import EditionFeaturesList from './EditionFeaturesList';

export const routes: RouteConfig[] = [
    { path: 'edition-features', component: EditionFeaturesList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
];

export const navigation: NavigationItem = {
    label: "Edition Features",
    path: "/admin/edition-features",
};
