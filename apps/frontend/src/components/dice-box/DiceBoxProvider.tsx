import { Toast } from '@base-ui-components/react/toast';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { useLogPanel } from '@/components/log-panel';
import { useToast } from '@/components/toast/useToast';
import type { DiceBoxAdminConfig, UpdateUserDiceConfigRequest } from '@shared/schema';

import { DiceBoxContext } from './DiceBoxHooks';
import { DiceBoxManager } from './DiceBoxManager';
import { DiceResultRenderer } from './DiceResultRenderer';
import { DiceBoxContextType, LocalDiceRollResult } from './types';

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

    async initialize(userConfig?: UpdateUserDiceConfigRequest): Promise<void> {
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

    private async performInitialization(userConfig?: UpdateUserDiceConfigRequest): Promise<void> {
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
    userDiceConfig?: UpdateUserDiceConfigRequest | null;
}

export function DiceBoxProvider({ children, userDiceConfig }: DiceBoxProviderProps): React.JSX.Element {
    const location = useLocation();
    const [isReady, setIsReady] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [lastResult, setLastResult] = useState<LocalDiceRollResult | null>(null);
    const [isTestingMode, setIsTestingMode] = useState(false);
    const mountedRef = useRef(true);
    const currentUserConfigRef = useRef<UpdateUserDiceConfigRequest | null>(userDiceConfig || null);
    const adminTestFlagRef = useRef(false);
    const previousLocationRef = useRef(location.pathname);
    const toastManagerRef = useRef<ReturnType<typeof Toast.useToastManager> | null>(null);
    const groupNameMappingRef = useRef<Map<string, string>>(new Map());
    const pendingResultsRef = useRef<LocalDiceRollResult[]>([]);
    const batchTimeoutRef = useRef<number | null>(null);
    const currentCritHighlightRef = useRef<boolean>(false);
    const batchCallbacksRef = useRef<Set<(results: LocalDiceRollResult[]) => void>>(new Set());

    // Get the singleton instance
    const diceBoxSingleton = useRef(DiceBoxSingleton.getInstance());

    // Use the app-wide toast system - store in ref to prevent re-renders
    const toastManager = useToast();

    // Use the log panel system
    const logPanel = useLogPanel();

    // Update toast manager ref when it changes
    useEffect(() => {
        toastManagerRef.current = toastManager;
    }, [toastManager]);

    // Initialize on mount - only run once globally
    useEffect(() => {
        mountedRef.current = true;
        currentUserConfigRef.current = userDiceConfig || null;

        // Initialize the singleton
        diceBoxSingleton.current.initialize(userDiceConfig || undefined)
            .then(() => {
                if (mountedRef.current) {
                    setIsReady(true);

                    // Register toast callback for roll completions (only once globally)
                    const manager = diceBoxSingleton.current.getManager();
                    if (manager && !diceBoxSingleton.current.isToastCallbackRegistered()) {
                        diceBoxSingleton.current.setToastCallbackRegistered(true);

                        manager.onRollComplete((parsedResult) => {
                            if (mountedRef.current) {
                                // Reset rolling state
                                setIsRolling(false);

                                if (parsedResult) {
                                    // Map the group back to original name if available
                                    const originalGroup = groupNameMappingRef.current.get(parsedResult.group || '') || parsedResult.group;
                                    const resultWithOriginalGroup = { ...parsedResult, group: originalGroup };

                                    setLastResult(resultWithOriginalGroup);

                                    // Add to pending results for batching
                                    pendingResultsRef.current.push(resultWithOriginalGroup);

                                    // Clear any existing timeout
                                    if (batchTimeoutRef.current) {
                                        clearTimeout(batchTimeoutRef.current);
                                    }

                                    // Set a timeout to process batched results
                                    batchTimeoutRef.current = window.setTimeout(() => {
                                        if (mountedRef.current && pendingResultsRef.current.length > 0) {
                                            const results = [...pendingResultsRef.current];
                                            pendingResultsRef.current = [];

                                            // Call batch callbacks
                                            batchCallbacksRef.current.forEach(callback => {
                                                try {
                                                    callback(results);
                                                } catch (error) {
                                                    console.error('Error in batch callback:', error);
                                                }
                                            });

                                            // Format the results using DiceResultRenderer
                                            const formattedContent = (
                                                <DiceResultRenderer
                                                    results={results}
                                                    critHighlight={currentCritHighlightRef.current}
                                                />
                                            );

                                            // Show toast notification with pre-formatted content
                                            if (toastManagerRef.current) {
                                                try {
                                                    const toastData = {
                                                        title: results.length === 1 ? generateTitle(results[0].originalNotation || 'Unknown', results[0].group) : `Multiple Rolls: ${results.length} results`,
                                                        description: results.length === 1 ? `Roll: ${results[0].originalNotation || 'Unknown'}` : `Multiple dice rolls completed`,
                                                        type: 'default',
                                                        data: {
                                                            formattedContent,
                                                            results
                                                        }
                                                    };
                                                    toastManagerRef.current.add(toastData);
                                                } catch (error) {
                                                    console.error('Failed to show dice result toast:', error);
                                                }
                                            }

                                            // Add log entry with pre-formatted content
                                            try {
                                                const logData = {
                                                    message: results.length === 1 ? generateTitle(results[0].originalNotation || 'Unknown', results[0].group) : `Multiple Rolls: ${results.length} results`,
                                                    type: 'info' as const,
                                                    source: 'dice-box',
                                                    data: { formattedContent, results }
                                                };
                                                logPanel.addLogEntry(logData);
                                            } catch (error) {
                                                console.error('Failed to add dice result to log:', error);
                                            }
                                        }
                                    }, 100); // Small delay to batch results
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
            // Clear any pending batch timeout
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }
            // Don't destroy the DiceBox - keep it alive across route changes
        };
    },[]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle user config changes after initialization
    useEffect(() => {
        const manager = diceBoxSingleton.current.getManager();
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
    }, [userDiceConfig, isReady, isTestingMode, diceBoxSingleton]);

    // Clear admin test flag and restore user config if needed
    const clearAdminTestFlag = useCallback(async () => {
        if (adminTestFlagRef.current) {
            // Refresh the admin config cache from backend
            const manager = diceBoxSingleton.current.getManager();
            if (manager) {
                try {
                    await manager.refreshCache();
                } catch (error) {
                    console.error('[DiceBoxProvider] Failed to refresh admin config cache:', error);
                }
            }

            // Clear the admin test flag
            adminTestFlagRef.current = false;
            setIsTestingMode(false);
        }
    }, [diceBoxSingleton]);

    // Clear admin test flag when navigating away from admin page
    useEffect(() => {
        const isAdminPage = location.pathname.includes('/admin/dice-configuration');
        const wasAdminPage = previousLocationRef.current.includes('/admin/dice-configuration');

        // If we were on admin page and now we're not, clear the admin test flag
        if (wasAdminPage && !isAdminPage && adminTestFlagRef.current) {
            clearAdminTestFlag();
        }

        previousLocationRef.current = location.pathname;
    }, [location.pathname, clearAdminTestFlag]);

    // Roll dice function
    const rollDice = useCallback((notation: string, group?: string, critHighlight?: boolean) => {
        const manager = diceBoxSingleton.current.getManager();
        if (!manager || !isReady) {
            console.log('Cannot roll - DiceBox not ready');
            return;
        }

        setIsRolling(true);
        setLastResult(null);
        currentCritHighlightRef.current = critHighlight || false;

        try {
            if (group) {
                // Store the original group name for later mapping
                groupNameMappingRef.current.set(group, group);
                // Use rollGroups when a group is provided
                manager.rollGroups([notation], [group], critHighlight);
            } else {
                // Use roll for single notation without group
                manager.roll(notation, critHighlight);
            }
        } catch (error) {
            console.error('Error during dice roll:', error);
            if (mountedRef.current) {
                setIsRolling(false);
            }
        }
    }, [isReady, diceBoxSingleton]);

    // Roll dice groups function
    const rollDiceGroups = useCallback((notations: string[], groups?: string[], critHighlight?: boolean) => {
        const manager = diceBoxSingleton.current.getManager();
        if (!manager || !isReady) {
            console.log('Cannot roll - DiceBox not ready');
            return;
        }

        setIsRolling(true);
        setLastResult(null);
        currentCritHighlightRef.current = critHighlight || false;

        try {
            // Store the original group names for later mapping
            if (groups) {
                groups.forEach((group) => {
                    groupNameMappingRef.current.set(group, group);
                });
            }

            // Use rollGroups
            manager.rollGroups(notations, groups, critHighlight);
        } catch (error) {
            console.error('Error during dice roll:', error);
            if (mountedRef.current) {
                setIsRolling(false);
            }
        }
    }, [isReady, diceBoxSingleton]);

    // Register roll complete callback
    const onRollComplete = useCallback((callback: (result: LocalDiceRollResult | LocalDiceRollResult[]) => void) => {
        const manager = diceBoxSingleton.current.getManager();
        if (!manager) {
            return () => { };
        }

        // Add callback to batch callbacks set - handle both single and array results
        const batchCallback = (results: LocalDiceRollResult[]) => {
            const resultToPass = results.length === 1 ? results[0] : results;
            callback(resultToPass);
        };
        batchCallbacksRef.current.add(batchCallback);

        return () => {
            batchCallbacksRef.current.delete(batchCallback);
        };
    }, [diceBoxSingleton]);

    // Clear results
    const clearResults = useCallback(() => {
        setLastResult(null);
    }, []);

    // Force re-initialization
    const reinitialize = useCallback(async () => {
        setIsReady(false);

        diceBoxSingleton.current.destroy();
        await diceBoxSingleton.current.initialize(currentUserConfigRef.current || undefined);

        if (mountedRef.current) {
            setIsReady(true);
        }
    }, [diceBoxSingleton]);

    // Re-initialize with user config
    const reinitializeWithUserConfig = useCallback(async (userConfig: UpdateUserDiceConfigRequest) => {
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
        diceBoxSingleton.current.destroy();

        try {
            const manager = new DiceBoxManager();
            await manager.initializeWithAdminConfig(adminConfig);

            // Replace the singleton's manager - use type assertion for private property access
            (diceBoxSingleton as unknown as { manager: DiceBoxManager; isInitialized: boolean }).manager = manager;
            (diceBoxSingleton as unknown as { manager: DiceBoxManager; isInitialized: boolean }).isInitialized = true;

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
    const updateConfigWithUserConfig = useCallback(async (userConfig: UpdateUserDiceConfigRequest) => {
        const manager = diceBoxSingleton.current.getManager();
        if (manager) {
            await manager.updateConfigWithUserConfig(userConfig);
        }
    }, [diceBoxSingleton]);

    // Update config with admin config
    const updateConfigWithAdminConfig = useCallback((adminConfig: Partial<DiceBoxAdminConfig>) => {
        const manager = diceBoxSingleton.current.getManager();
        if (manager) {
            manager.updateConfigWithAdminConfig(adminConfig);
        }
    }, [diceBoxSingleton]);

    // Get current config
    const getCurrentConfig = useCallback(() => {
        return currentUserConfigRef.current;
    }, []);

    // Get current icon color
    const getCurrentIconColor = useCallback(() => {
        const manager = diceBoxSingleton.current.getManager();
        if (manager) {
            return manager.getCurrentIconColor();
        }
        return '#3937b8'; // Default fallback
    }, [diceBoxSingleton]);

    const contextValue: DiceBoxContextType = {
        rollDice,
        rollDiceGroups,
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

function generateTitle(notation: string, group?: string): string {
    if (group) {
        return `${group} Roll: ${notation}`;
    }
    return `Dice Roll: ${notation}`;
}

 
