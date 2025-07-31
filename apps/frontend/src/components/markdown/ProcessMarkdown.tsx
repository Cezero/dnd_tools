import React, { Suspense } from 'react';

import { RenderMarkdown } from '@/plugins/RenderMarkdown';
import { MarkdownComponentProps } from '@/plugins/types';
import { ErrorBoundary } from '@/lib/ErrorBoundary';

export function ProcessMarkdown(props: MarkdownComponentProps): React.JSX.Element {
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
