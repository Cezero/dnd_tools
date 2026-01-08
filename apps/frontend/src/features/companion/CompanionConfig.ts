import { CompanionDetail } from '@/features/companion/CompanionDetail';
import { CompanionEdit } from '@/features/companion/CompanionEdit';
import { CompanionList } from '@/features/companion/CompanionList';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'companions', component: CompanionList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'companions/:id', component: CompanionDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'companions/:id/edit', component: CompanionEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];

