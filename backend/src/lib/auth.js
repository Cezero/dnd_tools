// backend/auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'supersecret';

export function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, username: user.username }, SECRET, { expiresIn: '12h' });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
