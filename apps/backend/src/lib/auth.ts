/**
 * Authentication utility functions for JWT token management and password hashing.
 * 
 * This module provides core authentication utilities used throughout the backend:
 * - JWT token generation and verification
 * - Password hashing and comparison using bcrypt
 * 
 * Architecture Decisions:
 * - JWT tokens are used for stateless authentication, allowing scalability without session storage
 * - bcrypt with cost factor 10 provides strong password security with reasonable performance
 * - Token payload includes user ID, username, admin status, and preferred edition for authorization
 * - Token expiration (12 hours) balances security and user experience
 * 
 * Source File: `apps/backend/src/lib/auth.ts`
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { config } from '@/config';

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

/**
 * Verifies and decodes a JWT token, returning the payload if valid.
 * 
 * Architecture Decision: Returns null on any error (invalid signature, expired, malformed)
 * rather than throwing, allowing callers to handle authentication failures gracefully.
 * 
 * @param token - The JWT token string to verify
 * @returns The decoded JWT payload if valid, null otherwise
 * 
 * @example
 * ```typescript
 * const payload = verifyToken(req.headers.authorization?.split(' ')[1]);
 * if (payload) {
 *   // User is authenticated
 * }
 * ```
 */
export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (_error) {
        return null;
    }
}

/**
 * Generates a new JWT token with the provided user payload.
 * 
 * Architecture Decision: Token expiration is configured centrally in config.jwt.expiresIn
 * (12 hours) to ensure consistent token lifetime across the application.
 * 
 * @param payload - User data to embed in the token (must include id)
 * @returns A signed JWT token string
 * 
 * @example
 * ```typescript
 * const token = generateToken({
 *   id: user.id,
 *   username: user.username,
 *   is_admin: user.isAdmin,
 *   preferred_edition_id: user.preferredEditionId
 * });
 * ```
 */
export function generateToken(payload: Omit<JwtPayload, 'id'> & { id: number }): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

/**
 * Hashes a plaintext password using bcrypt.
 * 
 * Architecture Decision: Uses cost factor 10, which provides strong security
 * while maintaining reasonable performance. The cost factor can be increased
 * if needed for enhanced security at the cost of slower hashing.
 * 
 * @param password - The plaintext password to hash
 * @returns A bcrypt hash string suitable for storage
 * 
 * @example
 * ```typescript
 * const hash = await HashPassword('userPassword123');
 * // Store hash in database
 * ```
 */
export async function HashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

/**
 * Compares a plaintext password with a bcrypt hash to verify authentication.
 * 
 * Architecture Decision: Uses bcrypt's constant-time comparison to prevent
 * timing attacks that could reveal information about password correctness.
 * 
 * @param password - The plaintext password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns True if password matches hash, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = await ComparePassword('userPassword123', storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
export async function ComparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}
