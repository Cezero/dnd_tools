import { Response } from 'express';

import { ValidatedNoInput, ValidatedBodyT, ValidatedParamsBodyT, ValidatedParamsT } from '@/util/validated-types';
import {
    CreateDiceBoxAdminConfigRequest,
    UpdateDiceBoxAdminConfigRequest,
    DiceBoxConfigIdParamRequest,
    UpdateUserDiceConfigRequest
} from '@shared/schema';

import { DiceBoxService } from './diceBoxService';

export class DiceBoxController {
    // Get available admin dice configurations for user selection
    static async getAvailableConfigs(req: ValidatedNoInput, res: Response): Promise<void> {
        try {
            const configs = await DiceBoxService.getAvailableConfigs();
            res.json(configs);
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get user's dice configuration
    static async getUserDiceConfig(req: ValidatedNoInput, res: Response): Promise<void> {
        try {
            const userId = req.user!.id; // Safe to use ! because requireAuth middleware guarantees user exists
            const config = await DiceBoxService.getUserDiceConfig(userId);
            res.json(config);
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Update user's dice configuration
    static async updateUserDiceConfig(req: ValidatedBodyT<UpdateUserDiceConfigRequest>, res: Response): Promise<void> {
        try {
            const userId = req.user!.id; // Safe to use ! because requireAuth middleware guarantees user exists
            const { diceConfigBase, diceConfigOverrides } = req.body;
            await DiceBoxService.updateUserDiceConfig(userId, diceConfigBase, diceConfigOverrides);
            res.json({ message: 'User dice configuration updated successfully' });
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get the current DiceBox admin configuration
    static async getAdminConfig(req: ValidatedNoInput, res: Response): Promise<void> {
        try {
            const config = await DiceBoxService.getAdminConfig();
            res.json(config);
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Create a new DiceBox admin configuration
    static async createAdminConfig(req: ValidatedBodyT<CreateDiceBoxAdminConfigRequest>, res: Response): Promise<void> {
        try {
            await DiceBoxService.createAdminConfig(req.body);
            res.json({ message: 'Dice configuration created successfully' });
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Update an existing DiceBox admin configuration
    static async updateAdminConfig(req: ValidatedParamsBodyT<DiceBoxConfigIdParamRequest, UpdateDiceBoxAdminConfigRequest>, res: Response): Promise<void> {
        try {
            const configId = req.params.id;
            await DiceBoxService.updateAdminConfig(configId, req.body);
            res.json({ message: 'Dice configuration updated successfully' });
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get the full DiceBox configuration for frontend use
    static async getFullConfig(req: ValidatedNoInput, res: Response): Promise<void> {
        try {
            const config = await DiceBoxService.getFullConfig();

            if (!config) {
                res.status(404).json({ error: 'No DiceBox configuration found' });
                return;
            }

            res.json(config);
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Delete a DiceBox admin configuration
    static async deleteAdminConfig(req: ValidatedParamsT<DiceBoxConfigIdParamRequest>, res: Response): Promise<void> {
        try {
            const configId = req.params.id;
            await DiceBoxService.deleteAdminConfig(configId);
            res.json({ message: 'Dice configuration deleted successfully' });
        } catch (_error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
} 
