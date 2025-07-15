import { RouteConfig } from '@/types';
import ClassDetail from '@/features/admin/features/class-management/ClassDetail';
import ClassEdit from '@/features/admin/features/class-management/ClassEdit';
import ClassList from '@/features/admin/features/class-management/ClassList';
import { ClassFeatureDetail } from '@/features/admin/features/class-management/ClassFeatureDetail';
import { ClassFeatureEdit } from '@/features/admin/features/class-management/ClassFeatureEdit';

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
