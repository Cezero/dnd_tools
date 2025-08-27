import { DiceBoxService } from '@/components/dice-box/DiceBoxService';
import type {
    DiceBoxAdminConfig,
    GetAllDiceConfigsResponse
} from '@shared/schema';

export class DiceConfigurationFacade {
    /**
     * Get the current DiceBox admin configuration
     */
    static async getAdminConfig(): Promise<DiceBoxAdminConfig | null> {
        return DiceBoxService.getAdminConfig();
    }

    /**
     * Create a new admin configuration
     */
    static async createAdminConfig(config: DiceBoxAdminConfig): Promise<{ message: string }> {
        return DiceBoxService.createAdminConfig({ config });
    }

    /**
     * Update the DiceBox admin configuration
     */
    static async updateAdminConfig(config: DiceBoxAdminConfig): Promise<{ message: string }> {
        return DiceBoxService.updateAdminConfig({ config });
    }

    /**
     * Delete a DiceBox admin configuration
     */
    static async deleteAdminConfig(configId: number): Promise<{ message: string }> {
        return DiceBoxService.deleteAdminConfig(configId);
    }

    /**
     * Get available configurations for user selection
     */
    static async getAvailableConfigs(): Promise<GetAllDiceConfigsResponse> {
        return DiceBoxService.getAvailableConfigs();
    }

    /**
     * Get default configuration
     */
    static getDefaultConfig(): DiceBoxAdminConfig {
        return {
            id: 0, // Temporary ID for new configs
            name: 'Default Configuration',
            isDefault: false,
            gravity: 1,
            mass: 1,
            friction: 0.8,
            restitution: 0,
            angularDamping: 0.4,
            linearDamping: 0.4,
            spinForce: 4,
            throwForce: 5,
            startingHeight: 8,
            settleTimeout: 5000,
            lightIntensity: 1,
            enableShadows: true,
            shadowTransparency: 0.8,
            theme: 1, // Default theme ID
            themeColor: '#2e8555',
            iconColor: null,
            scale: 6
        };
    }
} 
