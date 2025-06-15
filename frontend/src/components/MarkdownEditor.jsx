// src/components/MarkdownEditor.jsx
import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkLinkEntities from '@/lib/remarkLinkEntities';
import rehypeRaw from 'rehype-raw';
import '@/styles/mdeditor.css';

export default function MarkdownEditor({ value, onChange, label = "Description", className = "", id, name }) {
  return (
    <div className={`w-full ${className}`}>
      {label && <h2 className="text-lg font-semibold mb-2">{label}</h2>}
      <MDEditor
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        enableScroll={true}

        previewOptions={{
          remarkPlugins: [remarkGfm, remarkLinkEntities],
          rehypePlugins: [rehypeRaw]
        }}
        className="mb-6"
        height="auto"
      />
    </div>
  );
}
