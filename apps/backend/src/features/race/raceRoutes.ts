import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    RaceIdParamSchema,
    RaceTraitSlugParamSchema,
    UpdateRaceSchema,
    CreateRaceTraitSchema,
    UpdateRaceTraitSchema,
    CreateRaceSchema
} from '@shared/schema';

import {
    GetAllRaces,
    GetRaceById,
    CreateRace,
    UpdateRace,
    DeleteRace,
    GetRaceTraitBySlug,
    CreateRaceTrait,
    UpdateRaceTrait,
    DeleteRaceTrait,
    GetAllRaceTraits,
} from './raceController.js';

const { router: RaceRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Race Read Routes
get('/', {}, GetAllRaces);


// Race Write Routes
post('/', requireAdmin, { body: CreateRaceSchema }, CreateRace);
put('/:id', requireAdmin, { params: RaceIdParamSchema, body: UpdateRaceSchema }, UpdateRace);
deleteRoute('/:id', requireAdmin, { params: RaceIdParamSchema }, DeleteRace);

// Race Trait Read Routes
get('/traits', {}, GetAllRaceTraits);
get('/traits/:slug', { params: RaceTraitSlugParamSchema }, GetRaceTraitBySlug);
// this has to be last because it conflicts with the race trait routes
get('/:id', { params: RaceIdParamSchema }, GetRaceById);
// Race Trait Write Routes
post('/traits', requireAdmin, { body: CreateRaceTraitSchema }, CreateRaceTrait);
put('/traits/:slug', requireAdmin, { params: RaceTraitSlugParamSchema, body: UpdateRaceTraitSchema }, UpdateRaceTrait);
deleteRoute('/traits/:slug', requireAdmin, { params: RaceTraitSlugParamSchema }, DeleteRaceTrait);

export { RaceRouter };
