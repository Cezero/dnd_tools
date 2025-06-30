import { useParams, Link } from 'react-router-dom';
import React, { Fragment } from 'react';
import { ProcessMarkdown } from '@/components/Markdown/ProcessMarkdown';

export const ReferenceTableViewer = () => {
    const { id } = useParams();


    return (
        <Fragment>
            <ProcessMarkdown markdown={`[Table: ${id}]`} />
            <div className="mt-4">
                <Link to={`/admin/referencetables/${id}/edit`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Edit Table
                </Link>
            </div>
        </Fragment>
    );
};
