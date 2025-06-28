import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret';

interface UpdateUserProfileRequest {
    preferredEditionId?: number;
}

export async function GetUserProfile(req: Request, res: Response) {
    try {
        const id = req.user?.user_id; // Assuming user ID is available from authentication middleware
        if (!id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                isAdmin: true,
                preferredEditionId: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function UpdateUserProfile(req: Request<{}, {}, UpdateUserProfileRequest>, res: Response) {
    try {
        const id = req.user?.user_id;
        if (!id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { preferredEditionId } = req.body;

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                preferredEditionId
            },
            select: {
                id: true,
                username: true,
                email: true,
                isAdmin: true,
                preferredEditionId: true
            }
        });

        const newToken = jwt.sign(
            {
                id: updatedUser.id,
                username: updatedUser.username,
                is_admin: updatedUser.isAdmin,
                preferred_edition_id: updatedUser.preferredEditionId
            },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            message: 'User profile updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                is_admin: updatedUser.isAdmin,
                preferred_edition_id: updatedUser.preferredEditionId
            },
            token: newToken
        });
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
} 