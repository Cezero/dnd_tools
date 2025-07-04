import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ReferenceTableService } from '@/features/admin/features/reference-table-management/ReferenceTableService';
import { ReferenceTableDataResponse } from '@shared/schema';

export function ReferenceTableViewer() {
    const { identifier } = useParams();
    const [table, setTable] = useState<ReferenceTableDataResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await ReferenceTableService.getReferenceTableByIdentifier(undefined, { identifier: identifier! });
                setTable(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch reference table:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [identifier, location.state]);

    const innerCellContentClasses = "p-3 bg-white dark:bg-gray-700 dark:border-gray-500 rounded-lg border w-full";
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-500 rounded-lg shadow-lg p-1";

    if (isLoading) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Loading...
                </div>
            </div>
        </div>
    );
    if (!table) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Reference table not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">{table.name}</h1>
                        <div className="text-right">
                            <p><strong>Slug:</strong> {table.slug}</p>
                            <p><strong>Rows:</strong> {table.rows?.length || 0}</p>
                            <p><strong>Columns:</strong> {table.columns?.length || 0}</p>
                        </div>
                    </div>

                    {table.description && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Description:</h3>
                            <ProcessMarkdown markdown={table.description} />
                        </div>
                    )}

                    {table.columns && table.rows && (
                        <div className="mt-6">
                            <h3 className="text-lg font-bold mb-4">Table Data</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-gray-300 dark:border-gray-600">
                                    <thead>
                                        <tr>
                                            {table.columns.map((column, index) => (
                                                <th
                                                    key={column.id || index}
                                                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-left"
                                                    colSpan={column.span || 1}
                                                >
                                                    {column.header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {table.rows.map((row, rowIndex) => (
                                            <tr key={row.id || rowIndex}>
                                                {table.columns?.map((column, colIndex) => {
                                                    const cell = row.cells?.find(c => c.columnId === column.id);
                                                    return (
                                                        <td
                                                            key={`${row.id}-${column.id}`}
                                                            className="border border-gray-300 dark:border-gray-600 px-4 py-2"
                                                            colSpan={cell?.colSpan || 1}
                                                            rowSpan={cell?.rowSpan || 1}
                                                        >
                                                            {cell?.value || ''}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 text-right">
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/referencetables${fromListParams ? `?${fromListParams}` : ''}`)}
                            className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500"
                        >
                            Back to List
                        </button>
                        {isAdmin && (
                            <Link
                                to={`/admin/referencetables/${identifier}/edit`}
                                state={{ fromListParams: fromListParams }}
                                className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500"
                            >
                                Edit Table
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
