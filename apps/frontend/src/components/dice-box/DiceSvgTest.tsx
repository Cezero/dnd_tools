import React from 'react';
import { icons } from '@/assets/icons';
import type { DiceType } from '@/assets/icons';

interface DiceSvgTestProps {
    className?: string;
}

export function DiceSvgTest({ className = '' }: DiceSvgTestProps): React.JSX.Element {
    const [svgStyles, setSvgStyles] = React.useState({
        // die_edges properties  
        edgesStroke: '#0f1138',
        edgesFill: 'none',
        edgesFillEnabled: false,
        edgesStrokeEnabled: true,
        edgesStrokeWidth: 2,

        // die_numbers properties
        numbersFill: '#ffffff',
        numbersStroke: 'none',
        numbersFillEnabled: true,
        numbersStrokeEnabled: false,
        numbersStrokeWidth: 1,

        // die_color (main face)
        mainFill: '#292c94'
    });

    const D6Icon = icons.d6;
    const D20Icon = icons.d20;

    const handleStyleChange = (property: string, value: string | boolean | number) => {
        setSvgStyles(prev => ({
            ...prev,
            [property]: value
        }));
    };

    const iconStyle = {
        '--die-color-fill': svgStyles.mainFill,
        '--die-edges-stroke': svgStyles.edgesStrokeEnabled ? svgStyles.edgesStroke : 'none',
        '--die-edges-fill': svgStyles.edgesFillEnabled ? svgStyles.edgesFill : 'none',
        '--die-edges-stroke-width': svgStyles.edgesStrokeWidth + 'px',
        '--die-numbers-fill': svgStyles.numbersFillEnabled ? svgStyles.numbersFill : 'none',
        '--die-numbers-stroke': svgStyles.numbersStrokeEnabled ? svgStyles.numbersStroke : 'none',
        '--die-numbers-stroke-width': svgStyles.numbersStrokeWidth + 'px'
    } as React.CSSProperties;

    return (
        <div className={`space-y-8 ${className}`}>
            <div>
                <h3 className="text-xl font-semibold mb-4">Dice SVG Property Testing</h3>
                <p className="text-sm text-secondary mb-6">
                    Adjust the properties below to see how they affect the dice appearance.
                </p>
            </div>

            {/* Large Dice Display */}
            <div className="flex justify-center gap-12 mb-8">
                <div className="text-center">
                    <h4 className="font-medium mb-2">D6</h4>
                    <D6Icon
                        className="w-50 h-50"
                        style={iconStyle}
                        aria-label="d6"
                    />
                </div>
                <div className="text-center">
                    <h4 className="font-medium mb-2">D20</h4>
                    <D20Icon
                        className="w-50 h-50"
                        style={iconStyle}
                        aria-label="d20"
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* die_edges Controls */}
                <div className="bg-content p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-green-600">die_edges</h4>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="edgesFillEnabled"
                                    checked={svgStyles.edgesFillEnabled}
                                    onChange={(e) => handleStyleChange('edgesFillEnabled', e.target.checked)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-secondary rounded"
                                />
                                <label htmlFor="edgesFillEnabled" className="text-sm font-medium">Enable Fill</label>
                            </div>
                            {svgStyles.edgesFillEnabled && (
                                <div className="ml-6">
                                    <label className="block text-sm font-medium mb-1">Fill Color:</label>
                                    <input
                                        type="color"
                                        value={svgStyles.edgesFill}
                                        onChange={(e) => handleStyleChange('edgesFill', e.target.value)}
                                        className="w-full h-10 border border-secondary rounded bg-content"
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="edgesStrokeEnabled"
                                    checked={svgStyles.edgesStrokeEnabled}
                                    onChange={(e) => handleStyleChange('edgesStrokeEnabled', e.target.checked)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-secondary rounded"
                                />
                                <label htmlFor="edgesStrokeEnabled" className="text-sm font-medium">Enable Stroke</label>
                            </div>
                            {svgStyles.edgesStrokeEnabled && (
                                <div className="ml-6 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Stroke Color:</label>
                                        <input
                                            type="color"
                                            value={svgStyles.edgesStroke}
                                            onChange={(e) => handleStyleChange('edgesStroke', e.target.value)}
                                            className="w-full h-10 border border-secondary rounded bg-content"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Stroke Width: {svgStyles.edgesStrokeWidth}px</label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="8"
                                            step="0.5"
                                            value={svgStyles.edgesStrokeWidth}
                                            onChange={(e) => handleStyleChange('edgesStrokeWidth', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-xs text-secondary mt-1">
                                            <span>0.5px</span>
                                            <span>4px</span>
                                            <span>8px</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* die_numbers Controls */}
                <div className="bg-content p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-purple-600">die_numbers</h4>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="numbersFillEnabled"
                                    checked={svgStyles.numbersFillEnabled}
                                    onChange={(e) => handleStyleChange('numbersFillEnabled', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-secondary rounded"
                                />
                                <label htmlFor="numbersFillEnabled" className="text-sm font-medium">Enable Fill</label>
                            </div>
                            {svgStyles.numbersFillEnabled && (
                                <div className="ml-6">
                                    <label className="block text-sm font-medium mb-1">Fill Color:</label>
                                    <input
                                        type="color"
                                        value={svgStyles.numbersFill}
                                        onChange={(e) => handleStyleChange('numbersFill', e.target.value)}
                                        className="w-full h-10 border border-secondary rounded bg-content"
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="numbersStrokeEnabled"
                                    checked={svgStyles.numbersStrokeEnabled}
                                    onChange={(e) => handleStyleChange('numbersStrokeEnabled', e.target.checked)}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-secondary rounded"
                                />
                                <label htmlFor="numbersStrokeEnabled" className="text-sm font-medium">Enable Stroke</label>
                            </div>
                            {svgStyles.numbersStrokeEnabled && (
                                <div className="ml-6 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Stroke Color:</label>
                                        <input
                                            type="color"
                                            value={svgStyles.numbersStroke}
                                            onChange={(e) => handleStyleChange('numbersStroke', e.target.value)}
                                            className="w-full h-10 border border-secondary rounded bg-content"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Stroke Width: {svgStyles.numbersStrokeWidth}px</label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="4"
                                            step="0.5"
                                            value={svgStyles.numbersStrokeWidth}
                                            onChange={(e) => handleStyleChange('numbersStrokeWidth', parseFloat(e.target.value))}
                                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-xs text-secondary mt-1">
                                            <span>0.5px</span>
                                            <span>2px</span>
                                            <span>4px</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* die_color (main face) Controls */}
                <div className="bg-content p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-orange-600">die_color (main face)</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Fill Color:</label>
                            <input
                                type="color"
                                value={svgStyles.mainFill}
                                onChange={(e) => handleStyleChange('mainFill', e.target.value)}
                                className="w-full h-10 border border-secondary rounded bg-content"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Values Display */}
            <div className="bg-secondary p-4 rounded-lg">
                <h4 className="font-medium mb-2">Current CSS Custom Properties:</h4>
                <pre className="text-sm bg-content p-3 rounded border border-secondary overflow-x-auto text-foreground">
                    {`--die-color-fill: ${svgStyles.mainFill};
--die-edges-stroke: ${svgStyles.edgesStrokeEnabled ? svgStyles.edgesStroke : 'none'};
--die-edges-fill: ${svgStyles.edgesFillEnabled ? svgStyles.edgesFill : 'none'};
--die-edges-stroke-width: ${svgStyles.edgesStrokeWidth}px;
--die-numbers-fill: ${svgStyles.numbersFillEnabled ? svgStyles.numbersFill : 'none'};
--die-numbers-stroke: ${svgStyles.numbersStrokeEnabled ? svgStyles.numbersStroke : 'none'};
--die-numbers-stroke-width: ${svgStyles.numbersStrokeWidth}px;`}
                </pre>
            </div>
        </div>
    );
} 
