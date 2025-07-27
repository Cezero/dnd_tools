import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { DiceBoxManager, type DiceResult } from './DiceBoxManager';
import { DiceResultParser } from './DiceResultParser';
import { createDiceResultToastData } from './DiceResultToast';
import { useToast } from '@/hooks/useToast';
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

// Global DiceBox singleton class
class DiceBoxSingleton {
    private static instance: DiceBoxSingleton | null = null;
    private manager: DiceBoxManager | null = null;
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;
    private toastCallbackRegistered = false;

    private constructor() { }

    static getInstance(): DiceBoxSingleton {
        if (!DiceBoxSingleton.instance) {
            DiceBoxSingleton.instance = new DiceBoxSingleton();
        }
        return DiceBoxSingleton.instance;
    }

    async initialize(userConfig?: UserDiceConfig): Promise<void> {
        // If already initialized, return existing promise or resolved promise
        if (this.isInitialized) {
            return Promise.resolve();
        }

        // If initialization is in progress, return the existing promise
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // Create new initialization promise
        this.initializationPromise = this.performInitialization(userConfig);

        try {
            await this.initializationPromise;
            this.isInitialized = true;
        } catch (error) {
            this.isInitialized = false;
            this.initializationPromise = null;
            throw error;
        }

        return this.initializationPromise;
    }

    private async performInitialization(userConfig?: UserDiceConfig): Promise<void> {
        // Clean up any existing canvas first
        this.cleanupCanvas();

        // Create new manager instance
        this.manager = new DiceBoxManager();

        if (userConfig) {
            await this.manager.initializeWithUserConfig(userConfig);
        } else {
            await this.manager.initialize();
        }
    }

    private cleanupCanvas(): void {
        const existingCanvas = document.getElementById('dice-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }
    }

    getManager(): DiceBoxManager | null {
        return this.manager;
    }

    isReady(): boolean {
        return this.isInitialized && this.manager !== null;
    }

    isToastCallbackRegistered(): boolean {
        return this.toastCallbackRegistered;
    }

    setToastCallbackRegistered(registered: boolean): void {
        this.toastCallbackRegistered = registered;
    }

    destroy(): void {
        if (this.manager) {
            this.manager.destroy();
            this.manager = null;
        }
        this.isInitialized = false;
        this.initializationPromise = null;
        this.toastCallbackRegistered = false;
    }
}

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
    const mountedRef = useRef(true);
    const currentUserConfigRef = useRef<UserDiceConfig | null>(userDiceConfig || null);
    const adminTestFlagRef = useRef(false);
    const previousLocationRef = useRef(location.pathname);
    const toastManagerRef = useRef<any>(null);

    // Get the singleton instance
    const diceBoxSingleton = DiceBoxSingleton.getInstance();

    // Use the app-wide toast system - store in ref to prevent re-renders
    const toastManager = useToast();

    // Update toast manager ref when it changes
    useEffect(() => {
        toastManagerRef.current = toastManager;
    }, [toastManager]);

    // Initialize on mount - only run once globally
    useEffect(() => {
        mountedRef.current = true;
        currentUserConfigRef.current = userDiceConfig || null;

        // Initialize the singleton
        diceBoxSingleton.initialize(userDiceConfig || undefined)
            .then(() => {
                if (mountedRef.current) {
                    setIsReady(true);

                    // Register toast callback for roll completions (only once globally)
                    const manager = diceBoxSingleton.getManager();
                    if (manager && !diceBoxSingleton.isToastCallbackRegistered()) {
                        diceBoxSingleton.setToastCallbackRegistered(true);

                        manager.onRollComplete((result) => {
                            if (mountedRef.current) {
                                setLastResult(result);

                                // Show toast notification using the app-wide toast system
                                if (toastManagerRef.current) {
                                    try {
                                        const parsedResult = DiceResultParser.parseResult(result);
                                        const toastData = createDiceResultToastData(parsedResult);
                                        toastManagerRef.current.add(toastData);
                                    } catch (error) {
                                        console.error('Failed to show dice result toast:', error);
                                    }
                                }
                            }
                        });
                    }
                }
            })
            .catch((error) => {
                console.error('[DiceBoxProvider] Failed to initialize DiceBox:', error);
                if (mountedRef.current) {
                    setIsReady(false);
                }
            });

        return () => {
            mountedRef.current = false;
            // Don't destroy the DiceBox - keep it alive across route changes
        };
    }, []); // Empty dependency array - only run once

    // Handle user config changes after initialization
    useEffect(() => {
        const manager = diceBoxSingleton.getManager();
        if (manager && isReady && userDiceConfig && !isTestingMode) {
            const previousConfig = currentUserConfigRef.current;
            currentUserConfigRef.current = userDiceConfig;

            // Only update if config actually changed
            const previousString = JSON.stringify(previousConfig);
            const currentString = JSON.stringify(userDiceConfig);
            const hasChanged = previousString !== currentString;

            if (hasChanged) {
                manager.updateConfigWithUserConfig(userDiceConfig);
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
        const manager = diceBoxSingleton.getManager();
        if (!manager || !isReady) {
            console.log('Cannot roll - DiceBox not ready');
            return;
        }

        setIsRolling(true);
        setLastResult(null);

        try {
            manager.roll(notation);

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
        const manager = diceBoxSingleton.getManager();
        if (!manager) {
            console.warn('DiceBox manager not available');
            return () => { };
        }

        return manager.onRollComplete((result) => {
            if (mountedRef.current) {
                setLastResult(result);
                callback(result);
            }
        });
    }, []); // Remove toastManager dependency to prevent re-renders

    // Clear results
    const clearResults = useCallback(() => {
        setLastResult(null);
    }, []);

    // Force re-initialization
    const reinitialize = useCallback(async () => {
        setIsReady(false);

        diceBoxSingleton.destroy();
        await diceBoxSingleton.initialize(currentUserConfigRef.current || undefined);

        if (mountedRef.current) {
            setIsReady(true);
        }
    }, []);

    // Re-initialize with user config
    const reinitializeWithUserConfig = useCallback(async (userConfig: UserDiceConfig) => {
        if (isRolling) {
            return;
        }

        currentUserConfigRef.current = userConfig;
        await reinitialize();
    }, [reinitialize, isRolling]);

    // Re-initialize with admin config
    const reinitializeWithAdminConfig = useCallback(async (adminConfig: DiceBoxAdminConfig) => {
        if (isRolling) {
            return;
        }

        setIsTestingMode(true);
        adminTestFlagRef.current = true;

        setIsReady(false);
        diceBoxSingleton.destroy();

        try {
            const manager = new DiceBoxManager();
            await manager.initializeWithAdminConfig(adminConfig);

            // Replace the singleton's manager
            (diceBoxSingleton as any).manager = manager;
            (diceBoxSingleton as any).isInitialized = true;

            if (mountedRef.current) {
                setIsReady(true);
            }
        } catch (error) {
            console.error('Failed to initialize DiceBox with admin config:', error);
            if (mountedRef.current) {
                setIsReady(false);
            }
        }
    }, [isRolling]);

    // Update config with user config
    const updateConfigWithUserConfig = useCallback(async (userConfig: UserDiceConfig) => {
        const manager = diceBoxSingleton.getManager();
        if (manager) {
            await manager.updateConfigWithUserConfig(userConfig);
        }
    }, []);

    // Update config with admin config
    const updateConfigWithAdminConfig = useCallback((adminConfig: Partial<DiceBoxAdminConfig>) => {
        const manager = diceBoxSingleton.getManager();
        if (manager) {
            manager.updateConfigWithAdminConfig(adminConfig);
        }
    }, []);

    // Get current config
    const getCurrentConfig = useCallback(() => {
        return currentUserConfigRef.current;
    }, []);

    // Get current icon color
    const getCurrentIconColor = useCallback(() => {
        const manager = diceBoxSingleton.getManager();
        if (manager) {
            return manager.getCurrentIconColor();
        }
        return '#3937b8'; // Default fallback
    }, []);

    // Clear admin test flag and restore user config if needed
    const clearAdminTestFlag = useCallback(async () => {
        if (adminTestFlagRef.current) {
            // Refresh the admin config cache from backend
            const manager = diceBoxSingleton.getManager();
            if (manager) {
                try {
                    await manager.refreshCache();
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
            setIsTestingMode(false);
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
