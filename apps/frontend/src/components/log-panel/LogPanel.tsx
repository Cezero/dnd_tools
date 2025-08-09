import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { ChevronUpIcon, ChevronDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useRef, useEffect, useState } from 'react';

import { LogEntryComponent } from './LogEntry';
import { useLogPanel } from './LogPanelProvider';

export function LogPanel(): React.JSX.Element {
    const { entries, isOpen, setIsOpen, clearLog } = useLogPanel();
    const [showHandle, setShowHandle] = useState<boolean>(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    // Mouse detection for showing handle
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent): void => {
            // Only show handle if panel is closed
            if (!isOpen) {
                // Check if mouse is in bottom 20px of viewport
                const threshold = 20;
                if (event.clientY > window.innerHeight - threshold) {
                    setShowHandle(true);
                } else {
                    setShowHandle(false);
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isOpen]);

    // Auto-scroll to bottom when panel opens or new entries are added
    useEffect(() => {
        if (isOpen && viewportRef.current) {
            const viewport = viewportRef.current;
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [isOpen, entries]);

    const handleTogglePanel = (): void => {
        setIsOpen(!isOpen);
    };

    const handleClearLog = (): void => {
        clearLog();
    };

    return (
        <>
            {/* Main Log Panel */}
            {isOpen && (
                <div className="absolute bottom-0 left-2 right-2 h-80 bg-gray-200 dark:bg-gray-700 shadow-lg z-20 rounded-t-lg border border-gray-300 dark:border-gray-600 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-600 flex-shrink-0">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            Log Panel ({entries.length} entries)
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClearLog}
                                className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                aria-label="Clear log"
                                title="Clear log"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleTogglePanel}
                                className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                                aria-label="Close log panel"
                                title="Close log panel"
                            >
                                <ChevronDownIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 overflow-hidden">
                        <ScrollArea.Root className="h-full">
                            <ScrollArea.Viewport
                                ref={viewportRef}
                                className="h-full p-3"
                            >
                                <ScrollArea.Content>
                                    {entries.length === 0 ? (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                            No log entries yet
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {entries.map((entry) => (
                                                <LogEntryComponent key={entry.id} entry={entry} />
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea.Content>
                            </ScrollArea.Viewport>
                            <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                                <ScrollArea.Thumb className="Thumb" />
                            </ScrollArea.Scrollbar>
                        </ScrollArea.Root>
                    </div>
                </div>
            )}

            {/* Hidden Panel Handle */}
            {!isOpen && showHandle && (
                <button
                    onClick={handleTogglePanel}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-8 w-16 flex items-center justify-center z-20
            bg-gray-300 dark:bg-gray-800 rounded-t-lg shadow-lg
            hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors duration-200"
                    aria-label="Open log panel"
                >
                    <ChevronUpIcon className="text-gray-800 dark:text-gray-100 w-4 h-4" />
                </button>
            )}
        </>
    );
} 
