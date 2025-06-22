// src/components/MarkdownEditor.jsx
import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { renderMarkdown } from '@/plugins/renderMarkdown';
import '@/styles/mdeditor.css';

export default function MarkdownEditor({ value, onChange, label = "Description", className = "", id, name, userVars = {} }) {
  const [renderedHtml, setRenderedHtml] = useState('');

  useEffect(() => {
    const processMarkdown = async () => {
      if (value) {
        const html = await renderMarkdown({ markdown: value, userVars });
        setRenderedHtml(html);
      } else {
        setRenderedHtml('');
      }
    };

    processMarkdown();
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
          preview: (props) => (
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
