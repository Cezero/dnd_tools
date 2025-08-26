import { ContextMenu } from '@base-ui-components/react/context-menu';
import { Tooltip } from '@base-ui-components/react/tooltip';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { CheckIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronDoubleUpIcon, ChevronDoubleDownIcon, FunnelIcon as FunnelIconSolid } from '@heroicons/react/24/solid';
import { flexRender, type Header, type Column } from '@tanstack/react-table';
import React, { useState, useRef } from 'react';

import { FilterSubmenu } from './FilterSubmenu';
import { formatFilterTooltip } from './filterTooltipUtils';
import { FilterConfig, FilterValue, DataItem } from './types';
import { FilterType } from '@shared/static-data';

interface ColumnHeaderContextMenuProps {
    header: Header<DataItem, unknown>;
    allColumns: Column<DataItem, unknown>[];
    onToggleVisibility: (columnId: string) => void;
    onSort: (columnId: string, direction: 'asc' | 'desc') => void;
    columnFilters: FilterValue[];
    handleFilterChange: (columnId: string, value: FilterValue) => void;
    handleClearFilter: (columnId: string) => void;
    onRestoreHiddenColumn?: (hiddenColumnId: string, positionAfterColumnId: string) => void;
    dragAttributes?: DraggableAttributes;
    dragListeners?: DraggableSyntheticListeners;
}

export const ColumnHeaderContextMenu: React.FC<ColumnHeaderContextMenuProps> = ({
    header,
    allColumns,
    onToggleVisibility,
    onSort,
    columnFilters,
    handleFilterChange,
    handleClearFilter,
    onRestoreHiddenColumn,
    dragAttributes,
    dragListeners
}) => {
    const sortDirection = header.column.getIsSorted();
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [isFilterSubmenuOpen, setIsFilterSubmenuOpen] = useState(false);
    const [isRestoreHiddenSubmenuOpen, setIsRestoreHiddenSubmenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [isProgrammaticallyOpened, setIsProgrammaticallyOpened] = useState(false);
    const submenuTriggerRef = useRef<HTMLDivElement>(null);
    const restoreHiddenSubmenuTriggerRef = useRef<HTMLDivElement>(null);

    // Get hidden columns
    const hiddenColumns = allColumns.filter(col => !col.getIsVisible());

    const handleFilterIconClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const filterConfig = header.column.columnDef.meta as FilterConfig;

        if (filterConfig?.filterType === FilterType.TEXT_INPUT) {
            // For text input, trigger the text input visibility toggle
            handleFilterChange(header.id, { id: header.id, type: 'toggle_text_input' });
        } else {
            // For other filter types, open the context menu and filter submenu at click position
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setIsProgrammaticallyOpened(true);
            setIsContextMenuOpen(true);
            setIsFilterSubmenuOpen(true);
        }
    };

    const handleContextMenuOpen = (open: boolean) => {
        setIsContextMenuOpen(open);
        if (!open) {
            setIsFilterSubmenuOpen(false);
            setIsProgrammaticallyOpened(false);
        }
    };

    const handleRightClick = (e: React.MouseEvent) => {
        // Capture position for right-click events
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setIsProgrammaticallyOpened(false);
    };

    const handleFilterSubmenuOpenChange = (open: boolean) => {
        setIsFilterSubmenuOpen(open);
    };

    const handleRestoreHiddenSubmenuOpenChange = (open: boolean) => {
        setIsRestoreHiddenSubmenuOpen(open);
    };

    const handleRestoreHiddenColumn = (hiddenColumnId: string) => {
        if (onRestoreHiddenColumn) {
            onRestoreHiddenColumn(hiddenColumnId, header.id);
            setIsRestoreHiddenSubmenuOpen(false);
            setIsContextMenuOpen(false);
        }
    };

    return (
        <ContextMenu.Root
            open={isContextMenuOpen}
            onOpenChange={handleContextMenuOpen}
        >
            <ContextMenu.Trigger onContextMenu={handleRightClick}>
                <div className="flex items-center">
                    <div
                        {...dragAttributes}
                        {...dragListeners}
                        className="flex items-center cursor-move select-none"
                    >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    {header.column.getIsSorted() === 'asc' && (
                        <ChevronDoubleUpIcon className="w-4 h-4 ml-1 inline-block" />
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                        <ChevronDoubleDownIcon className="w-4 h-4 ml-1 inline-block" />
                    )}
                    {header.column.getCanFilter() && columnFilters.some(f => f.id === header.id) && (
                        <Tooltip.Root>
                            <Tooltip.Trigger>
                                <FunnelIconSolid
                                    className="w-4 h-4 ml-1 inline-block cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                    onClick={handleFilterIconClick}
                                />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                                <Tooltip.Positioner>
                                    <Tooltip.Popup className="px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg">
                                        {formatFilterTooltip(
                                            columnFilters.find(f => f.id === header.id),
                                            header.column.columnDef.meta as FilterConfig,
                                            columnFilters
                                        )}
                                    </Tooltip.Popup>
                                </Tooltip.Positioner>
                            </Tooltip.Portal>
                        </Tooltip.Root>
                    )}
                </div>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Positioner
                    style={{
                        position: 'fixed',
                        left: contextMenuPosition.x,
                        top: contextMenuPosition.y,
                        transform: 'translate(-50%, 8px)'
                    }}
                >
                    <ContextMenu.Popup className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-[160px]">
                        <ContextMenu.Item
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSort(header.id, 'asc');
                            }}
                            className={`px-2 py-1 text-sm ${isProgrammaticallyOpened ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'} flex items-center ${sortDirection === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                            <div className="flex items-center w-full">
                                <div className="w-4 h-4 flex items-center justify-center">
                                    {sortDirection === 'asc' && <CheckIcon className="w-4 h-4" />}
                                </div>
                                <span className="ml-1">Sort Ascending</span>
                            </div>
                        </ContextMenu.Item>
                        <ContextMenu.Item
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSort(header.id, 'desc');
                            }}
                            className={`px-2 py-1 text-sm ${isProgrammaticallyOpened ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'} flex items-center ${sortDirection === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                            <div className="flex items-center w-full">
                                <div className="w-4 h-4 flex items-center justify-center">
                                    {sortDirection === 'desc' && <CheckIcon className="w-4 h-4" />}
                                </div>
                                <span className="ml-1">Sort Descending</span>
                            </div>
                        </ContextMenu.Item>
                        {header.column.getCanFilter() && (
                            <ContextMenu.SubmenuRoot
                                open={isFilterSubmenuOpen}
                                onOpenChange={handleFilterSubmenuOpenChange}
                            >
                                <ContextMenu.SubmenuTrigger
                                    ref={submenuTriggerRef}
                                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center focus:outline-none"
                                    onMouseEnter={() => {
                                        if (isProgrammaticallyOpened) {
                                            setIsProgrammaticallyOpened(false);
                                        }
                                    }}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            {/* Reserved space for icon */}
                                        </div>
                                        <span className="ml-1">Filter</span>
                                        <ChevronRightIcon className="w-4 h-4 ml-auto" />
                                    </div>
                                </ContextMenu.SubmenuTrigger>
                                <ContextMenu.Portal>
                                    <ContextMenu.Positioner
                                        alignOffset={-4}
                                        sideOffset={-4}
                                    >
                                        <ContextMenu.Popup
                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-[160px]"
                                        >
                                            <FilterSubmenu
                                                columnId={header.id}
                                                filterConfig={header.column.columnDef.meta as FilterConfig}
                                                currentFilter={columnFilters.find(f => f.id === header.id)}
                                                columnFilters={columnFilters}
                                                onFilterChange={(value) => {
                                                    handleFilterChange(header.id, value);
                                                    setIsFilterSubmenuOpen(false);
                                                    setIsContextMenuOpen(false);
                                                }}
                                            />
                                        </ContextMenu.Popup>
                                    </ContextMenu.Positioner>
                                </ContextMenu.Portal>
                            </ContextMenu.SubmenuRoot>
                        )}

                        {/* Clear Filter - only show if column has active filters */}
                        {header.column.getCanFilter() && columnFilters.some(f => f.id === header.id) && (
                            <ContextMenu.Item
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleClearFilter(header.id);
                                }}
                                className={`px-2 py-1 text-sm ${isProgrammaticallyOpened ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'} text-gray-700 dark:text-gray-200 focus:outline-none`}
                            >
                                <div className="flex items-center w-full">
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <XMarkIcon className="w-4 h-4" />
                                    </div>
                                    <span className="ml-1">Clear Filter</span>
                                </div>
                            </ContextMenu.Item>
                        )}
                        <ContextMenu.Separator className="my-1 border-t border-gray-200 dark:border-gray-600" />

                        {/* Hide/Show current column */}
                        <ContextMenu.Item
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleVisibility(header.id);
                            }}
                            className={`px-2 py-1 text-sm ${isProgrammaticallyOpened ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'} text-gray-700 dark:text-gray-200`}
                        >
                            <div className="flex items-center w-full">
                                <div className="w-4 h-4 flex items-center justify-center">
                                    {/* Reserved space for checkmark */}
                                </div>
                                <span className="ml-1">
                                    {header.column.getCanHide() && (
                                        allColumns.find(col => col.id === header.id)?.getIsVisible() ? 'Hide' : 'Show'
                                    )}
                                </span>
                            </div>
                        </ContextMenu.Item>

                        {/* Restore Hidden Columns submenu - only show if there are hidden columns */}
                        {hiddenColumns.length > 0 && onRestoreHiddenColumn && (
                            <ContextMenu.SubmenuRoot
                                open={isRestoreHiddenSubmenuOpen}
                                onOpenChange={handleRestoreHiddenSubmenuOpenChange}
                            >
                                <ContextMenu.SubmenuTrigger
                                    ref={restoreHiddenSubmenuTriggerRef}
                                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center focus:outline-none"
                                    onMouseEnter={() => {
                                        if (isProgrammaticallyOpened) {
                                            setIsProgrammaticallyOpened(false);
                                        }
                                    }}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            {/* Reserved space for icon */}
                                        </div>
                                        <span className="ml-1">Restore Hidden</span>
                                        <ChevronRightIcon className="w-4 h-4 ml-auto" />
                                    </div>
                                </ContextMenu.SubmenuTrigger>
                                <ContextMenu.Portal>
                                    <ContextMenu.Positioner
                                        alignOffset={-4}
                                        sideOffset={-4}
                                    >
                                        <ContextMenu.Popup
                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg py-1 min-w-[160px]"
                                        >
                                            {hiddenColumns.map((hiddenColumn) => (
                                                <ContextMenu.Item
                                                    key={hiddenColumn.id}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleRestoreHiddenColumn(hiddenColumn.id);
                                                    }}
                                                    className="px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                >
                                                    <div className="flex items-center w-full">
                                                        <div className="w-4 h-4 flex items-center justify-center">
                                                            {/* Reserved space for icon */}
                                                        </div>
                                                        <span className="ml-1">
                                                            {(() => {
                                                                const header = hiddenColumn.columnDef.header;
                                                                if (typeof header === 'string') {
                                                                    return header;
                                                                } else if (typeof header === 'function') {
                                                                    // For function headers, try to get a display name
                                                                    return hiddenColumn.id;
                                                                } else if (React.isValidElement(header)) {
                                                                    // For React elements, try to extract text content
                                                                    const textContent = (header as React.ReactElement<{ children?: string }>)?.props?.children;
                                                                    if (typeof textContent === 'string') {
                                                                        return textContent;
                                                                    }
                                                                    return hiddenColumn.id;
                                                                } else {
                                                                    return hiddenColumn.id;
                                                                }
                                                            })()}
                                                        </span>
                                                    </div>
                                                </ContextMenu.Item>
                                            ))}
                                        </ContextMenu.Popup>
                                    </ContextMenu.Positioner>
                                </ContextMenu.Portal>
                            </ContextMenu.SubmenuRoot>
                        )}
                    </ContextMenu.Popup>
                </ContextMenu.Positioner>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}; 
