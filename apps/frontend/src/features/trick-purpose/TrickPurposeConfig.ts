import { TrickPurposeDetail } from '@/features/trick-purpose/TrickPurposeDetail';
import { TrickPurposeEdit } from '@/features/trick-purpose/TrickPurposeEdit';
import { TrickPurposeList } from '@/features/trick-purpose/TrickPurposeList';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'trick-purposes', component: TrickPurposeList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'trick-purposes/:id', component: TrickPurposeDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'trick-purposes/:id/edit', component: TrickPurposeEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
