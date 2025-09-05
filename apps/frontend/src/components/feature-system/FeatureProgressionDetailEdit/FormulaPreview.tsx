import React from 'react';

import type { FormulaPreviewProps } from './types';
import { useFormulaPreview } from './useFormulaPreview';

export function FormulaPreview({
    item,
    progressionLevel,
    featureName
}: FormulaPreviewProps) {
    const { generateFormulaPreview, hasPreviewableFormula } = useFormulaPreview();

    if (!hasPreviewableFormula(item)) {
        return null;
    }

    const previewText = generateFormulaPreview(item, progressionLevel, featureName);

    if (!previewText) {
        return null;
    }

    return (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            <div className="font-medium mb-1">Formula Preview:</div>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                {previewText}
            </div>
        </div>
    );
}
