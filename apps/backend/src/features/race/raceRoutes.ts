import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    RaceIdParamSchema,
    CreateRaceSchema,
    UpdateRaceSchema
} from '@shared/schema';

import {
    GetAllRaces,
    GetRaceById,
    CreateRace,
    UpdateRace,
    DeleteRace,
} from './raceController.js';

const { router: RaceRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Race Read Routes
get('/', {}, GetAllRaces);
get('/:id', { params: RaceIdParamSchema }, GetRaceById);

// Race Write Routes
post('/', requireAdmin, { body: CreateRaceSchema }, CreateRace);
put('/:id', requireAdmin, { params: RaceIdParamSchema, body: UpdateRaceSchema }, UpdateRace);
deleteRoute('/:id', requireAdmin, { params: RaceIdParamSchema }, DeleteRace);

export { RaceRouter };
