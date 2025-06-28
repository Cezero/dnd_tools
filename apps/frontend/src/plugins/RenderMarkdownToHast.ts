import { unified } from 'unified';
import remarkParse from 'remark-parse';
import supersub from 'remark-supersub';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw'; // optional if you want raw HTML parsing
import { RemarkEntitiesAndEmbeds } from '@/plugins/RemarkEntitiesAndEmbeds'; // your plugin
import { RehypeResolveEntitiesAndEmbeds } from '@/plugins/RehypeResolveEntitiesAndEmbeds';
import rehypeFormat from 'rehype-format';
import { Root } from 'hast';

interface RenderMarkdownToHastOptions {
    allowRawHtml?: boolean;
    extraRehypePlugins?: any[];
    tableClass?: string;
}

/**
 * Converts markdown string into a HAST tree with entity embedding support.
 * @param {string} markdown - The raw markdown string.
 * @param {RenderMarkdownToHastOptions} options - Optional settings.
 * @returns {Promise<Root>} - A HAST (HTML AST) tree.
 */
export async function RenderMarkdownToHast(markdown: string, options: RenderMarkdownToHastOptions = {}): Promise<Root> {
    const processor = await unified()
        .use(remarkParse)
        .use(supersub)
        .use(RemarkEntitiesAndEmbeds)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeFormat)
        .use(RehypeResolveEntitiesAndEmbeds, options);

    const file = processor.parse(markdown);
    const tree = await processor.run(file) as Root;
    return tree;
} 