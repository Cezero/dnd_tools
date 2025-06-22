import { useState, useEffect } from 'react';

// COLUMN_DEFINITIONS and DEFAULT_COLUMNS will now be passed in

function useColumnConfig(storageKey, defaultColumns, columnDefinitions, requiredColumnId) {
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const savedColumns = localStorage.getItem(storageKey);
        let parsedColumns = savedColumns ? JSON.parse(savedColumns) : defaultColumns;
        // Filter out any columns that are no longer defined in columnDefinitions
        parsedColumns = parsedColumns.filter(colId => columnDefinitions[colId] !== undefined);

        // Ensure requiredColumnId is always included and is the first column if it exists
        if (requiredColumnId && !parsedColumns.includes(requiredColumnId)) {
            parsedColumns = [requiredColumnId, ...parsedColumns];
        } else if (requiredColumnId && parsedColumns.includes(requiredColumnId)) {
            parsedColumns = [requiredColumnId, ...parsedColumns.filter(id => id !== requiredColumnId)];
        }
        return parsedColumns;
    });

    useEffect(() => {
        // Ensure requiredColumnId is always included before saving
        let columnsToSave = visibleColumns;
        if (requiredColumnId && !columnsToSave.includes(requiredColumnId)) {
            columnsToSave = [requiredColumnId, ...columnsToSave];
        } else if (requiredColumnId && columnsToSave.includes(requiredColumnId)) {
            columnsToSave = [requiredColumnId, ...columnsToSave.filter(id => id !== requiredColumnId)];
        }
        localStorage.setItem(storageKey, JSON.stringify(columnsToSave));
    }, [visibleColumns, storageKey, requiredColumnId]);

    return [visibleColumns, setVisibleColumns];
}

function ColumnConfigModal({ isOpen, onClose, visibleColumns, setVisibleColumns, columnDefinitions, requiredColumnId }) {
    if (!isOpen) return null;

    const handleToggleColumn = (columnId) => {
        setVisibleColumns(prev => {
            if (prev.includes(columnId)) {
                // Don't remove if it would leave no columns or if it's the requiredColumnId
                if (prev.length === 1 || columnId === requiredColumnId) return prev;
                return prev.filter(id => id !== columnId);
            } else {
                return [...prev, columnId];
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg max-w-md w-full border border-gray-300 dark:border-gray-600" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 dark:text-white">Configure Columns</h2>
                <div className="space-y-2">
                    {Object.entries(columnDefinitions).map(([id, { label }]) => (
                        <label key={id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={visibleColumns.includes(id)}
                                onChange={() => handleToggleColumn(id)}
                                disabled={id === requiredColumnId} // Disable if it's the required column
                                className={`form-checkbox h-5 w-5 text-blue-600 ${id === requiredColumnId ? 'opacity-50' : ''}`}
                            />
                            <span className={`dark:text-white ${id === requiredColumnId ? 'font-semibold' : ''}`}>
                                {label}
                                {id === requiredColumnId && <span className="text-sm text-gray-500 ml-1">(required)</span>}
                            </span>
                        </label>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export { ColumnConfigModal, useColumnConfig }; 