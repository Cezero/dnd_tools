import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { RenderMarkdown } from '@/plugins/RenderMarkdown';
import '@/styles/mdeditor.css';
import type { MarkdownEditorProps } from './types';

export function MarkdownEditor({
    value,
    onChange,
    label = "Description",
    className = "",
    id,
    name,
    userVars = {}
}: MarkdownEditorProps): React.JSX.Element {
    const [renderedHtml, setRenderedHtml] = useState<string>('');

    useEffect(() => {
        const ProcessMarkdown = async (): Promise<void> => {
            if (value) {
                const html = await RenderMarkdown({ markdown: value, userVars });
                setRenderedHtml(html);
            } else {
                setRenderedHtml('');
            }
        };

        ProcessMarkdown();
    }, [value, userVars]);

    return (
        <div className={`w-full ${className}`}>
            {label && <h2 className="text-lg font-semibold mb-2">{label}</h2>}
            <MDEditor
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                enableScroll={true}
                className="mb-6"
                height="auto"
                preview="live"
                components={{
                    preview: () => (
                        <div
                            className="wmde-markdown-parsed"
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        />
                    ),
                }}
            />
        </div>
    );
} 