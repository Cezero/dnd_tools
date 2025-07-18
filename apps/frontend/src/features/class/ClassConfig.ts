import { RouteConfig } from '@/types';
import ClassDetail from './ClassDetail';
import ClassEdit from './ClassEdit';
import ClassList from './ClassList';
import { ClassFeatureDetail } from './ClassFeatureDetail';
import { ClassFeatureEdit } from './ClassFeatureEdit';

export const routes: RouteConfig[] = [
    { path: 'classes', component: ClassList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'classes/:id', component: ClassDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'classes/:id/edit', component: ClassEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
    { path: 'classes/features/:slug', component: ClassFeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'classes/features/:slug/edit', component: ClassFeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];

export const classFeatureRoutes: RouteConfig[] = [
    { path: 'classes/features/:slug', component: ClassFeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'classes/features/:slug/edit', component: ClassFeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
