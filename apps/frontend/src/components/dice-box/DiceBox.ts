import DiceBox from '@3d-dice/dice-box';

// Full DiceBox configuration interface
export interface DiceBoxThemeConfig {
    // Visual properties
    theme?: string;
    themeColor?: string;
    scale?: number;
    lightIntensity?: number;
    enableShadows?: boolean;
    shadowTransparency?: number;

    // Physics properties
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    angularDamping?: number;
    linearDamping?: number;
    spinForce?: number;
    throwForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
}

// this is the list of properties that can be passed
// to the DiceBox.updateConfig() function
// Do not add any other properties to this type
// it is the source of truth for the DiceBox.updateConfig() function
type DiceBoxConfig = {
    enableShadows: boolean;
    shadowTransparency: number;
    lightIntensity: number;
    delay: number;
    gravity: number;
    mass: number;
    friction: number;
    restitution: number;
    linearDamping: number;
    angularDamping: number;
    startingHeight: number;
    settleTimeout: number;
    spinForce: number;
    throwForce: number;
    scale: number;
    themeColor: string;
    theme: string[]
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
            scale: config.scale,
            offscreen: false // Disable offscreen rendering to avoid transfer conflicts
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
                scale: config.scale,
                offscreen: false // Disable offscreen rendering to avoid transfer conflicts
            });
            lastConfig = config;
        }
    }

    return diceInstance;
}

export function destroyDiceBox(): void {
    if (diceInstance) {
        try {
            // Properly destroy the DiceBox instance
            diceInstance.destroy?.();
        } catch (error) {
            console.warn('Error during DiceBox destroy:', error);
        }

        // Remove the canvas element completely
        const existingCanvas = document.getElementById('dice-canvas') as HTMLCanvasElement | null;
        if (existingCanvas) {
            try {
                // Terminate any offscreen contexts
                if (existingCanvas.transferControlToOffscreen) {
                    // Force the canvas to be unusable for offscreen transfer
                    existingCanvas.width = 0;
                    existingCanvas.height = 0;
                }

                // Remove from DOM
                if (existingCanvas.parentNode) {
                    existingCanvas.parentNode.removeChild(existingCanvas);
                }
            } catch (error) {
                console.warn('Error removing canvas:', error);
            }
        }

        // Reset the singleton state
        diceInstance = null;
        lastConfig = null;

        // Force garbage collection hint (if available)
        if (typeof window !== 'undefined' && (window as any).gc) {
            (window as any).gc();
        }
    }
}
