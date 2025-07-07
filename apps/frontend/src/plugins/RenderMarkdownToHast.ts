import { Root } from 'hast';
import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw'; // optional if you want raw HTML parsing
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import supersub from 'remark-supersub';
import { unified } from 'unified';

import { RehypeResolveEntitiesAndEmbeds } from '@/plugins/RehypeResolveEntitiesAndEmbeds';
import { RemarkEntitiesAndEmbeds } from '@/plugins/RemarkEntitiesAndEmbeds'; // your plugin


interface RenderMarkdownToHastOptions {
    allowRawHtml?: boolean;
    extraRehypePlugins?: unknown[];
    tableClass?: string;
    id?: string;
}

/**
 * Converts markdown string into a HAST tree with entity embedding support.
 * @param {string} markdown - The raw markdown string.
 * @param {RenderMarkdownToHastOptions} options - Optional settings.
 * @returns {Promise<Root>} - A HAST (HTML AST) tree.
 */
export async function RenderMarkdownToHast(markdown: string, options: RenderMarkdownToHastOptions = {}): Promise<Root> {
    const { id = `hast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` } = options;

    const processor = await unified()
        .use(remarkParse)
        .use(supersub)
        .use(RemarkEntitiesAndEmbeds, { id })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeFormat)
        .use(RehypeResolveEntitiesAndEmbeds, { ...options, id });

    const file = processor.parse(markdown);
    const tree = await processor.run(file) as Root;
    return tree;
} 