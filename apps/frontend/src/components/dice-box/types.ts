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

/**
 * DiceBox context interface for the provider
 */
export interface DiceBoxContextType {
    rollDice: (notation: string, group?: string, critHighlight?: boolean) => void;
    rollDiceGroups: (notations: string[], groups?: string[], critHighlight?: boolean) => void;
    isReady: boolean;
    isRolling: boolean;
    lastResult: import('@shared/schema').DiceResult | null;
    onRollComplete: (callback: (result: import('@shared/schema').DiceResult | import('@shared/schema').DiceResult[]) => void) => void;
    clearResults: () => void;
    reinitialize: () => Promise<void>;
    reinitializeWithUserConfig: (userConfig: import('@shared/schema').UpdateUserDiceConfigRequest) => Promise<void>;
    reinitializeWithAdminConfig: (adminConfig: import('@shared/schema').DiceBoxAdminConfig) => Promise<void>;
    updateConfigWithUserConfig: (userConfig: import('@shared/schema').UpdateUserDiceConfigRequest) => Promise<void>;
    updateConfigWithAdminConfig: (adminConfig: Partial<import('@shared/schema').DiceBoxAdminConfig>) => void;
    clearAdminTestFlag: () => Promise<void>;
    getCurrentConfig: () => import('@shared/schema').UpdateUserDiceConfigRequest | null;
    getCurrentIconColor: () => string;
    setTestingMode: (isTesting: boolean) => void;
} 
