import React, { useEffect, useState } from 'react';

import { RenderMarkdown } from '@/plugins/RenderMarkdown';

import type { ProcessMarkdownProps } from './types';

export function ProcessMarkdown({ markdown, id, userVars = {} }: ProcessMarkdownProps): React.JSX.Element {
    const [html, setHtml] = useState<string>('');

    useEffect(() => {
        (async () => {
            const rendered = await RenderMarkdown({ markdown, id, userVars });
            setHtml(rendered);
        })();
    }, [markdown, id, userVars]);

    return (
        <div
            className="prose dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
} 