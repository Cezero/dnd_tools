import { timedQuery } from '../db/queryTimer.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret';

export async function getUserProfile(req, res) {
    try {
        const user_id = req.user.user_id; // Assuming user ID is available from authentication middleware
        const [user] = await timedQuery(
            'SELECT user_id, username, email, is_admin, preferred_edition_id FROM users WHERE user_id = ?',
            [user_id],
            'Fetch user profile'
        );

        if (!user || user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: user[0] });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function updateUserProfile(req, res) {
    const { preferred_edition_id } = req.body;
    const { user_id } = req.user; // req.user populated by authentication middleware

    try {
        let updateFields = [];
        let updateValues = [];

        if (preferred_edition_id !== undefined) {
            updateFields.push('preferred_edition_id = ?');
            updateValues.push(preferred_edition_id);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
        updateValues.push(user_id);

        await timedQuery(
            updateQuery,
            updateValues,
            'Update user profile'
        );

        // Fetch updated user to return in response and generate new token
        const users = await timedQuery(
            'SELECT user_id, username, email, is_admin, preferred_edition_id FROM users WHERE user_id = ?',
            [user_id],
            'Get updated user for profile update'
        );

        if (!users.length) {
            return res.status(404).json({ error: 'User not found after update' });
        }
        const user = users[0];

        const newToken = jwt.sign(
            { user_id: user.user_id, username: user.username, is_admin: user.is_admin, preferred_edition_id: user.preferred_edition_id },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ message: 'User profile updated successfully', user: { user_id: user.user_id, username: user.username, is_admin: user.is_admin, preferred_edition_id: user.preferred_edition_id }, token: newToken });
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
} 