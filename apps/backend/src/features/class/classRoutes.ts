import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ClassQuerySchema,
    ClassIdParamSchema,
    CreateClassSchema,
    UpdateClassSchema
} from '@shared/schema';

import {
    GetClasses,
    GetAllClasses,
    GetClassById,
    CreateClass,
    UpdateClass,
    DeleteClass,
} from './classController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';


const { router: ClassRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', { query: ClassQuerySchema }, GetClasses);
get('/all', {}, GetAllClasses);
get('/:id', { params: ClassIdParamSchema }, GetClassById);
post('/', requireAdmin, { body: CreateClassSchema }, CreateClass);
put('/:id', requireAdmin, { params: ClassIdParamSchema, body: UpdateClassSchema }, UpdateClass);
deleteRoute('/:id', requireAdmin, { params: ClassIdParamSchema }, DeleteClass);

export { ClassRouter };
