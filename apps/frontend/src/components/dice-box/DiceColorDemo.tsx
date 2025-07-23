import React from 'react';
import { DiceButton } from './DiceButton';
import { generateDiceColorScheme } from '@/utils/color-scheme';
import type { DiceType } from '@/assets/icons';

interface DiceColorDemoProps {
    className?: string;
    baseColor?: string;
}

const DEMO_COLORS = [
    '#2e8555', // Green (current default)
    '#dc2626', // Red
    '#2563eb', // Blue
    '#7c3aed', // Purple
    '#ea580c', // Orange
    '#059669', // Emerald
    '#be185d', // Pink
    '#1f2937', // Dark gray
];

export function DiceColorDemo({ className = '', baseColor }: DiceColorDemoProps): React.JSX.Element {
    const [selectedColor, setSelectedColor] = React.useState(baseColor || '#2e8555');
    const colorScheme = React.useMemo(() => generateDiceColorScheme(selectedColor), [selectedColor]);

    // Update selected color when baseColor prop changes
    React.useEffect(() => {
        if (baseColor) {
            setSelectedColor(baseColor);
        }
    }, [baseColor]);

    return (
        <div className={`space-y-6 ${className}`}>
            <div>
                <h3 className="text-lg font-semibold mb-4">Formulaic Color System Demo</h3>
                <p className="text-sm text-secondary mb-4">
                    Select a base color to see how the entire dice color scheme is automatically generated.
                </p>

                {/* Color Picker */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Base Color:</label>
                    <div className="flex flex-wrap gap-2">
                        {DEMO_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-8 h-8 rounded border-2 transition-colors ${selectedColor === color
                                    ? 'border-blue-500 scale-110'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select color ${color}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Color Scheme Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-content p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Default State</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.default.main }} />
                                <span>Main: {colorScheme.default.main}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.default.edges }} />
                                <span>Edges: {colorScheme.default.edges}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.default.numbers }} />
                                <span>Numbers: {colorScheme.default.numbers}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.default.edgesStrokeColor }} />
                                <span>Edge Stroke: {colorScheme.default.edgesStrokeColor} ({colorScheme.default.edgesStrokeWidth}px)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.default.numbersStrokeColor }} />
                                <span>Number Stroke: {colorScheme.default.numbersStrokeColor} ({colorScheme.default.numbersStrokeWidth}px)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-content p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Hover State</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.hover.main }} />
                                <span>Main: {colorScheme.hover.main}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.hover.edges }} />
                                <span>Edges: {colorScheme.hover.edges}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.hover.numbers }} />
                                <span>Numbers: {colorScheme.hover.numbers}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.hover.edgesStrokeColor }} />
                                <span>Edge Stroke: {colorScheme.hover.edgesStrokeColor} ({colorScheme.hover.edgesStrokeWidth}px)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.hover.numbersStrokeColor }} />
                                <span>Number Stroke: {colorScheme.hover.numbersStrokeColor} ({colorScheme.hover.numbersStrokeWidth}px)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-content p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Disabled State</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.disabled.main }} />
                                <span>Main: {colorScheme.disabled.main}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.disabled.edges }} />
                                <span>Edges: {colorScheme.disabled.edges}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.disabled.numbers }} />
                                <span>Numbers: {colorScheme.disabled.numbers}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.disabled.edgesStrokeColor }} />
                                <span>Edge Stroke: {colorScheme.disabled.edgesStrokeColor} ({colorScheme.disabled.edgesStrokeWidth}px)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colorScheme.disabled.numbersStrokeColor }} />
                                <span>Number Stroke: {colorScheme.disabled.numbersStrokeColor} ({colorScheme.disabled.numbersStrokeWidth}px)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dice Preview */}
            <div>
                <h4 className="font-medium mb-3">Dice Preview (Hover to see states)</h4>
                <div className="grid grid-cols-7 gap-2">
                    {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DiceType[]).map((diceType) => (
                        <DiceButton
                            key={diceType}
                            diceType={diceType}
                            colors={colorScheme.default}
                            className="w-12 h-12"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
} 
