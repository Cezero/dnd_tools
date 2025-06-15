// src/middleware/requireAuthExcept.js
import { match } from 'path-to-regexp';
import { requireAuth } from './requireAuth.js';

const publicPaths = [
  '/health',
  '/api/auth/login',
  '/api/auth/register'
];

export function requireAuthExcept(req, res, next) {
  const isPublic = publicPaths.some((path) => match(path, { end: true })(req.path));
  if (isPublic) return next();
  return requireAuth(req, res, next);
}
