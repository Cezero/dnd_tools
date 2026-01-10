import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';

import {
    GetSourceBookCache,
} from './sourcebookController.js';

const { router: SourceBookRouter, get } = buildValidatedRouter();

// Source Book Cache Route (public)
// GET /api/sourcebooks/cache - Get source book cache with content flags (used by frontend CacheProvider)
get('/cache', {}, GetSourceBookCache);

export { SourceBookRouter };
