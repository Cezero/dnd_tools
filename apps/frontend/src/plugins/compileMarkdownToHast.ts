import { Root } from 'hast';
import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw'; // optional if you want raw HTML parsing
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import supersub from 'remark-supersub';
import { unified } from 'unified';

import { preloadTablesFromMarkdown } from '@/lib/TableResolution';
import { RehypeCustomMarkdown } from '@/plugins/RehypeCustomMarkdown';

import { MarkdownComponentProps } from './types';

export async function compileMarkdownToHast(props: MarkdownComponentProps): Promise<Root> {
    if (!props.id) {
        props.id = `hast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    // Preload tables BEFORE starting markdown compilation
    await preloadTablesFromMarkdown(props);

    const processor = unified()
        .use(remarkParse)
        .use(supersub)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeFormat)
        .use(RehypeCustomMarkdown, props, { enableTables: true });

    const file = processor.parse(props.markdown);
    return processor.run(file) as Promise<Root>;
} 
