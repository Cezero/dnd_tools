import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware
 * Provides consistent error responses across the application
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error('Error occurred:', error);

    // Handle Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;

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
    if (error.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: error.message,
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
export function asyncHandler<T extends Request, U extends Response>(
    fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
    return (req: T, res: U, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
} 