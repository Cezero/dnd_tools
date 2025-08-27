import { PrismaClient } from '@shared/prisma-client/client';
import type {
    DiceBoxAdminConfig,
    CreateDiceBoxAdminConfigRequest,
    UpdateDiceBoxAdminConfigRequest,
    GetAllDiceConfigsResponse,
    UserDiceConfig
} from '@shared/schema';

const prisma = new PrismaClient();

export class DiceBoxService {
    // Get all available admin dice configurations for user selection
    static async getAvailableConfigs(): Promise<GetAllDiceConfigsResponse> {
        const configs = await prisma.diceBoxAdminConfig.findMany({
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
        });

        return { total: configs.length, results: configs };
    }

    // Get user's dice configuration (baseConfigId + overrides)
    static async getUserDiceConfig(userId: number): Promise<UserDiceConfig> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                diceConfigOverrides: true
            }
        });

        if (!user) {
            // If no user found, return default config
            const defaultConfig = await prisma.diceBoxAdminConfig.findFirst({ where: { isDefault: true } });
            if (!defaultConfig) {
                // If no default config, return most recent config
                const mostRecentConfig = await prisma.diceBoxAdminConfig.findFirst({
                    orderBy: { updatedAt: 'desc' }
                });
                if (!mostRecentConfig) {
                    throw new Error('No dice configuration available');
                }
                return {
                    diceConfigBase: mostRecentConfig.id,
                    diceConfigOverrides: []
                };
            }
            return {
                diceConfigBase: defaultConfig.id,
                diceConfigOverrides: []
            };
        }

        // Get base config (either user's selected or default)
        const baseConfig = user.diceConfigBase
            ? await prisma.diceBoxAdminConfig.findUnique({ where: { id: user.diceConfigBase } })
            : await prisma.diceBoxAdminConfig.findFirst({ where: { isDefault: true } });

        if (!baseConfig) {
            throw new Error('No dice configuration available');
        }

        // Convert overrides to array format
        const overrides = user.diceConfigOverrides.map(override => ({
            id: override.id,
            userId: override.userId,
            propertyName: override.propertyName,
            propertyValue: override.propertyValue
        }));

        return {
            diceConfigBase: baseConfig.id,
            diceConfigOverrides: overrides
        };
    }

    // Update user's dice configuration
    static async updateUserDiceConfig(userId: number, diceConfigBase: number, diceConfigOverrides: Array<{ propertyName: string; propertyValue: string }>): Promise<void> {
        // Verify base config exists
        const baseConfig = await prisma.diceBoxAdminConfig.findUnique({
            where: { id: diceConfigBase }
        });
        if (!baseConfig) {
            throw new Error('Base dice configuration not found');
        }

        // Update user's base config reference
        await prisma.user.update({
            where: { id: userId },
            data: { diceConfigBase: diceConfigBase }
        });

        // Clear existing overrides
        await prisma.userDiceConfigOverride.deleteMany({
            where: { userId }
        });

        // Create new overrides if any exist
        if (diceConfigOverrides && diceConfigOverrides.length > 0) {
            await prisma.userDiceConfigOverride.createMany({
                data: diceConfigOverrides.map(override => ({
                    userId,
                    propertyName: override.propertyName,
                    propertyValue: override.propertyValue
                }))
            });
        }
    }

    // Get the current DiceBox admin configuration
    static async getAdminConfig(): Promise<DiceBoxAdminConfig | null> {
        // First try to get the default config
        let config = await prisma.diceBoxAdminConfig.findFirst({
            where: { isDefault: true },
            orderBy: { updatedAt: 'desc' }
        });

        // If no default config, get the most recent one
        if (!config) {
            config = await prisma.diceBoxAdminConfig.findFirst({
                orderBy: { updatedAt: 'desc' }
            });
        }

        if (!config) return null;

        return config;
    }

    // Create a new DiceBox admin configuration
    static async createAdminConfig(data: CreateDiceBoxAdminConfigRequest): Promise<DiceBoxAdminConfig> {
        // If this config is being set as default, unset any existing defaults
        if (data.config.isDefault) {
            await prisma.diceBoxAdminConfig.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const config = await prisma.diceBoxAdminConfig.create({
            data: data.config
        });

        return config;
    }

    // Update an existing DiceBox admin configuration
    static async updateAdminConfig(configId: number, data: UpdateDiceBoxAdminConfigRequest): Promise<DiceBoxAdminConfig> {
        // If this config is being set as default, unset any existing defaults
        if (data.config.isDefault) {
            await prisma.diceBoxAdminConfig.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const config = await prisma.diceBoxAdminConfig.update({
            where: { id: configId },
            data: data.config
        });

        return config;
    }

    // Get the current DiceBox admin configuration
    static async getFullConfig(): Promise<DiceBoxAdminConfig | null> {
        return await this.getAdminConfig();
    }

    // Delete a DiceBox admin configuration
    static async deleteAdminConfig(configId: number): Promise<void> {
        // Check if this config is being used by any users
        const usersUsingConfig = await prisma.user.findMany({
            where: { diceConfigBase: configId }
        });

        if (usersUsingConfig.length > 0) {
            throw new Error(`Cannot delete configuration: ${usersUsingConfig.length} user(s) are currently using this configuration`);
        }

        // Check if this is the default config
        const config = await prisma.diceBoxAdminConfig.findUnique({
            where: { id: configId }
        });

        if (config?.isDefault) {
            throw new Error('Cannot delete the default configuration');
        }

        // Delete the configuration
        await prisma.diceBoxAdminConfig.delete({
            where: { id: configId }
        });
    }
} 
