import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    SkillQuerySchema,
    SkillIdParamSchema,
    CreateSkillSchema,
    UpdateSkillSchema
} from '@shared/schema';

import {
    GetSkills,
    GetSkillById,
    CreateSkill,
    UpdateSkill,
    DeleteSkill,
} from './skillController.js';

const { router: SkillRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();


get('/', { query: SkillQuerySchema }, GetSkills);
get('/:id', { params: SkillIdParamSchema }, GetSkillById);
post('/', requireAdmin, { body: CreateSkillSchema }, CreateSkill);
put('/:id', requireAdmin, { params: SkillIdParamSchema, body: UpdateSkillSchema }, UpdateSkill);
deleteRoute('/:id', requireAdmin, { params: SkillIdParamSchema }, DeleteSkill);

export { SkillRouter };
