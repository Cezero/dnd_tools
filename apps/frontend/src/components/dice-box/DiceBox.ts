// Re-export the Zod schema type for consistency
export type { DiceBoxAdminConfig } from '@shared/schema';

// This is the list of properties that can be passed
// to the DiceBox.updateConfig() function
// Do not add any other properties to this type
// it is the source of truth for the DiceBox.updateConfig() function
export type DiceBoxConfig = {
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
