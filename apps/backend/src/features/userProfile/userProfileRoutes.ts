import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAuth } from '@/middleware/authMiddleware';
import { UpdateUserProfileSchema, UserProfileIdParamSchema } from '@shared/schema';

import { GetUserProfile, UpdateUserProfile } from './userProfileController';

const { router: UserProfileRouter, get, put } = buildValidatedRouter();

get('/', requireAuth, { params: UserProfileIdParamSchema }, GetUserProfile);
put('/', requireAuth, { params: UserProfileIdParamSchema, body: UpdateUserProfileSchema }, UpdateUserProfile);

export { UserProfileRouter };
