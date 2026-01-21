import React from 'react';

import type { GroupingControlsProps } from './types';

export function GroupingControls({
    index,
    isGroupButton,
    onGroup,
    onUngroup,
    hoveredIndex,
    setHoveredIndex
}: GroupingControlsProps) {
    const controlKey = `${isGroupButton ? 'group' : 'ungroup'}-${index}`;
    const isHovered = hoveredIndex === controlKey;

    if (isGroupButton) {
        return (
            <div
                className="flex items-center justify-center h-2 cursor-pointer"
                onMouseEnter={() => {
                    setHoveredIndex(controlKey);
                }}
                onMouseLeave={() => {
                    setHoveredIndex(null);
                }}
            >
                <div className="z-10">
                    {isHovered && (
                        <button
                            type="button"
                            onClick={onGroup}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg"
                            title="Group with next item"
                        >
                            Group
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex items-center justify-center mt-1.5 mb-1.5 border-t border-blue-200 dark:border-blue-700 h-1 cursor-pointer"
            onMouseEnter={() => {
                setHoveredIndex(controlKey);
            }}
            onMouseLeave={() => {
                setHoveredIndex(null);
            }}
        >
            <div className="z-10">
                {isHovered && (
                    <button
                        type="button"
                        onClick={onUngroup}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                        title="Ungroup this item"
                    >
                        Ungroup
                    </button>
                )}
            </div>
        </div>
    );
}
