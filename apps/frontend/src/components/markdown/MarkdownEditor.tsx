import MDEditor from '@uiw/react-md-editor';
import React, { useState, useEffect, useMemo } from 'react';

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
    const [debouncedValue, setDebouncedValue] = useState(value);

    // Debounce the value to prevent preview updates while typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [value]);

    // Memoize the markdown component to prevent unnecessary re-renders
    const markdownPreview = useMemo(() => {
        if (!debouncedValue) {
            return <div className="text-gray-400 italic">No content to preview</div>;
        }

        return (
            <div className="prose dark:prose-invert">
                <RenderMarkdown
                    markdown={debouncedValue}
                    id={id || 'markdown-editor'}
                    userVars={userVars}
                />
            </div>
        );
    }, [debouncedValue, id, userVars]);

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
                        <div className="wmde-markdown-parsed">
                            {markdownPreview}
                        </div>
                    ),
                }}
            />
        </div>
    );
} 
