import { z } from 'zod';

/**
 * Converts a query param like "true"/"false" to a boolean, or undefined if missing.
 */
export const optionalBooleanParam = () =>
  z.preprocess(
    (val) =>
      typeof val === 'string'
        ? val === 'true'
        : undefined,
    z.boolean().optional()
  );

/**
 * Converts a query param like "123" to an integer, or undefined if missing.
 */
export const optionalIntegerParam = () =>
  z.preprocess(
    (val) =>
      typeof val === 'string' && val !== ''
        ? parseInt(val, 10)
        : undefined,
    z.number().int().optional()
  );

/**
 * Converts a query param like "abc" to a string, or undefined if missing.
 */
export const optionalStringParam = () =>
  z.preprocess(
    (val) => (typeof val === 'string' && val !== '' ? val : undefined),
    z.string().optional()
  );
