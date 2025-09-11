import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SPELL_ID_LIST } from '@shared/static-data';
import type { Spell } from '@shared/schema';

interface SpellSearchInputProps {
    value: number | null;
    onValueChange: (spellId: number | null) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    componentExtraClassName?: string;
}

export function SpellSearchInput({
    value,
    onValueChange,
    label = 'Spell',
    placeholder = 'Search for a spell...',
    disabled = false,
    componentExtraClassName = ''
}: SpellSearchInputProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSpells, setFilteredSpells] = useState<Spell[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Use static spell data
    const spells = SPELL_ID_LIST;

    // Filter spells based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredSpells([]);
            return;
        }

        const filtered = spells.filter(spell =>
            spell.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10); // Limit to 10 results for performance

        setFilteredSpells(filtered);
    }, [searchTerm, spells]);

    // Set selected spell when value changes
    useEffect(() => {
        if (value && spells.length > 0) {
            const spell = spells.find(s => s.id === value);
            if (spell) {
                setSelectedSpell(spell);
                setSearchTerm(spell.name);
            } else {
                setSelectedSpell(null);
                setSearchTerm('');
            }
        } else {
            setSelectedSpell(null);
            setSearchTerm('');
        }
    }, [value, spells]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setIsOpen(term.length > 0);

        // Clear selection if user is typing
        if (selectedSpell && term !== selectedSpell.name) {
            setSelectedSpell(null);
            onValueChange(null);
        }
    };

    // Handle spell selection
    const handleSpellSelect = (spell: Spell) => {
        setSelectedSpell(spell);
        setSearchTerm(spell.name);
        setIsOpen(false);
        onValueChange(spell.id);
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
        setSelectedSpell(null);
        setSearchTerm('');
        setIsOpen(false);
        onValueChange(null);
        inputRef.current?.focus();
    };

    return (
        <div className={`relative ${componentExtraClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    {selectedSpell && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            ×
                        </button>
                    )}
                    {!selectedSpell && (
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                        {filteredSpells.length > 0 ? (
                            filteredSpells.map((spell) => (
                                <button
                                    key={spell.id}
                                    type="button"
                                    onClick={() => handleSpellSelect(spell)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none"
                                >
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {spell.name}
                                    </div>
                                    {spell.summary && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {spell.summary}
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : searchTerm.length > 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No spells found matching "{searchTerm}"
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
