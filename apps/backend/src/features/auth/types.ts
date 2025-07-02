import type { AuthServiceResult, LoginUserRequest, RegisterUserRequest } from '@shared/schema';

export interface AuthService {
    registerUser: (data: RegisterUserRequest) => Promise<AuthServiceResult>;
    loginUser: (data: LoginUserRequest) => Promise<AuthServiceResult>;
    getUserFromToken: (token: string) => Promise<AuthServiceResult>;
    refreshToken: (token: string) => Promise<AuthServiceResult>;
}
