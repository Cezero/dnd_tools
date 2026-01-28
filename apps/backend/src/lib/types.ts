import { z, ZodType } from "zod";

export type InferOrDefault<T extends ZodType | undefined, Fallback> =
    T extends ZodType ? z.infer<T> : Fallback;

    /**
 * JWT token payload structure containing user authentication and authorization data.
 * 
 * This payload is embedded in JWT tokens and extracted during request processing
 * to identify the authenticated user and their permissions.
 */
export interface JwtPayload {
    id: number;
    username: string;
    is_admin: boolean;
    preferred_edition_id: number | null;
}
