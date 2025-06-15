// src/middleware/requireAdmin.js
import { requireAuth } from './requireAuth.js';

export function requireAdmin(req, res, next) {
  // Assuming requireAuth has already run and populated req.user
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
