import MDEditor from '@uiw/react-md-editor';
import React, { useState, useEffect, useMemo } from 'react';

import { RenderMarkdown } from '@/plugins/RenderMarkdown';

import '@/styles/mdeditor.css';
import type { MarkdownEditorProps } from './types';

// Stable empty object to avoid recreating on every render
const EMPTY_USER_VARS = {};

export function MarkdownEditor({
    value,
    onChange,
    label = "Description",
    className = "",
    id,
    name,
    userVars
}: MarkdownEditorProps): React.JSX.Element {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    // Use stable empty object if userVars not provided, and memoize userVars string for comparison
    const stableUserVars = userVars || EMPTY_USER_VARS;
    const userVarsKey = useMemo(() => JSON.stringify(stableUserVars), [stableUserVars]);

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
            <div className="prose-custom">
                <RenderMarkdown
                    markdown={debouncedValue}
                    id={id || 'markdown-editor'}
                    userVars={stableUserVars}
                />
            </div>
        );
    }, [debouncedValue, id, userVarsKey]);

    // Memoize the preview component to prevent MDEditor from re-rendering unnecessarily
    const previewComponent = useMemo(() => (
        <div className="wmde-markdown-parsed">
            {markdownPreview}
        </div>
    ), [markdownPreview]);

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
                    preview: () => previewComponent,
                }}
            />
        </div>
    );
} 
