import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    SkillIdParamSchema,
    CreateSkillSchema,
    UpdateSkillSchema
} from '@shared/schema';

import {
    GetAllSkills,
    GetSkillById,
    CreateSkill,
    UpdateSkill,
    DeleteSkill,
} from './skillController.js';

const { router: SkillRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();


get('/', {}, GetAllSkills);
get('/:id', { params: SkillIdParamSchema }, GetSkillById);
post('/', requireAdmin, { body: CreateSkillSchema }, CreateSkill);
put('/:id', requireAdmin, { params: SkillIdParamSchema, body: UpdateSkillSchema }, UpdateSkill);
deleteRoute('/:id', requireAdmin, { params: SkillIdParamSchema }, DeleteSkill);

export { SkillRouter };
