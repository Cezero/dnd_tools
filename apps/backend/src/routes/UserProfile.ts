import express, { RequestHandler } from 'express';
import { GetUserProfile, UpdateUserProfile } from '../controllers/userProfileController.js';

export const UserProfileRouter = express.Router();

UserProfileRouter.get('/', GetUserProfile as unknown as RequestHandler);
UserProfileRouter.put('/', UpdateUserProfile as unknown as RequestHandler); 