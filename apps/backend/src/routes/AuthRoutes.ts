import express, { RequestHandler } from 'express';
import { RegisterUser, LoginUser, GetUserFromToken, RefreshToken } from '../controllers/authController.js';

export const AuthRouter = express.Router();
AuthRouter.post('/register', RegisterUser as unknown as RequestHandler);
AuthRouter.post('/login', LoginUser as unknown as RequestHandler);
AuthRouter.get('/me', GetUserFromToken as unknown as RequestHandler);
AuthRouter.post('/refresh-token', RefreshToken as unknown as RequestHandler); 