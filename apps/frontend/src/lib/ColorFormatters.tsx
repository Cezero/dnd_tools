import React from 'react';

// Color formatter component for displaying color swatches with hex values
export function ColorSwatch({ color }: { color: string }): React.ReactElement {
    if (!color) return <span>-</span>;

    return (
        <div className="flex items-center space-x-2">
            <div
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: color }}
            />
            <span className="text-sm font-mono">{color}</span>
        </div>
    );
}
