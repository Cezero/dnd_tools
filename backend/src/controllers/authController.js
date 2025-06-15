// src/controllers/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { timedQuery } from '../db/queryTimer.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret';

// Register
export async function registerUser(req, res) {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ error: 'Missing fields' });

    try {
        const [existing] = await timedQuery(
            'SELECT user_id FROM users WHERE username = ? OR email = ?',
            [username, email],
            'Check for existing user'
        );
        if (existing.length)
            return res.status(409).json({ error: 'Username or email already exists' });

        const hash = await bcrypt.hash(password, 12);
        await timedQuery(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, hash],
            'Create new user'
        );
        return res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Login
export async function loginUser(req, res) {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Missing credentials' });

    try {
        const rows = await timedQuery(
            'SELECT user_id, username, password_hash, is_admin, preferred_edition_id FROM users WHERE username = ?',
            [username],
            'Login user'
        );
        if (!rows.length)
            return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match)
            return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, is_admin: user.is_admin, preferred_edition_id: user.preferred_edition_id },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({ token, user: { user_id: user.user_id, username: user.username, is_admin: user.is_admin, preferred_edition_id: user.preferred_edition_id } });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Get User from Token
export async function getUserFromToken(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Fetch user from DB to ensure current preferred_edition_id and other up-to-date info
        const users = await timedQuery(
            'SELECT user_id, username, is_admin, preferred_edition_id FROM users WHERE user_id = ?',
            [decoded.user_id],
            'Get user by ID for token validation'
        );

        if (!users.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        return res.json({ user: { user_id: user.user_id, username: user.username, is_admin: user.is_admin, preferred_edition_id: user.preferred_edition_id } });
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

// Refresh Token
export async function refreshToken(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Fetch user from DB to get current preferred_edition_id for new token
        const users = await timedQuery(
            'SELECT user_id, username, is_admin, preferred_edition_id FROM users WHERE user_id = ?',
            [decoded.user_id],
            'Get user by ID for token refresh'
        );

        if (!users.length) {
            return res.status(404).json({ error: 'User not found for token refresh' });
        }
        const user = users[0];

        // Generate a new token with a refreshed expiration and updated preferred_edition_id
        const newToken = jwt.sign(
            { user_id: user.user_id, username: user.username, is_admin: user.is_admin, preferred_edition_id: user.preferred_edition_id },
            JWT_SECRET,
            { expiresIn: '12h' }
        );
        return res.json({ token: newToken });
    } catch (err) {
        console.error('Token refresh error:', err);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}
