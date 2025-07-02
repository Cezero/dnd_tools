import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError } from 'zod';

import { BaseError } from '@/errors/BaseError';
import { PrismaClientKnownRequestError } from '@shared/prisma-client/client/runtime/library';

/**
 * Centralized error handling middleware
 * Provides consistent error responses across the application
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
            error: error.errors,
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
 * Async error wrapper for route handlers
 * Automatically catches async errors and passes them to error middleware
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