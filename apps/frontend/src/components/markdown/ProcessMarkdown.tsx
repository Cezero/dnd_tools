import React, { useEffect, useState } from 'react';
import { RenderMarkdown } from '@/plugins/RenderMarkdown';

interface ProcessMarkdownProps {
    markdown: string;
    userVars?: Record<string, any>;
}

export function ProcessMarkdown({ markdown, userVars = {} }: ProcessMarkdownProps): React.JSX.Element {
    const [html, setHtml] = useState<string>('');

    useEffect(() => {
        (async () => {
            const rendered = await RenderMarkdown({ markdown, userVars });
            setHtml(rendered);
        })();
    }, [markdown, userVars]);

    return (
        <div
            className="prose dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
} 