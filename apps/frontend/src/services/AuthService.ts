import {
    LoginUserSchema,
    RegisterUserSchema,
    LoginResponseSchema,
    UserProfileResponseSchema,
} from '@shared/schema';

import { typedApi } from './Api';

export const AuthService = {
    login: typedApi<typeof LoginUserSchema, typeof LoginResponseSchema>({
        path: '/auth/login',
        method: 'POST',
        requestSchema: LoginUserSchema,
        responseSchema: LoginResponseSchema,
    }),

    register: typedApi<typeof RegisterUserSchema, typeof LoginResponseSchema>({
        path: '/auth/register',
        method: 'POST',
        requestSchema: RegisterUserSchema,
        responseSchema: LoginResponseSchema,
    }),

    getMe: typedApi<undefined, typeof UserProfileResponseSchema>({
        path: '/auth/me',
        method: 'GET',
        responseSchema: UserProfileResponseSchema,
    }),

    refreshToken: typedApi<undefined, typeof LoginResponseSchema>({
        path: '/auth/refresh-token',
        method: 'POST',
        responseSchema: LoginResponseSchema,
    }),
}; 