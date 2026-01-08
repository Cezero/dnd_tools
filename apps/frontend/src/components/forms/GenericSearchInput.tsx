import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef, useCallback } from 'react';

export type SearchableItem = {
    id: number;
    name: string;
    [key: string]: unknown; // Allow additional properties
};

// Stable default function for getDisplayName
const defaultGetDisplayName = <T extends SearchableItem>(item: T) => item.name;

interface GenericSearchInputProps<T extends SearchableItem> {
    value: number | null;
    onValueChange: (itemId: number | null) => void;
    items: T[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
    labelExtraClassName?: string;
    getDisplayName?: (item: T) => string; // Optional function to customize display name
    emptyMessage?: string; // Custom message when no results found
    maxResults?: number; // Maximum number of results to show (default: 10)
}

export function GenericSearchInput<T extends SearchableItem>({
    value,
    onValueChange,
    items,
    label,
    placeholder = 'Search...',
    disabled = false,
    componentExtraClassName = '',
    labelExtraClassName = '',
    getDisplayName = defaultGetDisplayName,
    emptyMessage,
    maxResults = 10,
}: GenericSearchInputProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState<T[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Memoize getDisplayName to prevent infinite loops when using default function
    const stableGetDisplayName = useCallback(
        (item: T) => getDisplayName(item),
        [getDisplayName]
    );

    // Filter items based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredItems([]);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        
        // Filter items that match the search term
        const filtered = items.filter(item => {
            const displayName = stableGetDisplayName(item);
            return displayName.toLowerCase().includes(searchTermLower);
        });

        // Sort results to prioritize exact matches and prefix matches
        filtered.sort((a, b) => {
            const nameA = stableGetDisplayName(a).toLowerCase();
            const nameB = stableGetDisplayName(b).toLowerCase();
            
            // Exact match gets highest priority
            const exactMatchA = nameA === searchTermLower;
            const exactMatchB = nameB === searchTermLower;
            if (exactMatchA && !exactMatchB) return -1;
            if (!exactMatchA && exactMatchB) return 1;
            
            // Prefix match gets second priority
            const startsWithA = nameA.startsWith(searchTermLower);
            const startsWithB = nameB.startsWith(searchTermLower);
            if (startsWithA && !startsWithB) return -1;
            if (!startsWithA && startsWithB) return 1;
            
            // Otherwise, maintain alphabetical order
            return nameA.localeCompare(nameB);
        });

        // Slice to maxResults after sorting
        setFilteredItems(filtered.slice(0, maxResults));
    }, [searchTerm, items, stableGetDisplayName, maxResults]);

    // Set selected item when value changes
    useEffect(() => {
        if (value && items.length > 0) {
            const item = items.find(i => i.id === value);
            if (item) {
                setSelectedItem(item);
                setSearchTerm(stableGetDisplayName(item));
            } else {
                setSelectedItem(null);
                setSearchTerm('');
            }
        } else {
            setSelectedItem(null);
            setSearchTerm('');
        }
    }, [value, items, stableGetDisplayName]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setIsOpen(term.length > 0);

        // Clear selection if user is typing
        if (selectedItem && term !== stableGetDisplayName(selectedItem)) {
            setSelectedItem(null);
            onValueChange(null);
        }
    };

    // Handle item selection
    const handleItemSelect = (item: T) => {
        setSelectedItem(item);
        setSearchTerm(stableGetDisplayName(item));
        setIsOpen(false);
        onValueChange(item.id);
    };

    // Handle input focus
    const handleInputFocus = () => {
        if (searchTerm.length > 0) {
            setIsOpen(true);
        }
    };

    // Handle input blur
    const handleInputBlur = (e: React.FocusEvent) => {
        // Don't close if clicking on dropdown
        if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsOpen(false);
    };

    // Handle clear
    const handleClear = () => {
        setSelectedItem(null);
        setSearchTerm('');
        setIsOpen(false);
        onValueChange(null);
        inputRef.current?.focus();
    };

    const getEmptyMessage = () => {
        if (emptyMessage) {
            // Replace {searchTerm} placeholder if present
            return emptyMessage.replace('{searchTerm}', searchTerm);
        }
        return `No items found matching "${searchTerm}"`;
    };

    return (
        <div className={`relative ${componentExtraClassName}`}>
            {label && (
                <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${labelExtraClassName}`}>
                    {label}
                </label>
            )}

            <div className="relative">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    />
                    {selectedItem && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            ×
                        </button>
                    )}
                    {!selectedItem && (
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleItemSelect(item)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                >
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {stableGetDisplayName(item)}
                                    </div>
                                </button>
                            ))
                        ) : searchTerm.length > 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {getEmptyMessage()}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

