import { DomainDetail } from '@/features/domain/DomainDetail';
import { DomainEdit } from '@/features/domain/DomainEdit';
import { DomainList } from '@/features/domain/DomainList';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'domains', component: DomainList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'domains/:id', component: DomainDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'domains/:id/edit', component: DomainEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
