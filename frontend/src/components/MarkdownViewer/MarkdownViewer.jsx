import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkReferenceTable from '@/plugins/remarkTableEmbed';
import ReferenceTableDisplay from '@/components/ReferenceTable/ReferenceTable';

function MarkdownViewer({ markdown }) {
    return (
        <div>
            <ReactMarkdown
                remarkPlugins={[remarkReferenceTable]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    'div': ({ node, ...props }) => {
                        if (props['data-reference-table-id']) {
                            const id = parseInt(props['data-reference-table-id'], 10);
                            return <ReferenceTableDisplay id={id} />;
                        }
                        return <div {...props} />;
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}

export default MarkdownViewer; 