import express, { RequestHandler } from 'express';

import { UpdateUserProfileSchema } from '@shared/schema';

import { GetUserProfile, UpdateUserProfile } from './userProfileController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';

export const UserProfileRouter = express.Router();

UserProfileRouter.get('/', requireAuth as RequestHandler, GetUserProfile as unknown as RequestHandler);
UserProfileRouter.put('/', requireAuth as RequestHandler, validateRequest({ body: UpdateUserProfileSchema }) as RequestHandler, UpdateUserProfile as unknown as RequestHandler); 