import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    ClassQuerySchema,
    ClassIdParamSchema,
    CreateClassSchema,
    UpdateClassSchema,
    ClassFeatureQuerySchema,
    ClassFeatureSlugParamSchema,
    CreateClassFeatureSchema,
    UpdateClassFeatureSchema
} from '@shared/schema';

import {
    GetClasses,
    GetAllClasses,
    GetClassById,
    CreateClass,
    UpdateClass,
    DeleteClass,
    GetClassFeatures,
    GetAllClassFeatures,
    GetClassFeatureBySlug,
    CreateClassFeature,
    UpdateClassFeature,
    DeleteClassFeature,
} from './classController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';


const { router: ClassRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Class Read Routes
get('/', { query: ClassQuerySchema }, GetClasses);
get('/all', {}, GetAllClasses);

// Class Feature Read Routes
get('/features', { query: ClassFeatureQuerySchema }, GetClassFeatures);
get('/features/list', {}, GetAllClassFeatures);
get('/features/:slug', { params: ClassFeatureSlugParamSchema }, GetClassFeatureBySlug);

// this has to be last because it conflicts with the class feature routes
get('/:id', { params: ClassIdParamSchema }, GetClassById);

// Class Write Routes
post('/', requireAdmin, { body: CreateClassSchema }, CreateClass);
put('/:id', requireAdmin, { params: ClassIdParamSchema, body: UpdateClassSchema }, UpdateClass);
deleteRoute('/:id', requireAdmin, { params: ClassIdParamSchema }, DeleteClass);

// Class Feature Write Routes
post('/features', requireAdmin, { body: CreateClassFeatureSchema }, CreateClassFeature);
put('/features/:slug', requireAdmin, { params: ClassFeatureSlugParamSchema, body: UpdateClassFeatureSchema }, UpdateClassFeature);
deleteRoute('/features/:slug', requireAdmin, { params: ClassFeatureSlugParamSchema }, DeleteClassFeature);

export { ClassRouter };
