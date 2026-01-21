import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    RaceIdParamSchema,
    RaceIdQuerySchema,
    CreateRaceSchema,
    UpdateRaceSchema
} from '@shared/schema';

import {
    GetAllRaces,
    GetRaceById,
    CreateRace,
    UpdateRace,
    DeleteRace,
    GetRaceCache,
    GetRaceLockStatus,
} from './raceController.js';

const { router: RaceRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Race Read Routes
get('/', {}, GetAllRaces);
get('/cache', {}, GetRaceCache);
get('/:id', { params: RaceIdParamSchema, query: RaceIdQuerySchema }, GetRaceById);
get('/:id/lock-status', { params: RaceIdParamSchema }, GetRaceLockStatus);

// Race Write Routes
post('/', requireAdmin, { body: CreateRaceSchema }, CreateRace);
put('/:id', requireAdmin, { params: RaceIdParamSchema, body: UpdateRaceSchema }, UpdateRace);
deleteRoute('/:id', requireAdmin, { params: RaceIdParamSchema }, DeleteRace);

export { RaceRouter };
