import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkReferenceTable from '@/lib/remarkReferenceTable';
import ReferenceTableDisplay from '@/components/ReferenceTable/ReferenceTableDisplay';

function MarkdownViewer({ markdown }) {
    return (
        <div>
            <ReactMarkdown
                remarkPlugins={[remarkReferenceTable]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    'reference-table': ({ node, ...props }) => {
                        return <ReferenceTableDisplay id={props.id} />;
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownViewer; 