import { Tooltip } from '@base-ui-components/react/tooltip';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CollapsibleSectionProps {
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    tooltipText?: string;
    title?: string;
    showTitleWhenCollapsed?: boolean;
}

export function CollapsibleSection({
    children,
    isExpanded,
    onToggle,
    tooltipText,
    title,
    showTitleWhenCollapsed = false
}: CollapsibleSectionProps): React.JSX.Element {
    if (showTitleWhenCollapsed && title) {
        // Collapsible section with visible title
        return (
            <div className="mb-2 mx-0 border border-gray-200 dark:border-[#6a7282] rounded px-2 pb-2 pt-0 relative">
                <div className="flex items-center gap-1 mb-1">
                    <button
                        type="button"
                        onClick={onToggle}
                        className="flex items-center justify-center w-3 h-3 text-xs text-gray-400 dark:text-[#6F7E97] hover:text-gray-600 dark:hover:text-[#A1ADC2] transition-colors"
                        aria-expanded={isExpanded}
                    >
                        {isExpanded ? (
                            <ChevronDownIcon className="w-3 h-3" />
                        ) : (
                            <ChevronRightIcon className="w-3 h-3" />
                        )}
                    </button>
                    <span className="text-lg font-semibold">{title}</span>
                </div>
                {isExpanded && <div className="pt-2 [&_.prose-custom]:mt-0 [&_.prose-custom>p:first-child]:mt-0">{children}</div>}
            </div>
        );
    }

    // Standard collapsible section (no title, or title hidden when collapsed)
    return (
        <div className="mb-2 mx-0 border border-gray-200 dark:border-[#6a7282] rounded px-2 pb-2 pt-0 relative">
            {tooltipText ? (
                <Tooltip.Root>
                    <Tooltip.Trigger>
                        <button
                            type="button"
                            onClick={onToggle}
                            className="absolute -top-1.5 left-2 flex items-center justify-center w-3 h-3 bg-[var(--color-bg-content)] dark:bg-[var(--color-bg-content-dark)] border border-gray-300 dark:border-[#6a7282] rounded text-xs text-gray-400 dark:text-[#6F7E97] hover:text-gray-600 dark:hover:text-[#A1ADC2] transition-colors z-10"
                            aria-expanded={isExpanded}
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="w-3 h-3" />
                            ) : (
                                <ChevronRightIcon className="w-3 h-3" />
                            )}
                        </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                        <Tooltip.Positioner side="top" sideOffset={18}>
                            <Tooltip.Popup className="px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 border border-gray-600 dark:border-gray-500 rounded shadow-lg">
                                {tooltipText}
                            </Tooltip.Popup>
                        </Tooltip.Positioner>
                    </Tooltip.Portal>
                </Tooltip.Root>
            ) : (
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute -top-1.5 left-2 flex items-center justify-center w-3 h-3 bg-[var(--color-bg-content)] dark:bg-[var(--color-bg-content-dark)] border border-gray-300 dark:border-[#6a7282] rounded text-xs text-gray-400 dark:text-[#6F7E97] hover:text-gray-600 dark:hover:text-[#A1ADC2] transition-colors z-10"
                    aria-expanded={isExpanded}
                >
                    {isExpanded ? (
                        <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                        <ChevronRightIcon className="w-3 h-3" />
                    )}
                </button>
            )}
            {isExpanded && <div className="-mt-4 [&_.prose-custom]:mt-0 [&_.prose-custom>p:first-child]:mt-0">{children}</div>}
        </div>
    );
}

