import express, { RequestHandler } from 'express';
import { GetUserProfile, UpdateUserProfile } from './userProfileController.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { UpdateUserProfileSchema } from '@shared/schema';

export const UserProfileRouter = express.Router();

UserProfileRouter.get('/', GetUserProfile as unknown as RequestHandler);
UserProfileRouter.put('/', validateRequest({ body: UpdateUserProfileSchema }) as RequestHandler, UpdateUserProfile as unknown as RequestHandler); 