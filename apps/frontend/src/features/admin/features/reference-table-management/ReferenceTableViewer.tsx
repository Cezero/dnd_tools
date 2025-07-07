import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { ReferenceTableService } from '@/features/admin/features/reference-table-management/ReferenceTableService';
import { ReferenceTableDataResponse, ReferenceTableSummary } from '@shared/schema';
import { RenderStructuredTable } from '@/plugins/RenderStructuredTable';

export function ReferenceTableViewer() {
    const { slug } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    const innerCellContentClasses = "p-3 bg-white dark:bg-gray-700 dark:border-gray-500 rounded-lg border w-full";
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-500 rounded-lg shadow-lg p-1";

    const [tableSummary, setTableSummary] = useState<ReferenceTableSummary | null>(null);

    useEffect(() => {
        const Initialize = async () => {
            const summary = await ReferenceTableService.getReferenceTableSummaryBySlug(undefined, { slug: slug! });
            setTableSummary(summary);
        };
        Initialize();
    }, [slug]);

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">{tableSummary?.name}</h1>
                        <div className="text-right">
                            <p><strong>Slug:</strong> {slug}</p>
                            <p><strong>Rows:</strong> {tableSummary?.rows || 0}</p>
                            <p><strong>Columns:</strong> {tableSummary?.columns || 0}</p>
                        </div>
                    </div>

                    {tableSummary?.description && (
                        <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                            <h3 className="text-lg font-bold">Description:</h3>
                            <ProcessMarkdown markdown={tableSummary.description} />
                        </div>
                    )}

                    <div className="mt-4">
                        <ProcessMarkdown markdown={`[table: ${slug}]`} />
                    </div>

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
                                to={`/admin/referencetables/${slug}/edit`}
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
