import React, { Suspense, useEffect, useState } from 'react';

import { RenderMarkdown } from '@/plugins/RenderMarkdown';
import { MarkdownComponentProps } from '@/plugins/types';
import { ErrorBoundary } from '@/lib/ErrorBoundary';
import { preloadTablesFromMarkdown } from '@/lib/TableResolution';


export function ProcessMarkdown(props: MarkdownComponentProps): React.JSX.Element {
    const [preloaded, setPreloaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setPreloaded(false);
        setError(null);

        preloadTablesFromMarkdown(props)
            .then(() => setPreloaded(true))
            .catch((err) => setError(err));
    }, [props.markdown, props.id]);

    if (error) {
        return <div>Error loading table data.</div>;
    }

    if (!preloaded) {
        return <div>Loading table data...</div>;
    }

    return (
        <ErrorBoundary fallback={<div>Error loading markdown.</div>}>
            <Suspense fallback={<div>Loading markdown...</div>}>
                <div className="prose dark:prose-invert">
                    {RenderMarkdown(props)}
                </div>
            </Suspense>
        </ErrorBoundary>
    )
}
