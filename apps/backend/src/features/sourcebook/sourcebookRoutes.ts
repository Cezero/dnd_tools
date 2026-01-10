import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';

import {
    GetSourceBookCache,
} from './sourcebookController.js';

const { router: SourceBookRouter, get } = buildValidatedRouter();

// Read routes
get('/cache', {}, GetSourceBookCache);

export { SourceBookRouter };
