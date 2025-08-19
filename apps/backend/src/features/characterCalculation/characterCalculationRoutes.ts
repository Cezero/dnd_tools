import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { CharacterIdParamSchema } from '@shared/schema';

import {
    GetCharacterCalculatedStats,
    GetCharacterAnalogSkills,
} from './characterCalculationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const { router: CharacterCalculationRouter, get } = buildValidatedRouter();

// Character calculation routes
get('/characters/:id/calculated-stats', requireAuth, { params: CharacterIdParamSchema }, GetCharacterCalculatedStats);
get('/characters/:id/analog-skills', requireAuth, { params: CharacterIdParamSchema }, GetCharacterAnalogSkills);

export { CharacterCalculationRouter };
