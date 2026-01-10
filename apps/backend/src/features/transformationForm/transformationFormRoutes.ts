import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    TransformationFormIdParamSchema,
    FeatureIdForTransformationFormsParamSchema,
    CreateTransformationFormSchema,
    UpdateTransformationFormSchema,
} from '@shared/schema';

import {
    GetAllTransformationForms,
    GetTransformationFormById,
    GetTransformationFormsByFeature,
    CreateTransformationForm,
    UpdateTransformationForm,
    DeleteTransformationForm,
} from './transformationFormController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: TransformationFormRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Transformation Form Read Routes (public)
// GET /api/transformationforms - Get all transformation form eligibilities
get('/', {}, GetAllTransformationForms);
// GET /api/transformationforms/:id - Get specific transformation form eligibility by ID
get('/:id', { params: TransformationFormIdParamSchema }, GetTransformationFormById);
// GET /api/transformationforms/feature/:featureId - Get all eligible forms for a feature (ordered by minLevel)
get('/feature/:featureId', { params: FeatureIdForTransformationFormsParamSchema }, GetTransformationFormsByFeature);

// Transformation Form Write Routes (admin only)
// POST /api/transformationforms - Create transformation form eligibility
post('/', requireAdmin, { body: CreateTransformationFormSchema }, CreateTransformationForm);
// PUT /api/transformationforms/:id - Update transformation form eligibility
put('/:id', requireAdmin, { params: TransformationFormIdParamSchema, body: UpdateTransformationFormSchema }, UpdateTransformationForm);
// DELETE /api/transformationforms/:id - Delete transformation form eligibility
deleteRoute('/:id', requireAdmin, { params: TransformationFormIdParamSchema }, DeleteTransformationForm);

export { TransformationFormRouter };

