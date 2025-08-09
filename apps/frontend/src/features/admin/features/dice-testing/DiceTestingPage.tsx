import React, { useState } from 'react';

import { DiceColorDemo } from '@/components/dice-box/DiceColorDemo';
import { DiceSvgTest } from '@/components/dice-box/DiceSvgTest';

export function DiceTestingPage(): React.JSX.Element {
    const [showSvgTest, setShowSvgTest] = useState(false);
    const [testColor, setTestColor] = useState('#3937b8');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Dice Testing Tools
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Tools for testing and debugging dice components and color schemes.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* SVG Testing Tool */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    SVG Testing Tool
                                </h3>
                                <button
                                    onClick={() => setShowSvgTest(!showSvgTest)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    {showSvgTest ? 'Hide' : 'Show'} SVG Testing Tool
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Test SVG dice icons with different configurations and colors.
                            </p>
                            {showSvgTest && <DiceSvgTest />}
                        </div>

                        {/* Color Demo Tool */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Color Scheme Demo
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Test how different base colors generate complete dice color schemes.
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Test Color
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        value={testColor}
                                        onChange={(e) => setTestColor(e.target.value)}
                                        className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={testColor}
                                        onChange={(e) => setTestColor(e.target.value)}
                                        className="flex-1 max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <DiceColorDemo baseColor={testColor} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 
