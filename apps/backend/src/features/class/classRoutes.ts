import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    IdParamSchema,
    ClassIdQuerySchema,
    CreateClassSchema,
    UpdateClassSchema,
    GetAllClassesQuerySchema
} from '@shared/schema';

import {
    GetAllClasses,
    GetClassById,
    GetClassFeatures,
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
get('/:id', { params: IdParamSchema, query: ClassIdQuerySchema }, GetClassById);
get('/:id/features', { params: IdParamSchema, query: ClassIdQuerySchema }, GetClassFeatures);
get('/:id/lock-status', { params: IdParamSchema }, GetClassLockStatus);

// Class Write Routes
post('/', requireAdmin, { body: CreateClassSchema }, CreateClass);
put('/:id', requireAdmin, { params: IdParamSchema, body: UpdateClassSchema }, UpdateClass);
deleteRoute('/:id', requireAdmin, { params: IdParamSchema }, DeleteClass);

export { ClassRouter };
