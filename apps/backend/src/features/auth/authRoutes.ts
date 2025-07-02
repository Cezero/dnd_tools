import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { RegisterUserSchema, LoginUserSchema, AuthHeaderSchema } from '@shared/schema';

import { RegisterUser, LoginUser, GetUserFromToken, RefreshToken } from './authController.js';

const { router: AuthRouter, post, get } = buildValidatedRouter();

post('/register', { body: RegisterUserSchema }, RegisterUser);
post('/login', { body: LoginUserSchema }, LoginUser);
get('/me', { headers: AuthHeaderSchema }, GetUserFromToken);
post('/refresh-token', { headers: AuthHeaderSchema }, RefreshToken);

export { AuthRouter };