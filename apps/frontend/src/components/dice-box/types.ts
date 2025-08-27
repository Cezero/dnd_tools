import type { DiceRollResult } from '@3d-dice/dice-roller-parser';

import type { UpdateUserDiceConfigRequest, DiceBoxAdminConfig } from '@shared/schema';

/**
 * Color configuration for dice elements
 */
export interface DiceColor {
    /** Main die face color */
    main: string;
    /** Die edge color */
    edges: string;
    /** Die number color */
    numbers: string;
    /** Edge stroke width in pixels */
    edgesStrokeWidth: number;
    /** Edge stroke color */
    edgesStrokeColor: string;
    /** Number stroke width in pixels */
    numbersStrokeWidth: number;
    /** Number stroke color */
    numbersStrokeColor: string;
}

export interface LocalDiceRollResult extends DiceRollResult {
    originalNotation?: string;
    group?: string;
    critHighlight?: boolean;
}

// Dice result interface for callback functions
export interface DiceResult {
    notation: string;
    results: number[];
    total: number;
    group?: string;
    originalNotation?: string;
    critHighlight?: boolean;
}

// Full DiceBox configuration type (for internal use)
export interface DiceBoxConfig {
    id?: string;
    assetPath?: string;
    container?: string | Element;
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
    offscreen?: boolean;
    delay?: number;
    lightIntensity?: number;
    enableShadows?: boolean;
    shadowTransparency?: number;
    theme?: string; // 3D dice theme name (not ID)
    preloadThemes?: string[];
    externalThemes?: Record<string, string>;
    themeColor?: string;
    scale?: number;
    suspendSimulation?: boolean;
    origin?: string;
    onBeforeRoll?: (notation: string) => void;
    onDieComplete?: (results: DiceResult) => void;
    onRollComplete?: (results: DiceResult | DiceResult[]) => void;
    onRemoveComplete?: () => void;
    onThemeConfigLoaded?: (theme: string) => void;
    onThemeLoaded?: (theme: string) => void;
}

/**
 * DiceBox context interface for the provider
 */
export interface DiceBoxContextType {
    rollDice: (notation: string, group?: string, critHighlight?: boolean) => void;
    rollDiceGroups: (notations: string[], groups?: string[], critHighlight?: boolean) => void;
    isReady: boolean;
    isRolling: boolean;
    lastResult: LocalDiceRollResult | null;
    onRollComplete: (callback: (result: LocalDiceRollResult | LocalDiceRollResult[]) => void) => void;
    clearResults: () => void;
    reinitialize: () => Promise<void>;
    reinitializeWithUserConfig: (userConfig: UpdateUserDiceConfigRequest) => Promise<void>;
    reinitializeWithAdminConfig: (adminConfig: DiceBoxAdminConfig) => Promise<void>;
    updateConfigWithUserConfig: (userConfig: UpdateUserDiceConfigRequest) => Promise<void>;
    updateConfigWithAdminConfig: (adminConfig: Partial<DiceBoxAdminConfig>) => void;
    clearAdminTestFlag: () => Promise<void>;
    getCurrentConfig: () => UpdateUserDiceConfigRequest | null;
    getCurrentIconColor: () => string;
    setTestingMode: (isTesting: boolean) => void;
} 

export type { DieRoll } from '@3d-dice/dice-roller-parser';
