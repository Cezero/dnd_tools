import { XCircleIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface FloatingTextInputProps {
    columnId: string;
    isVisible: boolean;
    position: { x: number; y: number; width: number };
    currentValue: string;
    placeholder?: string;
    onValueChange: (columnId: string, value: string) => void;
    onClose: () => void;
    debounceDelay?: number;
}

export const FloatingTextInput: React.FC<FloatingTextInputProps> = ({
    columnId,
    isVisible,
    position,
    currentValue,
    placeholder = 'Filter...',
    onValueChange,
    onClose,
    debounceDelay = 300
}) => {
    const [inputValue, setInputValue] = useState(currentValue);
    const [debouncedValue, setDebouncedValue] = useState(currentValue);
    const [hasBeenFocused, setHasBeenFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const focusTimeRef = useRef<number>(0);

    // Initialize the input value when it becomes visible
    useEffect(() => {
        if (isVisible) {
            console.log('FloatingTextInput: Initializing with value:', currentValue);
            setInputValue(currentValue);
            setDebouncedValue(currentValue);
            setHasBeenFocused(false);
        }
    }, [isVisible, currentValue]);

    // Focus input when it becomes visible
    useEffect(() => {
        if (isVisible && inputRef.current) {
            console.log('FloatingTextInput: Attempting to focus input');
            // Small delay to ensure the DOM is ready
            const focusTimeout = setTimeout(() => {
                if (inputRef.current) {
                    console.log('FloatingTextInput: Focusing input after delay');
                    inputRef.current.focus();
                    setHasBeenFocused(true);
                }
            }, 50);

            return () => clearTimeout(focusTimeout);
        }
    }, [isVisible]);

    // Debounce the input value
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedValue(inputValue);
        }, debounceDelay);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [inputValue, debounceDelay]);

    // Apply filter when debounced value changes
    useEffect(() => {
        if (debouncedValue !== currentValue) {
            console.log('FloatingTextInput: Applying filter:', debouncedValue);
            onValueChange(columnId, debouncedValue);
        }
    }, [debouncedValue, currentValue, columnId, onValueChange]);

    const handleClear = useCallback(() => {
        console.log('FloatingTextInput: Clearing input');
        setInputValue('');
        setDebouncedValue('');
        onValueChange(columnId, '');

        // Always close the input after clearing
        setTimeout(() => {
            console.log('FloatingTextInput: Closing after clear');
            onClose();
        }, 50);
    }, [columnId, onValueChange, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            console.log('FloatingTextInput: Enter pressed, applying filter and closing');
            // Apply the current input value immediately before closing
            onValueChange(columnId, inputValue);
            onClose();
        } else if (e.key === 'Escape') {
            console.log('FloatingTextInput: Escape pressed, closing');
            setInputValue(currentValue);
            onClose();
        }
    }, [currentValue, onClose, columnId, inputValue, onValueChange]);

    const handleBlur = useCallback(() => {
        const now = Date.now();
        const timeSinceFocus = now - focusTimeRef.current;

        console.log('FloatingTextInput: Blur event, hasBeenFocused:', hasBeenFocused, 'timeSinceFocus:', timeSinceFocus);

        // Only close if the input has been properly focused first
        if (hasBeenFocused) {
            // Ignore blur events that happen within 200ms of focus (likely context menu closing)
            if (timeSinceFocus < 200) {
                console.log('FloatingTextInput: Ignoring blur event (too soon after focus)');
                return;
            }

            // Clear any existing timeout
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }

            // Small delay to allow for clicking the clear button
            blurTimeoutRef.current = setTimeout(() => {
                console.log('FloatingTextInput: Closing after blur timeout');
                onClose();
            }, 150);
        }
    }, [hasBeenFocused, onClose]);

    const handleFocus = useCallback(() => {
        console.log('FloatingTextInput: Focus event');
        focusTimeRef.current = Date.now();
        setHasBeenFocused(true);
        // Clear any pending blur timeout
        if (blurTimeoutRef.current) {
            console.log('FloatingTextInput: Clearing pending blur timeout');
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = null;
        }
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
            }
        };
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
            style={{
                left: position.x,
                top: position.y,
                width: position.width,
                minWidth: '200px'
            }}
        >
            <div className="flex items-center relative p-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className="w-full pr-8 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {inputValue && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
                        title="Clear filter"
                    >
                        <XCircleIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}; 
