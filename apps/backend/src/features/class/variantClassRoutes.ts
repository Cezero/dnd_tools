import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    VariantIdParamSchema,
    CreateClassVariantSchema,
    UpdateClassVariantSchema
} from '@shared/schema';

import {
    CreateVariant,
    UpdateVariant,
    DeleteVariant,
    GetVariant,
} from './variantClassController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: VariantClassRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Variant management routes
post('/variants', requireAdmin, { body: CreateClassVariantSchema }, CreateVariant);
put('/variants/:id', requireAdmin, { params: VariantIdParamSchema, body: UpdateClassVariantSchema }, UpdateVariant);
deleteRoute('/variants/:id', requireAdmin, { params: VariantIdParamSchema }, DeleteVariant);
get('/variants/:id', { params: VariantIdParamSchema }, GetVariant);

export { VariantClassRouter };
