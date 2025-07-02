import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    RaceQuerySchema,
    RaceIdParamSchema,
    RaceTraitSlugParamSchema,
    CreateRaceSchema,
    UpdateRaceSchema,
    CreateRaceTraitSchema,
    UpdateRaceTraitSchema,
    RaceTraitQuerySchema
} from '@shared/schema';

import {
    GetRaces,
    GetRaceById,
    CreateRace,
    UpdateRace,
    DeleteRace,
    GetRaceTraits,
    GetRaceTraitBySlug,
    CreateRaceTrait,
    UpdateRaceTrait,
    DeleteRaceTrait,
    GetAllRaceTraits,
} from './raceController.js';

const { router: RaceRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Race Read Routes
get('/', { query: RaceQuerySchema }, GetRaces);
get('/:id', { params: RaceIdParamSchema }, GetRaceById);

// Race Write Routes
post('/', requireAdmin, { body: CreateRaceSchema }, CreateRace);
put('/:id', requireAdmin, { params: RaceIdParamSchema, body: UpdateRaceSchema }, UpdateRace);
deleteRoute('/:id', requireAdmin, { params: RaceIdParamSchema }, DeleteRace);

// Race Trait Read Routes
get('/traits', { query: RaceTraitQuerySchema }, GetRaceTraits);
get('/traits/list', {}, GetAllRaceTraits);
get('/traits/:slug', { params: RaceTraitSlugParamSchema }, GetRaceTraitBySlug);

// Race Trait Write Routes
post('/traits', requireAdmin, { body: CreateRaceTraitSchema }, CreateRaceTrait);
put('/traits/:slug', requireAdmin, { params: RaceTraitSlugParamSchema, body: UpdateRaceTraitSchema }, UpdateRaceTrait);
deleteRoute('/traits/:slug', requireAdmin, { params: RaceTraitSlugParamSchema }, DeleteRaceTrait);

export { RaceRouter };