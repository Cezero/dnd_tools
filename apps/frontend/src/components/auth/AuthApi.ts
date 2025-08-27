import { typedApi } from '@/services/Api';
import {
    LoginUserSchema,
    RegisterUserSchema,
    AuthServiceResultSchema,
} from '@shared/schema';

export const AuthApi = {
    login: typedApi<typeof LoginUserSchema, typeof AuthServiceResultSchema>({
        path: '/auth/login',
        method: 'POST',
        requestSchema: LoginUserSchema,
        responseSchema: AuthServiceResultSchema,
    }),

    register: typedApi<typeof RegisterUserSchema, typeof AuthServiceResultSchema>({
        path: '/auth/register',
        method: 'POST',
        requestSchema: RegisterUserSchema,
        responseSchema: AuthServiceResultSchema,
    }),

    getMe: typedApi<undefined, typeof AuthServiceResultSchema>({
        path: '/auth/me',
        method: 'GET',
        responseSchema: AuthServiceResultSchema,
    }),

    refreshToken: typedApi<undefined, typeof AuthServiceResultSchema>({
        path: '/auth/refresh-token',
        method: 'POST',
        responseSchema: AuthServiceResultSchema,
    }),
}; 
