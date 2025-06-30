// middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Schemas = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
};

export function validateRequest(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.headers) req.headers = schemas.headers.parse(req.headers);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors,
        });
      }
      next(err);
    }
  };
}
