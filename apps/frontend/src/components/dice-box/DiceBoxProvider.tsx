import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { DiceBoxManager, type DiceResult } from './DiceBoxManager';
import type { DiceBoxAdminConfig, UserDiceConfig } from '@shared/schema';

// Types
export interface DiceBoxContextType {
    rollDice: (notation: string, group?: string) => void;
    isReady: boolean;
    isRolling: boolean;
    lastResult: DiceResult | null;
    onRollComplete: (callback: (result: DiceResult) => void) => void;
    clearResults: () => void;
    reinitialize: () => Promise<void>;
    reinitializeWithUserConfig: (userConfig: UserDiceConfig) => Promise<void>;
    reinitializeWithAdminConfig: (adminConfig: DiceBoxAdminConfig) => Promise<void>;
    updateConfigWithUserConfig: (userConfig: UserDiceConfig) => Promise<void>;
    updateConfigWithAdminConfig: (adminConfig: Partial<DiceBoxAdminConfig>) => void;
    clearAdminTestFlag: () => Promise<void>;

    getCurrentConfig: () => UserDiceConfig | null;
    getCurrentIconColor: () => string;
    setTestingMode: (isTesting: boolean) => void;
}

// Create context
const DiceBoxContext = createContext<DiceBoxContextType | null>(null);

// Provider props
interface DiceBoxProviderProps {
    children: React.ReactNode;
    userDiceConfig?: UserDiceConfig | null;
}

export function DiceBoxProvider({ children, userDiceConfig }: DiceBoxProviderProps): React.JSX.Element {
    const location = useLocation();
    const [isReady, setIsReady] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [lastResult, setLastResult] = useState<DiceResult | null>(null);
    const [isTestingMode, setIsTestingMode] = useState(false);
    const managerRef = useRef<DiceBoxManager>(new DiceBoxManager());
    const mountedRef = useRef(true);
    const currentUserConfigRef = useRef<UserDiceConfig | null>(userDiceConfig || null);
    const adminTestFlagRef = useRef(false);
    const previousLocationRef = useRef(location.pathname);

    // Initialize DiceBox with user config
    const initializeDiceBox = useCallback(async (userConfig?: UserDiceConfig): Promise<void> => {
        if (!mountedRef.current) return;

        try {
            if (!managerRef.current) {
                managerRef.current = new DiceBoxManager();
            }

            if (userConfig) {
                await managerRef.current.initializeWithUserConfig(userConfig);
            } else {
                // Initialize with default config if no user config provided
                await managerRef.current.initialize();
            }

            if (mountedRef.current) {
                setIsReady(true);
            }
        } catch (error) {
            console.error('Failed to initialize DiceBox:', error);
            if (mountedRef.current) {
                setIsReady(false);
            }
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        mountedRef.current = true;
        currentUserConfigRef.current = userDiceConfig || null;

        initializeDiceBox(userDiceConfig || undefined);

        return () => {
            mountedRef.current = false;
            // Don't destroy the DiceBox - keep it alive across route changes
        };
    }, []); // Remove userDiceConfig and initializeDiceBox dependencies

    // Handle user config changes after initialization
    useEffect(() => {
        if (managerRef.current && isReady && userDiceConfig && !isTestingMode) {
            const previousConfig = currentUserConfigRef.current;
            currentUserConfigRef.current = userDiceConfig;

            // Only update if config actually changed
            const previousString = JSON.stringify(previousConfig);
            const currentString = JSON.stringify(userDiceConfig);
            const hasChanged = previousString !== currentString;

            if (hasChanged) {
                managerRef.current.updateConfigWithUserConfig(userDiceConfig);
            }
        }
    }, [userDiceConfig, isReady, isTestingMode]);

    // Clear admin test flag when navigating away from admin page
    useEffect(() => {
        const isAdminPage = location.pathname.includes('/admin/dice-configuration');
        const wasAdminPage = previousLocationRef.current.includes('/admin/dice-configuration');

        // If we were on admin page and now we're not, clear the admin test flag
        if (wasAdminPage && !isAdminPage && adminTestFlagRef.current) {
            clearAdminTestFlag();
        }

        previousLocationRef.current = location.pathname;
    }, [location.pathname]);


    // Roll dice function
    const rollDice = useCallback((notation: string, group?: string) => {
        if (!managerRef.current || !isReady) {
            console.log('Cannot roll - DiceBox not ready');
            return;
        }

        setIsRolling(true);
        setLastResult(null);

        try {
            managerRef.current.roll(notation);

            // Simple timeout to reset rolling state
            setTimeout(() => {
                if (mountedRef.current) {
                    setIsRolling(false);
                }
            }, 2000);
        } catch (error) {
            console.error('Error during dice roll:', error);
            if (mountedRef.current) {
                setIsRolling(false);
            }
        }
    }, [isReady]);

    // Register roll complete callback
    const onRollComplete = useCallback((callback: (result: DiceResult) => void) => {
        if (!managerRef.current) {
            console.warn('DiceBox manager not available');
            return () => { };
        }

        return managerRef.current.onRollComplete((result) => {
            if (mountedRef.current) {
                setLastResult(result);
                callback(result);
            }
        });
    }, []);

    // Clear results
    const clearResults = useCallback(() => {
        setLastResult(null);
    }, []);

    // Force re-initialization
    const reinitialize = useCallback(async () => {
        setIsReady(false);
        if (managerRef.current) {
            managerRef.current.destroy();
            managerRef.current = undefined;
        }
        await initializeDiceBox(currentUserConfigRef.current || undefined);
    }, [initializeDiceBox]);

    // Re-initialize with user config
    const reinitializeWithUserConfig = useCallback(async (userConfig: UserDiceConfig) => {
        if (isRolling) {
            return;
        }

        currentUserConfigRef.current = userConfig;
        await reinitialize();
    }, [isRolling, reinitialize]);

    // Re-initialize with admin config (for admin testing)
    const reinitializeWithAdminConfig = useCallback(async (adminConfig: DiceBoxAdminConfig) => {
        if (isRolling) {
            return;
        }

        if (managerRef.current) {
            await managerRef.current.initializeWithAdminConfig(adminConfig);
        }
    }, [isRolling]);

    // Update config with user config
    const updateConfigWithUserConfig = useCallback(async (userConfig: UserDiceConfig) => {
        if (managerRef.current && isReady) {
            await managerRef.current.updateConfigWithUserConfig(userConfig);
        }
    }, [isReady]);

    // Update config with admin config (for admin testing)
    const updateConfigWithAdminConfig = useCallback((adminConfig: Partial<DiceBoxAdminConfig>) => {
        if (managerRef.current && isReady) {
            // Set the admin test flag to indicate admin testing has occurred
            adminTestFlagRef.current = true;
            managerRef.current.updateConfigWithAdminConfig(adminConfig);
        }
    }, [isReady]);

    // Get current config
    const getCurrentConfig = useCallback(() => {
        return currentUserConfigRef.current;
    }, []);

    // Get current icon color
    const getCurrentIconColor = useCallback(() => {
        if (managerRef.current) {
            return managerRef.current.getCurrentIconColor();
        }
        return '#3937b8'; // Default fallback
    }, []);

    // Clear admin test flag and restore user config if needed
    const clearAdminTestFlag = useCallback(async () => {
        if (adminTestFlagRef.current) {
            // Refresh the admin config cache from backend
            if (managerRef.current) {
                try {
                    await managerRef.current.refreshCache();
                } catch (error) {
                    console.error('[DiceBoxProvider] Failed to refresh admin config cache:', error);
                }
            }

            // Restore user config if available
            if (currentUserConfigRef.current) {
                await updateConfigWithUserConfig(currentUserConfigRef.current);
            }

            // Clear the admin test flag
            adminTestFlagRef.current = false;
        }
    }, [updateConfigWithUserConfig]);

    const contextValue: DiceBoxContextType = {
        rollDice,
        isReady,
        isRolling,
        lastResult,
        onRollComplete,
        clearResults,
        reinitialize,
        reinitializeWithUserConfig,
        reinitializeWithAdminConfig,
        updateConfigWithUserConfig,
        updateConfigWithAdminConfig,
        clearAdminTestFlag,
        getCurrentConfig,
        getCurrentIconColor,
        setTestingMode: setIsTestingMode
    };

    return (
        <DiceBoxContext.Provider value={contextValue}>
            {children}
        </DiceBoxContext.Provider>
    );
}

// Hook to use DiceBox context
export function useDiceBox(): DiceBoxContextType {
    const context = useContext(DiceBoxContext);
    if (!context) {
        throw new Error('useDiceBox must be used within DiceBoxProvider');
    }
    return context;
} 
