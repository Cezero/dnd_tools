import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAuth } from '@/middleware/authMiddleware';
import { UpdateUserProfileSchema } from '@shared/schema';

import { GetUserProfile, UpdateUserProfile } from './userProfileController';

const { router: UserProfileRouter, get, put } = buildValidatedRouter();

get('/', requireAuth, {}, GetUserProfile);
put('/', requireAuth, { body: UpdateUserProfileSchema }, UpdateUserProfile);

export { UserProfileRouter };
