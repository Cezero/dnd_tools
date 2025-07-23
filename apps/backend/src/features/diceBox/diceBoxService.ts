import { PrismaClient } from '@shared/prisma-client/client';
import { DICE_THEME_NAMES } from '@shared/static-data';
import type {
    DiceBoxAdminConfig,
    CreateDiceBoxAdminConfigRequest,
    UpdateDiceBoxAdminConfigRequest,
    GetAllDiceConfigsResponse
} from '@shared/schema';

const prisma = new PrismaClient();

export class DiceBoxService {
    // Get all available admin dice configurations for user selection
    static async getAvailableConfigs(): Promise<GetAllDiceConfigsResponse> {
        const configs = await prisma.diceBoxAdminConfig.findMany({
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
        });

        return {
            total: configs.length,
            results: configs.map(config => ({
                id: config.id,
                name: config.name,
                isDefault: config.isDefault,
                gravity: config.gravity,
                mass: config.mass,
                friction: config.friction,
                restitution: config.restitution,
                angularDamping: config.angularDamping,
                linearDamping: config.linearDamping,
                spinForce: config.spinForce,
                throwForce: config.throwForce,
                startingHeight: config.startingHeight,
                settleTimeout: config.settleTimeout,
                lightIntensity: config.lightIntensity,
                enableShadows: config.enableShadows,
                shadowTransparency: config.shadowTransparency,
                theme: config.theme,
                themeColor: config.themeColor,
                iconColor: config.iconColor,
                scale: config.scale
            }))
        };
    }

    // Get user's complete dice configuration (base + overrides)
    static async getUserDiceConfig(userId: number): Promise<DiceBoxAdminConfig> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                diceConfigBaseRef: true,
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
                    id: mostRecentConfig.id,
                    name: mostRecentConfig.name,
                    isDefault: mostRecentConfig.isDefault,
                    gravity: mostRecentConfig.gravity,
                    mass: mostRecentConfig.mass,
                    friction: mostRecentConfig.friction,
                    restitution: mostRecentConfig.restitution,
                    angularDamping: mostRecentConfig.angularDamping,
                    linearDamping: mostRecentConfig.linearDamping,
                    spinForce: mostRecentConfig.spinForce,
                    throwForce: mostRecentConfig.throwForce,
                    startingHeight: mostRecentConfig.startingHeight,
                    settleTimeout: mostRecentConfig.settleTimeout,
                    lightIntensity: mostRecentConfig.lightIntensity,
                    enableShadows: mostRecentConfig.enableShadows,
                    shadowTransparency: mostRecentConfig.shadowTransparency,
                    theme: mostRecentConfig.theme,
                    themeColor: mostRecentConfig.themeColor,
                    iconColor: mostRecentConfig.iconColor,
                    scale: mostRecentConfig.scale
                };
            }
            return {
                id: defaultConfig.id,
                name: defaultConfig.name,
                isDefault: defaultConfig.isDefault,
                gravity: defaultConfig.gravity,
                mass: defaultConfig.mass,
                friction: defaultConfig.friction,
                restitution: defaultConfig.restitution,
                angularDamping: defaultConfig.angularDamping,
                linearDamping: defaultConfig.linearDamping,
                spinForce: defaultConfig.spinForce,
                throwForce: defaultConfig.throwForce,
                startingHeight: defaultConfig.startingHeight,
                settleTimeout: defaultConfig.settleTimeout,
                lightIntensity: defaultConfig.lightIntensity,
                enableShadows: defaultConfig.enableShadows,
                shadowTransparency: defaultConfig.shadowTransparency,
                theme: defaultConfig.theme,
                themeColor: defaultConfig.themeColor,
                iconColor: defaultConfig.iconColor,
                scale: defaultConfig.scale
            };
        }

        // Get base config (either user's selected or default)
        const baseConfig = user.diceConfigBaseRef ||
            await prisma.diceBoxAdminConfig.findFirst({ where: { isDefault: true } });

        if (!baseConfig) {
            throw new Error('No dice configuration available');
        }

        // Start with base config
        const mergedConfig: DiceBoxAdminConfig = {
            id: baseConfig.id,
            name: baseConfig.name,
            isDefault: baseConfig.isDefault,
            gravity: baseConfig.gravity,
            mass: baseConfig.mass,
            friction: baseConfig.friction,
            restitution: baseConfig.restitution,
            angularDamping: baseConfig.angularDamping,
            linearDamping: baseConfig.linearDamping,
            spinForce: baseConfig.spinForce,
            throwForce: baseConfig.throwForce,
            startingHeight: baseConfig.startingHeight,
            settleTimeout: baseConfig.settleTimeout,
            lightIntensity: baseConfig.lightIntensity,
            enableShadows: baseConfig.enableShadows,
            shadowTransparency: baseConfig.shadowTransparency,
            theme: baseConfig.theme,
            themeColor: baseConfig.themeColor,
            iconColor: baseConfig.iconColor,
            scale: baseConfig.scale
        };

        // Apply user overrides
        user.diceConfigOverrides.forEach(override => {
            const key = override.propertyName as keyof DiceBoxAdminConfig;
            if (key in mergedConfig) {
                // Convert string value to appropriate type
                const value = this.convertPropertyValue(override.propertyValue, typeof mergedConfig[key]);
                (mergedConfig as any)[key] = value;
            }
        });

        return mergedConfig;
    }

    // Update user's dice configuration
    static async updateUserDiceConfig(userId: number, userConfig: DiceBoxAdminConfig): Promise<void> {
        // Verify base config exists
        const baseConfig = await prisma.diceBoxAdminConfig.findUnique({
            where: { id: userConfig.id }
        });
        if (!baseConfig) {
            throw new Error('Base dice configuration not found');
        }

        // Update user's base config reference
        await prisma.user.update({
            where: { id: userId },
            data: { diceConfigBase: userConfig.id }
        });

        // Clear existing overrides
        await prisma.userDiceConfigOverride.deleteMany({
            where: { userId }
        });

        // Find properties that differ from the base config
        const overrides: Array<{ propertyName: string; propertyValue: string }> = [];
        
        const propertiesToCheck: (keyof DiceBoxAdminConfig)[] = [
            'gravity', 'mass', 'friction', 'restitution', 'angularDamping', 'linearDamping',
            'spinForce', 'throwForce', 'startingHeight', 'settleTimeout', 'lightIntensity',
            'enableShadows', 'shadowTransparency', 'theme', 'themeColor', 'iconColor', 'scale'
        ];

        propertiesToCheck.forEach(property => {
            const baseValue = baseConfig[property];
            const userValue = userConfig[property];
            
            if (baseValue !== userValue) {
                overrides.push({
                    propertyName: property,
                    propertyValue: String(userValue)
                });
            }
        });

        // Create new overrides if any exist
        if (overrides.length > 0) {
            await prisma.userDiceConfigOverride.createMany({
                data: overrides.map(override => ({
                    userId,
                    propertyName: override.propertyName,
                    propertyValue: override.propertyValue
                }))
            });
        }
    }



    // Helper: Convert string property value to appropriate type
    private static convertPropertyValue(value: string, targetType: string): any {
        switch (targetType) {
            case 'number':
                return parseFloat(value);
            case 'boolean':
                return value === 'true';
            default:
                return value;
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

        return {
            id: config.id,
            name: config.name,
            isDefault: config.isDefault,
            gravity: config.gravity,
            mass: config.mass,
            friction: config.friction,
            restitution: config.restitution,
            angularDamping: config.angularDamping,
            linearDamping: config.linearDamping,
            spinForce: config.spinForce,
            throwForce: config.throwForce,
            startingHeight: config.startingHeight,
            settleTimeout: config.settleTimeout,
            lightIntensity: config.lightIntensity,
            enableShadows: config.enableShadows,
            shadowTransparency: config.shadowTransparency,
            theme: config.theme, // 3D dice theme
            themeColor: config.themeColor,
            iconColor: config.iconColor,
            scale: config.scale
        };
    }

    // Create or update the DiceBox admin configuration
    static async createOrUpdateAdminConfig(data: CreateDiceBoxAdminConfigRequest): Promise<DiceBoxAdminConfig> {
        // If this config is being set as default, unset any existing defaults
        if (data.config.isDefault) {
            await prisma.diceBoxAdminConfig.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        let config;

        if (data.id) {
            // Update existing config
            config = await prisma.diceBoxAdminConfig.update({
                where: { id: data.id },
                data: {
                    name: data.config.name ?? 'Default Configuration',
                    isDefault: data.config.isDefault ?? false,
                    gravity: data.config.gravity ?? 1,
                    mass: data.config.mass ?? 1,
                    friction: data.config.friction ?? 0.8,
                    restitution: data.config.restitution ?? 0,
                    angularDamping: data.config.angularDamping ?? 0.4,
                    linearDamping: data.config.linearDamping ?? 0.4,
                    spinForce: data.config.spinForce ?? 4,
                    throwForce: data.config.throwForce ?? 5,
                    startingHeight: data.config.startingHeight ?? 8,
                    settleTimeout: data.config.settleTimeout ?? 5000,
                    lightIntensity: data.config.lightIntensity ?? 1,
                    enableShadows: data.config.enableShadows ?? true,
                    shadowTransparency: data.config.shadowTransparency ?? 0.8,
                    theme: data.config.theme ?? 1, // 3D dice theme ID
                    themeColor: data.config.themeColor ?? '#2e8555',
                    iconColor: data.config.iconColor,
                    scale: data.config.scale ?? 6
                }
            });
        } else {
            // Create new config
            config = await prisma.diceBoxAdminConfig.create({
                data: {
                    name: data.config.name ?? 'Default Configuration',
                    isDefault: data.config.isDefault ?? false,
                    gravity: data.config.gravity ?? 1,
                    mass: data.config.mass ?? 1,
                    friction: data.config.friction ?? 0.8,
                    restitution: data.config.restitution ?? 0,
                    angularDamping: data.config.angularDamping ?? 0.4,
                    linearDamping: data.config.linearDamping ?? 0.4,
                    spinForce: data.config.spinForce ?? 4,
                    throwForce: data.config.throwForce ?? 5,
                    startingHeight: data.config.startingHeight ?? 8,
                    settleTimeout: data.config.settleTimeout ?? 5000,
                    lightIntensity: data.config.lightIntensity ?? 1,
                    enableShadows: data.config.enableShadows ?? true,
                    shadowTransparency: data.config.shadowTransparency ?? 0.8,
                    theme: data.config.theme ?? 1, // 3D dice theme ID
                    themeColor: data.config.themeColor ?? '#2e8555',
                    iconColor: data.config.iconColor,
                    scale: data.config.scale ?? 6
                }
            });
        }

        return {
            id: config.id,
            name: config.name,
            isDefault: config.isDefault,
            gravity: config.gravity,
            mass: config.mass,
            friction: config.friction,
            restitution: config.restitution,
            angularDamping: config.angularDamping,
            linearDamping: config.linearDamping,
            spinForce: config.spinForce,
            throwForce: config.throwForce,
            startingHeight: config.startingHeight,
            settleTimeout: config.settleTimeout,
            lightIntensity: config.lightIntensity,
            enableShadows: config.enableShadows,
            shadowTransparency: config.shadowTransparency,
            theme: config.theme, // 3D dice theme
            themeColor: config.themeColor,
            iconColor: config.iconColor,
            scale: config.scale
        };
    }

    // Get the full DiceBox configuration for use in the frontend
    static async getFullConfig(): Promise<DiceBoxConfig | null> {
        const adminConfig = await this.getAdminConfig();

        if (!adminConfig) return null;

        // Convert numeric theme ID to system name for DiceBox
        const themeData = Object.values(DICE_THEMES).find(theme => theme.id === adminConfig.theme);
        const themeSystemName = themeData?.systemName || 'default';

        // Convert admin config to full config with defaults
        const fullConfig: DiceBoxConfig = {
            id: 'dice-canvas',
            assetPath: '/assets/dice-box/',
            container: '[data-dice-box]',
            gravity: adminConfig.gravity,
            mass: adminConfig.mass,
            friction: adminConfig.friction,
            restitution: adminConfig.restitution,
            angularDamping: adminConfig.angularDamping,
            linearDamping: adminConfig.linearDamping,
            spinForce: adminConfig.spinForce,
            throwForce: adminConfig.throwForce,
            startingHeight: adminConfig.startingHeight,
            settleTimeout: adminConfig.settleTimeout,
            offscreen: true,
            delay: 10,
            lightIntensity: adminConfig.lightIntensity,
            enableShadows: adminConfig.enableShadows,
            shadowTransparency: adminConfig.shadowTransparency,
            theme: themeSystemName, // Convert ID to system name for DiceBox
            preloadThemes: [],
            externalThemes: {},
            themeColor: adminConfig.themeColor,
            scale: adminConfig.scale,
            suspendSimulation: false,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined
        };

        return fullConfig;
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
