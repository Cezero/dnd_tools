import { Request, Response, NextFunction } from 'express';
import { DiceBoxService } from './diceBoxService';
import type { DiceBoxConfig } from '@shared/schema';

export class DiceBoxController {
    // Get available admin dice configurations for user selection
    static async getAvailableConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const configs = await DiceBoxService.getAvailableConfigs();
            res.json(configs);
        } catch (error) {
            next(error);
        }
    }

    // Get user's dice configuration
    static async getUserDiceConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any).id;
            const config = await DiceBoxService.getUserDiceConfig(userId);
            res.json(config);
        } catch (error) {
            next(error);
        }
    }

    // Update user's dice configuration
    static async updateUserDiceConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any).id;
            const userConfig = req.body;
            await DiceBoxService.updateUserDiceConfig(userId, userConfig);
            res.json({ message: 'User dice configuration updated successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Get the current DiceBox admin configuration
    static async getAdminConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const config = await DiceBoxService.getAdminConfig();
            res.json(config);
        } catch (error) {
            next(error);
        }
    }

    // Create or update the DiceBox admin configuration
    static async createOrUpdateAdminConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const config = await DiceBoxService.createOrUpdateAdminConfig(req.body);
            res.json(config);
        } catch (error) {
            next(error);
        }
    }

    // Get the full DiceBox configuration for frontend use
    static async getFullConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const config = await DiceBoxService.getFullConfig();

            if (!config) {
                res.status(404).json({ error: 'No DiceBox configuration found' });
                return;
            }

            res.json(config);
        } catch (error) {
            next(error);
        }
    }



    // Delete a DiceBox admin configuration
    static async deleteAdminConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const configId = parseInt(req.params.id);
            await DiceBoxService.deleteAdminConfig(configId);
            res.json({ message: 'Dice configuration deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
} 
