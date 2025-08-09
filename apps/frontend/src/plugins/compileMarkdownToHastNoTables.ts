import { Root } from 'hast';
import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw'; // optional if you want raw HTML parsing
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import supersub from 'remark-supersub';
import { unified } from 'unified';

import { RehypeCustomMarkdown } from '@/plugins/RehypeCustomMarkdown';

import { MarkdownComponentProps } from './types';

export function compileMarkdownToHastNoTables(props: MarkdownComponentProps): Root {
    if (!props.id) {
        props.id = `hast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    const processor = unified()
        .use(remarkParse)
        .use(supersub)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeFormat)
        .use(RehypeCustomMarkdown, props, { enableTables: false });

    const file = processor.parse(props.markdown);
    return processor.runSync(file) as Root;
} 
