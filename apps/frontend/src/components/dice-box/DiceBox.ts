import DiceBox from '@3d-dice/dice-box';

// Theme configuration interface for user preferences
export interface DiceBoxThemeConfig {
    theme?: string;
    themeColor?: string;
    scale?: number;
}

let diceInstance: InstanceType<typeof DiceBox> | null = null;
let lastConfig: DiceBoxThemeConfig | null = null;

export function getDiceBox(themeConfig?: DiceBoxThemeConfig): InstanceType<typeof DiceBox> {
    const config = {
        theme: themeConfig?.theme || 'rock',
        themeColor: themeConfig?.themeColor || '#3937b8',
        scale: themeConfig?.scale || 3
    };

    // Check if we need to create a new instance due to config change
    const configChanged = !lastConfig ||
        lastConfig.theme !== config.theme ||
        lastConfig.themeColor !== config.themeColor ||
        lastConfig.scale !== config.scale;

    if (!diceInstance) {
        // Create new instance
        diceInstance = new DiceBox({
            id: 'dice-canvas',
            assetPath: '/assets/dice-box/',
            container: '[data-dice-box]',
            theme: config.theme,
            themeColor: config.themeColor,
            scale: config.scale
        });

        lastConfig = config;
    } else if (configChanged) {
        // Create updates object with only the changed properties
        const updates: Partial<DiceBoxThemeConfig> = {};

        if (lastConfig?.theme !== config.theme) {
            updates.theme = config.theme;
        }
        if (lastConfig?.themeColor !== config.themeColor) {
            updates.themeColor = config.themeColor;
        }
        if (lastConfig?.scale !== config.scale) {
            updates.scale = config.scale;
        }

        // Use updateConfig with only the changed properties
        try {
            diceInstance.updateConfig(updates);
            lastConfig = config;
        } catch (error) {
            console.warn('Failed to update DiceBox config, re-creating instance:', error);
            // Fallback to re-creation if updateConfig fails
            diceInstance.destroy?.();
            const existingCanvas = document.getElementById('dice-canvas');
            if (existingCanvas?.parentNode) {
                existingCanvas.parentNode.removeChild(existingCanvas);
            }

            diceInstance = new DiceBox({
                id: 'dice-canvas',
                assetPath: '/assets/dice-box/',
                container: '[data-dice-box]',
                theme: config.theme,
                themeColor: config.themeColor,
                scale: config.scale
            });
            lastConfig = config;
        }
    }

    return diceInstance;
}

export function destroyDiceBox(): void {
    if (diceInstance) {
        diceInstance.destroy?.();
        // also remove the canvas manually just in case
        const existingCanvas = document.getElementById('dice-canvas');
        if (existingCanvas?.parentNode) {
            existingCanvas.parentNode.removeChild(existingCanvas);
        }
        diceInstance = null;
        lastConfig = null;
    }
}
