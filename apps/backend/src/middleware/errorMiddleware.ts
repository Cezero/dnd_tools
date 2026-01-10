/**
 * Centralized error handling middleware for Express applications.
 * 
 * This module provides comprehensive error handling that:
 * - Catches and formats all application errors
 * - Maps errors to appropriate HTTP status codes
 * - Provides consistent error response format
 * - Handles Prisma database errors
 * - Handles Zod validation errors
 * - Handles custom application errors
 * 
 * Architecture Decisions:
 * - Centralized error handling: All errors flow through this middleware, ensuring
 *   consistent error responses across the application
 * - Error classification: Errors are classified by type (BaseError, PrismaError, ZodError)
 *   to provide appropriate status codes and messages
 * - Security: Generic error messages for unexpected errors prevent information leakage
 * - Logging: All errors are logged server-side for debugging while clients receive
 *   user-friendly messages
 * 
 * Usage:
 * This middleware must be registered last in the Express app middleware chain to catch
 * all errors from route handlers and other middleware.
 * 
 * Source File: `apps/backend/src/middleware/errorMiddleware.ts`
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError } from 'zod';

import { BaseError } from '@/errors/BaseError';
import { PrismaClientKnownRequestError } from '@shared/prisma-client/client/runtime/library';

/**
 * Centralized error handling middleware.
 * 
 * Provides consistent error responses across the application by:
 * 1. Catching all errors from route handlers and middleware
 * 2. Classifying errors by type (BaseError, PrismaError, ZodError, etc.)
 * 3. Mapping errors to appropriate HTTP status codes
 * 4. Returning consistent error response format
 * 
 * Error Classification Strategy:
 * - BaseError: Custom application errors with status codes (400, 401, 403, 404, etc.)
 * - PrismaClientKnownRequestError: Database errors (unique constraint, not found, foreign key)
 * - ZodError: Validation errors from Zod schema validation
 * - Generic errors: Unexpected errors return 500 with generic message
 * 
 * Architecture Decision: Errors are logged server-side but clients receive sanitized
 * messages to prevent information leakage about system internals.
 * 
 * @param error - The error object from route handlers or middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (unused, required by signature)
 * 
 * @example
 * ```typescript
 * app.use(errorHandler); // Must be last middleware
 * ```
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Error occurred:', error);

    if (error instanceof BaseError) {
        res.status(error.status).json({
            success: false,
            error: error.message,
        });
        return;
    }

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as PrismaClientKnownRequestError;

        switch (prismaError.code) {
            case 'P2002':
                res.status(409).json({
                    success: false,
                    error: 'A record with this unique field already exists',
                });
                return;
            case 'P2025':
                res.status(404).json({
                    success: false,
                    error: 'Record not found',
                });
                return;
            case 'P2003':
                res.status(400).json({
                    success: false,
                    error: 'Foreign key constraint violation',
                });
                return;
            default:
                res.status(500).json({
                    success: false,
                    error: 'Database operation failed',
                });
                return;
        }
    }

    // Handle validation errors
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: error.issues,
        });
        return;
    }

    // Handle custom application errors
    if (error.message.includes('not found')) {
        res.status(404).json({
            success: false,
            error: error.message,
        });
        return;
    }

    if (error.message.includes('validation') || error.message.includes('invalid')) {
        res.status(400).json({
            success: false,
            error: error.message,
        });
        return;
    }

    // Default error response
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
}

/**
 * Async error wrapper for route handlers.
 * 
 * Express does not automatically catch errors from async route handlers. This wrapper
 * ensures async errors are properly caught and passed to the error handling middleware.
 * 
 * Architecture Decision: Using Promise.resolve().catch() ensures both sync and async
 * errors are handled consistently. Without this wrapper, unhandled promise rejections
 * in async handlers would crash the application.
 * 
 * Usage:
 * Wrap async route handlers with this function to ensure errors are caught:
 * 
 * @param fn - Async route handler function
 * @returns Express middleware function that catches async errors
 * 
 * @example
 * ```typescript
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUserService();
 *   res.json(users);
 * }));
 * ```
 * 
 * Note: With buildValidatedRouter, this is typically not needed as the validated
 * router handles async errors automatically. However, it's available for cases where
 * direct Express router methods are used.
 */
export function asyncHandler<
    P = z.ZodUndefined,
    ResBody = unknown,
    ReqBody = z.ZodUndefined,
    ReqQuery = z.ZodUndefined
>(
    fn: (
        req: Request<P, ResBody, ReqBody, ReqQuery>,
        res: Response<ResBody>,
        next: NextFunction
    ) => Promise<void>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
