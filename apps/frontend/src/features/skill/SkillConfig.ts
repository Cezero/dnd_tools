import { RouteConfig } from '@/types';

import { SkillDetail } from './SkillDetail';
import { SkillEdit } from './SkillEdit';
import { SkillList } from './SkillList';

export const routes: RouteConfig[] = [
    { path: 'skills', component: SkillList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'skills/:id', component: SkillDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'skills/:id/edit', component: SkillEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
