import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getDiceBox, destroyDiceBox, type DiceBoxThemeConfig } from './DiceBox';

// Types
export interface DiceResult {
    notation: string;
    results: number[];
    total: number;
    group?: string;
}

export interface DiceBoxContextType {
    rollDice: (notation: string, group?: string) => void;
    isReady: boolean;
    isRolling: boolean;
    pendingRoll: string | null;
    lastResult: DiceResult | null;
    onRollComplete: (callback: (result: DiceResult) => void) => void;
    clearResults: () => void;
    reinitialize: () => Promise<void>;
    reinitializeWithConfig: (config: DiceBoxThemeConfig) => Promise<void>;
    getCurrentConfig: () => DiceBoxThemeConfig | undefined;
}

// Create context
const DiceBoxContext = createContext<DiceBoxContextType | null>(null);

// Provider props
interface DiceBoxProviderProps {
    children: React.ReactNode;
    themeConfig?: DiceBoxThemeConfig;
}

export function DiceBoxProvider({ children, themeConfig }: DiceBoxProviderProps): React.JSX.Element {
    const [isReady, setIsReady] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [pendingRoll, setPendingRoll] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<DiceResult | null>(null);
    const diceBoxRef = useRef<ReturnType<typeof getDiceBox> | null>(null);
    const rollCompleteCallbacksRef = useRef<((result: DiceResult) => void)[]>([]);
    const mountedRef = useRef(true);
    const currentPendingRollRef = useRef<string | null>(null);
    const previousThemeConfigRef = useRef<DiceBoxThemeConfig | undefined>(themeConfig);
    const hasInitializedRef = useRef(false);
    const currentThemeConfigRef = useRef<DiceBoxThemeConfig | undefined>(themeConfig);
    const location = useLocation();

    // Initialize DiceBox
    const initializeDiceBox = useCallback(async (config?: DiceBoxThemeConfig): Promise<void> => {
        const currentConfig = config || currentThemeConfigRef.current || themeConfig;

        const waitForContainer = async (): Promise<void> => {
            for (let i = 0; i < 20; i++) {
                const el = document.querySelector('[data-dice-box]');
                if (el) {
                    // Additional check to ensure container is fully rendered
                    const containerRect = el.getBoundingClientRect();

                    if (containerRect.width === 0 || containerRect.height === 0) {
                        await new Promise((resolve) => {
                            setTimeout(resolve, 100);
                        });
                        continue;
                    }

                    // Get or create DiceBox instance (updateConfig will be called if needed)
                    const diceBox = getDiceBox(currentConfig);

                    // Only initialize if not already initialized
                    if (!diceBoxRef.current) {
                        // Check if canvas exists before init
                        let canvas = document.getElementById('dice-canvas');

                        // Try to initialize DiceBox
                        try {
                            await diceBox.init();
                        } catch (error) {
                            console.error('Error during diceBox.init():', error);
                        }

                        if (!mountedRef.current) return;

                        diceBoxRef.current = diceBox;
                        setIsReady(true);

                        // Set up roll complete handler
                        diceBox.onRollComplete = (results: any) => {
                            console.log('Dice roll complete:', results);

                            if (!mountedRef.current) return;

                            try {
                                let diceResult: DiceResult | null = null;

                                // Use the ref to get the current pending roll
                                const currentGroup = currentPendingRollRef.current;

                                // Handle the actual DiceBox format: array of roll objects
                                if (Array.isArray(results) && results.length > 0) {
                                    const firstRoll = results[0];
                                    const rolls = firstRoll.rolls || [];
                                    const total = firstRoll.value || 0;

                                    // Extract individual die values
                                    const dieValues = rolls.map((roll: any) => roll.value);

                                    // Create notation from roll data
                                    const notation = `${firstRoll.qty}d${firstRoll.sides}`;

                                    diceResult = {
                                        notation,
                                        results: dieValues,
                                        total,
                                        group: currentGroup || undefined
                                    };
                                }

                                if (diceResult) {
                                    console.log('Parsed dice result:', diceResult);
                                    setLastResult(diceResult);
                                    setIsRolling(false);
                                    setPendingRoll(null);
                                    currentPendingRollRef.current = null;

                                    // Call all registered callbacks
                                    rollCompleteCallbacksRef.current.forEach(callback => {
                                        callback(diceResult!);
                                    });
                                } else {
                                    console.warn('Could not parse dice results:', results);
                                    setIsRolling(false);
                                    setPendingRoll(null);
                                    currentPendingRollRef.current = null;
                                }
                            } catch (error) {
                                console.error('Error parsing dice results:', error);
                                console.error('Results that caused error:', results);
                                setIsRolling(false);
                                setPendingRoll(null);
                                currentPendingRollRef.current = null;
                            }
                        };

                        // Set up click handler to hide dice
                        const handleMouseDown = () => {
                            const diceBoxCanvas = document.getElementById('dice-canvas');
                            if (diceBoxCanvas && window.getComputedStyle(diceBoxCanvas).display !== "none") {
                                diceBox.hide().clear();
                            }
                        };

                        document.addEventListener('mousedown', handleMouseDown);
                    }

                    return;
                }

                await new Promise((resolve) => {
                    setTimeout(resolve, 100);
                });
            }

            console.error('Failed to find [data-dice-box] container after waiting');
        };

        await waitForContainer();
    }, [themeConfig]); // Include themeConfig to re-initialize when it changes

    // Initialize on mount and when theme config changes
    useEffect(() => {
        // Update the current theme config ref
        currentThemeConfigRef.current = themeConfig;

        // Check if theme config actually changed
        const themeChanged = JSON.stringify(previousThemeConfigRef.current) !== JSON.stringify(themeConfig);

        if (themeChanged) {
            previousThemeConfigRef.current = themeConfig;
        }

        mountedRef.current = true;

        // Only initialize if this is the first time or if config changed
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            // Wait for the container to have actual content (not just loading state)
            const waitForReadyContainer = () => {
                const container = document.querySelector('[data-dice-box]');
                if (container && container.children.length > 0) {
                    const containerText = container.textContent || '';

                    // Check if we're past the loading state
                    if (containerText.includes('Loading')) {
                        setTimeout(waitForReadyContainer, 100);
                        return;
                    }

                    // Check for actual page content (not just the ScrollArea wrapper)
                    const hasActualContent = container.querySelector('h1, h2, .container, [role="main"], .bg-gray-50, .bg-gray-900');

                    // Additional checks for content detection
                    const hasDiceConfigContent = container.querySelector('.bg-gray-50, .bg-gray-900, [data-dice-box] > div');

                    // Wait a bit longer to ensure the container is fully rendered
                    if (hasActualContent || hasDiceConfigContent) {
                        setTimeout(() => {
                            if (mountedRef.current) {
                                initializeDiceBox();
                            }
                        }, 200); // Wait 200ms for full render
                    } else {
                        setTimeout(waitForReadyContainer, 100);
                    }
                } else {
                    setTimeout(waitForReadyContainer, 50);
                }
            };
            waitForReadyContainer();
        } else if (themeChanged) {
            initializeDiceBox();
        }

        return () => {
            mountedRef.current = false;
            destroyDiceBox();
        };
    }, [themeConfig, initializeDiceBox]);

    // Track previous pathname to detect actual route changes
    const previousPathnameRef = useRef<string>(location.pathname);

    // Re-initialize DiceBox when route changes (to handle cases where canvas attachment failed)
    useEffect(() => {
        const currentPathname = location.pathname;
        const previousPathname = previousPathnameRef.current;

        // Only proceed if the pathname actually changed
        if (currentPathname !== previousPathname) {
            // Update the previous pathname
            previousPathnameRef.current = currentPathname;

            // Clear any stuck rolling state when route changes
            if (isRolling) {
                setIsRolling(false);
                setPendingRoll(null);
                currentPendingRollRef.current = null;
            }

            // Only re-initialize if we already have a DiceBox instance but it's not ready
            if (diceBoxRef.current && !isReady) {
                // Wait a bit for the new page to render, then try to re-initialize
                const timeoutId = setTimeout(() => {
                    if (mountedRef.current) {
                        initializeDiceBox();
                    }
                }, 100);

                return () => clearTimeout(timeoutId);
            }
        }
    }, [location.pathname, isReady, isRolling, initializeDiceBox]);

    // Roll dice function
    const rollDice = useCallback((notation: string, group?: string) => {
        console.log('Rolling dice:', { notation, group, isReady, hasDiceBox: !!diceBoxRef.current });

        if (!diceBoxRef.current || !isReady) {
            console.log('Cannot roll - DiceBox not ready or not available');
            return;
        }

        // Additional check: verify DiceBox methods are available
        if (!diceBoxRef.current.show || !diceBoxRef.current.roll) {
            console.log('Cannot roll - DiceBox methods not available');
            return;
        }

        setIsRolling(true);
        setPendingRoll(group || null);
        currentPendingRollRef.current = group || null;

        try {
            // Check if canvas exists and show it
            const canvas = document.getElementById('dice-canvas');
            if (canvas) {
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
            }

            console.log('Starting dice roll...');
            const showResult = diceBoxRef.current.show();
            showResult.roll(notation);
        } catch (error) {
            console.error('Error during dice roll:', error);
            setIsRolling(false);
            setPendingRoll(null);
            currentPendingRollRef.current = null;
        }
    }, [isReady]);

    // Register roll complete callback
    const onRollComplete = useCallback((callback: (result: DiceResult) => void) => {
        rollCompleteCallbacksRef.current.push(callback);

        // Return cleanup function
        return () => {
            const index = rollCompleteCallbacksRef.current.indexOf(callback);
            if (index > -1) {
                rollCompleteCallbacksRef.current.splice(index, 1);
            }
        };
    }, []);

    // Clear results
    const clearResults = useCallback(() => {
        setLastResult(null);
        setPendingRoll(null);
    }, []);

    // Force re-initialization
    const reinitialize = useCallback(async () => {
        setIsReady(false);
        destroyDiceBox();
        await initializeDiceBox();
    }, [initializeDiceBox]);

    // Re-initialize with custom config
    const reinitializeWithConfig = useCallback(async (config: DiceBoxThemeConfig) => {
        // Don't reinitialize if DiceBox is currently rolling
        if (isRolling) {
            console.log('Skipping reinitialization - DiceBox is currently rolling');
            return;
        }

        // Update the current theme config ref to track the latest configuration
        currentThemeConfigRef.current = config;

        // Check if config actually changed
        const configChanged = JSON.stringify(previousThemeConfigRef.current) !== JSON.stringify(config);

        if (configChanged && diceBoxRef.current && isReady) {
            const previous = previousThemeConfigRef.current;

            // Properties that can be updated via updateConfig() without full reinitialization
            const updateableProps = [
                'theme', 'themeColor', 'scale', 'lightIntensity', 'enableShadows', 'shadowTransparency',
                'gravity', 'mass', 'friction', 'restitution', 'angularDamping', 'linearDamping',
                'spinForce', 'throwForce', 'startingHeight', 'settleTimeout'
            ];

            const hasUpdateableChanges = updateableProps.some(prop =>
                previous?.[prop as keyof DiceBoxThemeConfig] !== config[prop as keyof DiceBoxThemeConfig]
            );

            if (hasUpdateableChanges) {
                // For updateable changes, use updateConfig
                const updates: Partial<DiceBoxThemeConfig> = {};

                updateableProps.forEach(prop => {
                    const key = prop as keyof DiceBoxThemeConfig;
                    if (previous?.[key] !== config[key]) {
                        (updates as any)[key] = config[key];
                    }
                });

                try {
                    console.log('Updating DiceBox config:', updates);
                    diceBoxRef.current.updateConfig(updates);
                    previousThemeConfigRef.current = config;
                } catch (error) {
                    console.error('Failed to update DiceBox config:', error);
                    // Fallback to full reinitialization
                    await reinitialize();
                }
            } else {
                // For non-updateable changes, reinitialize the entire DiceBox
                console.log('Reinitializing DiceBox for non-updateable changes');
                await reinitialize();
            }
        } else if (!diceBoxRef.current) {
            await initializeDiceBox(config);
        }
    }, [initializeDiceBox, isReady, isRolling, reinitialize]);

    // Get current config
    const getCurrentConfig = useCallback(() => {
        return currentThemeConfigRef.current;
    }, []);

    const contextValue: DiceBoxContextType = {
        rollDice,
        isReady,
        isRolling,
        pendingRoll,
        lastResult,
        onRollComplete,
        clearResults,
        reinitialize,
        reinitializeWithConfig,
        getCurrentConfig
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
