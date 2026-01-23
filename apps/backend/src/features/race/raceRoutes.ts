import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    IdParamSchema,
    RaceIdQuerySchema,
    CreateRaceSchema,
    UpdateRaceSchema
} from '@shared/schema';

import {
    CreateRace,
    DeleteRace,
    GetRaceById,
    GetRaceCache,
    GetRaceFeatures,
    GetRaceLockStatus,
    GetAllRaces,
    UpdateRace,
} from './raceController.js';

const { router: RaceRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Race Read Routes
get('/', {}, GetAllRaces);
get('/cache', {}, GetRaceCache);
get('/:id', { params: IdParamSchema, query: RaceIdQuerySchema }, GetRaceById);
get('/:id/features', { params: IdParamSchema, query: RaceIdQuerySchema }, GetRaceFeatures);
get('/:id/lock-status', { params: IdParamSchema }, GetRaceLockStatus);

// Race Write Routes
post('/', requireAdmin, { body: CreateRaceSchema }, CreateRace);
put('/:id', requireAdmin, { params: IdParamSchema, body: UpdateRaceSchema }, UpdateRace);
deleteRoute('/:id', requireAdmin, { params: IdParamSchema }, DeleteRace);

export { RaceRouter };
