import express, { RequestHandler } from 'express';
import { RegisterUser, LoginUser, GetUserFromToken, RefreshToken } from './authController.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { RegisterUserSchema, LoginUserSchema, AuthHeaderSchema } from '@shared/schema';

export const AuthRouter = express.Router();
AuthRouter.post('/register', validateRequest({ body: RegisterUserSchema }) as RequestHandler, RegisterUser as unknown as RequestHandler);
AuthRouter.post('/login', validateRequest({ body: LoginUserSchema }) as RequestHandler, LoginUser as unknown as RequestHandler);
AuthRouter.get('/me', validateRequest({ headers: AuthHeaderSchema }) as RequestHandler, GetUserFromToken as unknown as RequestHandler);
AuthRouter.post('/refresh-token', validateRequest({ headers: AuthHeaderSchema }) as RequestHandler, RefreshToken as unknown as RequestHandler); 