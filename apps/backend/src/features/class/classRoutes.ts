import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ClassIdParamSchema,
    ClassIdQuerySchema,
    CreateClassSchema,
    UpdateClassSchema,
    GetAllClassesQuerySchema
} from '@shared/schema';

import {
    GetAllClasses,
    GetClassById,
    CreateClass,
    UpdateClass,
    DeleteClass,
    GetClassCache,
    GetClassLockStatus,
} from './classController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';


const { router: ClassRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Class Read Routes
post('/query', { body: GetAllClassesQuerySchema }, GetAllClasses);
get('/cache', {}, GetClassCache);
get('/:id', { params: ClassIdParamSchema, query: ClassIdQuerySchema }, GetClassById);
get('/:id/lock-status', { params: ClassIdParamSchema }, GetClassLockStatus);

// Class Write Routes
post('/', requireAdmin, { body: CreateClassSchema }, CreateClass);
put('/:id', requireAdmin, { params: ClassIdParamSchema, body: UpdateClassSchema }, UpdateClass);
deleteRoute('/:id', requireAdmin, { params: ClassIdParamSchema }, DeleteClass);

export { ClassRouter };
