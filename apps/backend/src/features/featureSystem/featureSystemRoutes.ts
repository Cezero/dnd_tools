import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    FeatureIdParamSchema,
    FeatureSlugParamSchema,
    CreateFeatureSchema,
    UpdateFeatureSchema,
    CreateFeatureProgressionSchema,
    UpdateFeatureProgressionSchema,
    CreateFeatureModifierSchema,
    UpdateFeatureModifierSchema,
    CreateFeatureChoiceSchema,
    UpdateFeatureChoiceSchema,
    CreateFeatureSpecialEffectSchema,
    UpdateFeatureSpecialEffectSchema,
} from '@shared/schema';

import {
    GetAllFeatures,
    GetFeatureBySlug,
    CreateFeature,
    UpdateFeature,
    DeleteFeature,
    GetFeatureProgressions,
    CreateFeatureProgression,
    UpdateFeatureProgression,
    DeleteFeatureProgression,
    GetFeatureModifiers,
    CreateFeatureModifier,
    UpdateFeatureModifier,
    DeleteFeatureModifier,
    GetFeatureChoices,
    CreateFeatureChoice,
    UpdateFeatureChoice,
    DeleteFeatureChoice,
    GetFeatureSpecialEffects,
    CreateFeatureSpecialEffect,
    UpdateFeatureSpecialEffect,
    DeleteFeatureSpecialEffect,
} from './featureSystemController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: FeatureSystemRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Core Feature Routes
get('/', {}, GetAllFeatures);
get('/:slug', { params: FeatureSlugParamSchema }, GetFeatureBySlug);

post('/', requireAdmin, { body: CreateFeatureSchema }, CreateFeature);
put('/:slug', requireAdmin, { params: FeatureSlugParamSchema, body: UpdateFeatureSchema }, UpdateFeature);
deleteRoute('/:slug', requireAdmin, { params: FeatureSlugParamSchema }, DeleteFeature);

// Feature Progression Routes
get('/progressions', {}, GetFeatureProgressions);
post('/progressions', requireAdmin, { body: CreateFeatureProgressionSchema }, CreateFeatureProgression);
put('/progressions/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureProgressionSchema }, UpdateFeatureProgression);
deleteRoute('/progressions/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureProgression);

// Feature Modifier Routes
get('/progressions/:progressionId/modifiers', { params: FeatureIdParamSchema }, GetFeatureModifiers);
post('/progressions/:progressionId/modifiers', requireAdmin, { params: FeatureIdParamSchema, body: CreateFeatureModifierSchema }, CreateFeatureModifier);
put('/modifiers/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureModifierSchema }, UpdateFeatureModifier);
deleteRoute('/modifiers/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureModifier);

// Feature Choice Routes
get('/progressions/:progressionId/choices', { params: FeatureIdParamSchema }, GetFeatureChoices);
post('/progressions/:progressionId/choices', requireAdmin, { params: FeatureIdParamSchema, body: CreateFeatureChoiceSchema }, CreateFeatureChoice);
put('/choices/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureChoiceSchema }, UpdateFeatureChoice);
deleteRoute('/choices/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureChoice);

// Feature Special Effect Routes
get('/progressions/:progressionId/effects', { params: FeatureIdParamSchema }, GetFeatureSpecialEffects);
post('/progressions/:progressionId/effects', requireAdmin, { params: FeatureIdParamSchema, body: CreateFeatureSpecialEffectSchema }, CreateFeatureSpecialEffect);
put('/effects/:id', requireAdmin, { params: FeatureIdParamSchema, body: UpdateFeatureSpecialEffectSchema }, UpdateFeatureSpecialEffect);
deleteRoute('/effects/:id', requireAdmin, { params: FeatureIdParamSchema }, DeleteFeatureSpecialEffect);

export { FeatureSystemRouter }; 
