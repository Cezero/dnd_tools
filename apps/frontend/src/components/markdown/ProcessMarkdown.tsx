import { useQueryClient } from '@tanstack/react-query';
import React, { Suspense } from 'react';

import { ErrorBoundary } from '@/lib/ErrorBoundary';
import { RenderMarkdown } from '@/plugins/RenderMarkdown';
import { MarkdownComponentProps } from '@/plugins/types';

export function ProcessMarkdown(props: MarkdownComponentProps): React.JSX.Element {
    const queryClient = useQueryClient();
    const propsWithQueryClient = { ...props, queryClient };
    
    return (
        <ErrorBoundary fallback={<div>Error loading markdown.</div>}>
            <Suspense fallback={<div>Loading markdown...</div>}>
                <div className="prose-custom">
                    {RenderMarkdown(propsWithQueryClient)}
                </div>
            </Suspense>
        </ErrorBoundary>
    )
}
