import React, { useState } from 'react';
import { useDiceBox } from './useDiceBox';
import { DICE_THEME_SELECT_LIST } from '@shared/static-data';
import type { DiceBoxThemeConfig } from './DiceBox';

// Available themes from static data
const AVAILABLE_THEMES = DICE_THEME_SELECT_LIST;

// Example theme colors
const THEME_COLORS = [
    { value: '#3937b8', label: 'Blue' },
    { value: '#b73739', label: 'Red' },
    { value: '#37b839', label: 'Green' },
    { value: '#b8b737', label: 'Yellow' },
    { value: '#b737b8', label: 'Purple' },
    { value: '#37b8b8', label: 'Cyan' }
];

// Scale options
const SCALE_OPTIONS = [
    { value: 2, label: 'Small' },
    { value: 3, label: 'Medium' },
    { value: 4, label: 'Large' }
];

export function DiceBoxThemeExample(): React.JSX.Element {
    const { rollDice, isReady, isRolling, lastResult } = useDiceBox();
    const [currentTheme, setCurrentTheme] = useState('rock');
    const [currentColor, setCurrentColor] = useState('#3937b8');
    const [currentScale, setCurrentScale] = useState(3);

    const handleRoll = () => {
        rollDice('3d6', 'theme-test');
    };

    const getCurrentThemeConfig = (): DiceBoxThemeConfig => ({
        theme: currentTheme,
        themeColor: currentColor,
        scale: currentScale
    });

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">DiceBox Theme Configuration Example</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Configuration Panel */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Theme Configuration</h3>

                    <div className="space-y-4">
                        {/* Theme Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Theme:</label>
                            <select
                                value={currentTheme}
                                onChange={(e) => setCurrentTheme(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            >
                                {AVAILABLE_THEMES.map(theme => (
                                    <option key={theme.value} value={theme.value}>
                                        {theme.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Theme Color:</label>
                            <select
                                value={currentColor}
                                onChange={(e) => setCurrentColor(e.target.value)}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            >
                                {THEME_COLORS.map(color => (
                                    <option key={color.value} value={color.value}>
                                        {color.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Scale Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Scale:</label>
                            <select
                                value={currentScale}
                                onChange={(e) => setCurrentScale(Number(e.target.value))}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            >
                                {SCALE_OPTIONS.map(scale => (
                                    <option key={scale.value} value={scale.value}>
                                        {scale.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Current Configuration Display */}
                        <div className="mt-4 p-3 bg-gray-200 dark:bg-gray-700 rounded">
                            <h4 className="font-medium mb-2">Current Configuration:</h4>
                            <pre className="text-xs overflow-auto">
                                {JSON.stringify(getCurrentThemeConfig(), null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Dice Rolling Panel */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Dice Rolling</h3>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Status: {isReady ? 'Ready' : 'Initializing...'}
                            </p>
                        </div>

                        <button
                            onClick={handleRoll}
                            disabled={!isReady || isRolling}
                            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isRolling ? 'Rolling...' : 'Roll 3d6'}
                        </button>

                        {lastResult && lastResult.group === 'theme-test' && (
                            <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded border">
                                <h4 className="font-medium mb-2">Last Roll Result:</h4>
                                <p><strong>Notation:</strong> {lastResult.notation}</p>
                                <p><strong>Individual Rolls:</strong> [{lastResult.results.join(', ')}]</p>
                                <p><strong>Total:</strong> <span className="text-xl font-bold text-blue-600">{lastResult.total}</span></p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Note:</strong> Theme changes require a page reload to take effect, as the DiceBox instance is created once on initialization.</p>
                <p>In a real application, you would implement theme switching by re-initializing the DiceBox with new configuration.</p>
            </div>
        </div>
    );
} 
