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

// Transformation Form Read Routes
get('/', {}, GetAllTransformationForms);
get('/:id', { params: TransformationFormIdParamSchema }, GetTransformationFormById);
get('/feature/:featureId', { params: FeatureIdForTransformationFormsParamSchema }, GetTransformationFormsByFeature);

// Transformation Form Write Routes
post('/', requireAdmin, { body: CreateTransformationFormSchema }, CreateTransformationForm);
put('/:id', requireAdmin, { params: TransformationFormIdParamSchema, body: UpdateTransformationFormSchema }, UpdateTransformationForm);
deleteRoute('/:id', requireAdmin, { params: TransformationFormIdParamSchema }, DeleteTransformationForm);

export { TransformationFormRouter };

