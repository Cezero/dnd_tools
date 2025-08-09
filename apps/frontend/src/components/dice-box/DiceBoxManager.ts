import DiceBox from '@3d-dice/dice-box';
import DiceParser from '@3d-dice/dice-parser-interface';

import { DiceBoxService } from '@/services/DiceBoxService';
import type { DiceBoxAdminConfig, UserDiceConfig } from '@shared/schema';
import { getSystemNameById } from '@shared/static-data';

import type { DiceBoxConfig } from './DiceBox';

export interface DiceResult {
    notation: string;
    results: number[];
    total: number;
    group?: string;
}

export class DiceBoxManager {
    private instance: InstanceType<typeof DiceBox> | null = null;
    private isInitialized = false;
    private onRollCompleteCallbacks: ((result: DiceResult) => void)[] = [];
    private diceParser: DiceParser;
    private currentCritHighlight = false;
    private isRolling = false; // Add rolling state tracking

    // Admin config cache for performance
    private adminConfigsCache: Map<number, DiceBoxAdminConfig> = new Map();
    private cacheInitialized = false;
    private currentIconColor: string | null = null;
    private currentMergedConfig: DiceBoxAdminConfig | null = null;

    constructor() {
        this.diceParser = new DiceParser();
    }

    // Initialize with UserDiceConfig (for normal user usage)
    async initializeWithUserConfig(userConfig: UserDiceConfig): Promise<void> {
        // Ensure cache is initialized
        await this.initializeCache();

        // Merge user config with admin config
        const mergedConfig = this.mergeUserConfigWithAdminConfig(userConfig);

        // Initialize with merged config
        await this.initialize(mergedConfig);
    }

    // Initialize with complete admin config (for admin testing)
    async initializeWithAdminConfig(adminConfig: DiceBoxAdminConfig): Promise<void> {
        await this.initialize(adminConfig);
    }

    // Legacy initialize method (for backward compatibility)
    async initialize(config?: Partial<DiceBoxAdminConfig>): Promise<void> {
        if (this.isInitialized && this.instance) {
            return;
        }

        // Wait for container to be available
        await this.waitForContainer();

        // Create new instance
        this.instance = new DiceBox({
            id: 'dice-canvas',
            assetPath: '/assets/dice-box/',
            container: '[data-dice-box]',
            theme: config?.theme ? getSystemNameById(config.theme) : 'rock',
            themeColor: config?.themeColor || '#3937b8',
            scale: config?.scale || 3,
            offscreen: false
        });

        // Initialize
        await this.instance.init();
        this.isInitialized = true;

        // Cache the current icon color if config was provided
        if (config) {
            this.currentIconColor = (config as any).iconColor || config.themeColor || '#3937b8';
        }

        // Set up roll complete handler
        this.instance.onRollComplete = (results: any) => {
            this.handleRollComplete(results);
        };

        // Set up click handler to hide dice
        const handleMouseDown = () => {
            // Don't hide dice if they are currently rolling
            if (this.isRolling) {
                return;
            }

            const diceBoxCanvas = document.getElementById('dice-canvas');
            if (diceBoxCanvas && window.getComputedStyle(diceBoxCanvas).display !== "none") {
                this.instance?.hide().clear();
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
    }

    // Admin config caching methods
    async initializeCache(): Promise<void> {
        if (this.cacheInitialized) {
            return;
        }

        try {
            const configs = await DiceBoxService.getAvailableConfigs();
            this.adminConfigsCache.clear();

            configs.results.forEach(config => {
                this.adminConfigsCache.set(config.id, config);
            });

            this.cacheInitialized = true;
        } catch (error) {
            console.error('Failed to initialize admin config cache:', error);
            throw error;
        }
    }

    async refreshCache(): Promise<void> {
        this.cacheInitialized = false;
        await this.initializeCache();
    }

    getCachedAdminConfig(configId: number): DiceBoxAdminConfig | undefined {
        return this.adminConfigsCache.get(configId);
    }

    // Merge UserDiceConfig with admin config
    mergeUserConfigWithAdminConfig(userConfig: UserDiceConfig): DiceBoxAdminConfig {
        const adminConfig = this.adminConfigsCache.get(userConfig.baseConfigId);
        if (!adminConfig) {
            throw new Error(`Admin config with ID ${userConfig.baseConfigId} not found in cache`);
        }

        // Start with admin config
        const mergedConfig: DiceBoxAdminConfig = { ...adminConfig };

        // Apply user overrides
        Object.entries(userConfig.overrides).forEach(([key, value]) => {
            const propertyKey = key as keyof DiceBoxAdminConfig;
            if (propertyKey in mergedConfig) {
                // Convert string value to appropriate type
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    (mergedConfig as any)[propertyKey] = numValue;
                } else if (value === 'true' || value === 'false') {
                    (mergedConfig as any)[propertyKey] = value === 'true';
                } else {
                    (mergedConfig as any)[propertyKey] = value;
                }
            }
        });

        // Apply color hierarchy logic
        // 1. Use user iconColor override if present
        // 2. Else use user themeColor override if present  
        // 3. Else use admin config iconColor if present
        // 4. Else use admin config themeColor if present
        // 5. Else use default #3937b8
        const userIconColor = userConfig.overrides.iconColor;
        const userThemeColor = userConfig.overrides.themeColor;
        const adminIconColor = adminConfig.iconColor;
        const adminThemeColor = adminConfig.themeColor;

        const finalIconColor = userIconColor || userThemeColor || adminIconColor || adminThemeColor || '#3937b8';

        // Set the iconColor in the merged config
        (mergedConfig as any).iconColor = finalIconColor;

        return mergedConfig;
    }

    private async waitForContainer(): Promise<void> {
        for (let i = 0; i < 20; i++) {
            const el = document.querySelector('[data-dice-box]');
            if (el) {
                const containerRect = el.getBoundingClientRect();
                if (containerRect.width > 0 && containerRect.height > 0) {
                    return;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Failed to find [data-dice-box] container after waiting');
    }

    private handleRollComplete(results: any): void {
        try {
            console.log('results', results);

            // Handle each group result individually
            if (Array.isArray(results)) {
                results.forEach((groupResult) => {
                    // Parse each individual group result using dice-parser-interface
                    const parsedResult = this.diceParser.parseFinalResults(groupResult);
                    console.log('parsedResult', parsedResult);

                    // Preserve the original notation and group from the group result
                    if (parsedResult) {
                        parsedResult.originalNotation = groupResult.originalNotation;
                        parsedResult.group = groupResult.group;
                        parsedResult.critHighlight = this.currentCritHighlight;
                    }

                    // Pass the parsed result to callbacks
                    this.onRollCompleteCallbacks.forEach(callback => {
                        callback(parsedResult);
                    });
                });
            } else {
                // Handle single result
                const parsedResult = this.diceParser.parseFinalResults(results);
                console.log('parsedResult', parsedResult);

                // Preserve the original notation and group from the result
                if (parsedResult) {
                    parsedResult.originalNotation = results.originalNotation;
                    parsedResult.group = results.group;
                    parsedResult.critHighlight = this.currentCritHighlight;
                }

                // Pass the parsed result to callbacks
                this.onRollCompleteCallbacks.forEach(callback => {
                    callback(parsedResult);
                });
            }
        } catch (error) {
            console.error('Error handling roll complete:', error);
        } finally {
            this.isRolling = false; // Reset rolling state after completion
        }
    }

    roll(notation: string, critHighlight?: boolean): void {
        this.currentCritHighlight = critHighlight || false;
        this.rollGroups([notation]);
    }

    rollGroups(notations: string[], groups?: string[], critHighlight?: boolean): void {
        if (!this.instance || !this.isInitialized) {
            console.warn('DiceBox not initialized');
            return;
        }

        this.currentCritHighlight = critHighlight || false;
        this.isRolling = true; // Set rolling state to true

        try {
            // Check if canvas exists and show it
            const canvas = document.getElementById('dice-canvas');
            if (canvas) {
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
            }

            // Parse each notation using dice-parser-interface
            const dieGroups = notations.map((notation, index) => {
                const parsed = this.diceParser.parseNotation(notation);
                // Add group information if provided
                if (groups && groups[index]) {
                    parsed.forEach(group => {
                        group.group = groups[index];
                        group.originalNotation = notation; // Store original notation
                    });
                }
                return parsed;
            }).flat();

            this.instance.roll(dieGroups);
        } catch (error) {
            console.error('Error during dice roll:', error);
            this.isRolling = false; // Reset rolling state on error
        }
    }

    onRollComplete(callback: (result: any) => void): () => void {
        this.onRollCompleteCallbacks.push(callback);

        // Return cleanup function
        return () => {
            const index = this.onRollCompleteCallbacks.indexOf(callback);
            if (index > -1) {
                this.onRollCompleteCallbacks.splice(index, 1);
            }
        };
    }

    // Update config with UserDiceConfig (for normal user usage)
    async updateConfigWithUserConfig(userConfig: UserDiceConfig): Promise<void> {
        // Ensure cache is initialized
        await this.initializeCache();

        // Merge user config with admin config
        const mergedConfig = this.mergeUserConfigWithAdminConfig(userConfig);

        // Store the merged config for color resolution
        this.currentMergedConfig = mergedConfig;

        // Update with merged config
        this.updateConfig(mergedConfig);
    }

    // Update config with complete admin config (for admin testing)
    updateConfigWithAdminConfig(adminConfig: Partial<DiceBoxAdminConfig>): void {
        this.updateConfig(adminConfig);
    }

    // update the underlying dice box config
    updateConfig(config: Partial<DiceBoxAdminConfig>): void {
        if (!this.instance || !this.isInitialized) {
            return;
        }

        try {
            // Convert theme ID to theme name if present
            const diceBoxConfig = {
                ...config,
                theme: config.theme ? getSystemNameById(config.theme) : undefined
            };

            // Cache the current icon color (color hierarchy is handled in mergeUserConfigWithAdminConfig)
            this.currentIconColor = (config as any).iconColor || '#3937b8';

            this.instance.updateConfig(diceBoxConfig);
        } catch (error) {
            console.error('Failed to update DiceBox config:', error);
        }
    }

    destroy(): void {
        if (this.instance) {
            try {
                // Clear any existing dice if the method exists
                if (typeof this.instance.clear === 'function') {
                    this.instance.clear();
                }
            } catch (error) {
                console.warn('Error during DiceBox cleanup:', error);
            }

            // Remove the canvas element
            const existingCanvas = document.getElementById('dice-canvas');
            if (existingCanvas?.parentNode) {
                existingCanvas.parentNode.removeChild(existingCanvas);
            }

            this.instance = null;
            this.isInitialized = false;
            this.onRollCompleteCallbacks = [];
            this.isRolling = false; // Reset rolling state
        }

        // Clear cache on destroy
        this.adminConfigsCache.clear();
        this.cacheInitialized = false;
    }

    // Method to manually reset rolling state if needed
    resetRollingState(): void {
        this.isRolling = false;
    }

    get isReady(): boolean {
        return this.isInitialized && this.instance !== null;
    }

    get isCurrentlyRolling(): boolean {
        return this.isRolling;
    }

    getCurrentIconColor(): string {
        return this.currentIconColor || '#3937b8';
    }
} 
