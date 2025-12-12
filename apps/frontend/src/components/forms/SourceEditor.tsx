import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import type { SourceMap } from '@shared/schema';
import {
    SOURCE_BOOK_MAP,
    SourceType,
    EditionId
} from '@shared/static-data';
import { GetSourceBookTypeList } from '@shared/utils';

import { CustomSelect } from './index';

export interface SourceEditorProps {
    sources: SourceMap[];
    onSourcesChange: (sources: SourceMap[]) => void;
    sourceType: SourceType;
    editionId?: EditionId;
    className?: string;
}

export function SourceEditor({ sources, onSourcesChange, sourceType, editionId, className = '' }: SourceEditorProps) {
    const [selectedBookId, setSelectedBookId] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<string>('');

    // Filter out already selected books
    const availableBooks = GetSourceBookTypeList(sourceType, editionId).filter(book =>
        !sources.some(source => source.sourceBookId === book.value)
    );

    const handleAddSource = () => {
        if (!selectedBookId) return;

        const newSource: SourceMap = {
            sourceBookId: selectedBookId,
            pageNumber: pageNumber ? parseInt(pageNumber) : null
        };

        onSourcesChange([...sources, newSource]);
        setSelectedBookId(0);
        setPageNumber('');
    };

    const handleRemoveSource = (sourceBookId: number) => {
        onSourcesChange(sources.filter(source => source.sourceBookId !== sourceBookId));
    };

    const handlePageNumberChange = (sourceBookId: number, newPageNumber: string) => {
        const updatedSources = sources.map(source =>
            source.sourceBookId === sourceBookId
                ? { ...source, pageNumber: newPageNumber ? parseInt(newPageNumber) : null }
                : source
        );
        onSourcesChange(updatedSources);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Source References
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {sources.length} source{sources.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Current Sources */}
            {sources.length > 0 && (
                <div className="space-y-2">
                    {sources.map((source) => {
                        const book = SOURCE_BOOK_MAP[source.sourceBookId];
                        return (
                            <div key={source.sourceBookId} className="flex items-center gap-3 p-3 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {book?.name || 'Unknown Book'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {book?.abbreviation || 'N/A'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600 dark:text-gray-400">Page:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={source.pageNumber || ''}
                                        onChange={(e) => handlePageNumberChange(source.sourceBookId, e.target.value)}
                                        className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        placeholder="Page"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSource(source.sourceBookId)}
                                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add New Source */}
            {availableBooks.length > 0 && (
                <div className="flex items-end gap-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex-1">
                        <CustomSelect
                            label="Source Book"
                            value={selectedBookId}
                            onValueChange={setSelectedBookId}
                            options={availableBooks}
                            placeholder="Select a source book"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-1/4"
                        />
                    </div>
                    <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Page
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={pageNumber}
                            onChange={(e) => setPageNumber(e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            placeholder="Page"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAddSource}
                        disabled={!selectedBookId}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add
                    </button>
                </div>
            )}

            {availableBooks.length === 0 && sources.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    All available source books have been added.
                </div>
            )}
        </div>
    );
}
