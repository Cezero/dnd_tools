import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ClassIdParamSchema,
    CreateClassSchema,
    UpdateClassSchema
} from '@shared/schema';

import {
    GetAllClasses,
    GetClassById,
    CreateClass,
    UpdateClass,
    DeleteClass,
} from './classController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';


const { router: ClassRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Class Read Routes
get('/', {}, GetAllClasses);
get('/:id', { params: ClassIdParamSchema }, GetClassById);

// Class Write Routes
post('/', requireAdmin, { body: CreateClassSchema }, CreateClass);
put('/:id', requireAdmin, { params: ClassIdParamSchema, body: UpdateClassSchema }, UpdateClass);
deleteRoute('/:id', requireAdmin, { params: ClassIdParamSchema }, DeleteClass);

export { ClassRouter };
