import { unified } from 'unified';
import remarkParse from 'remark-parse';
import supersub from 'remark-supersub';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw'; // optional if you want raw HTML parsing
import remarkEntitiesAndEmbeds from '@/plugins/remarkEntitiesAndEmbeds'; // your plugin
import rehypeResolveEntitiesAndEmbeds from '@/plugins/rehypeResolveEntitiesAndEmbeds';
import rehypeFormat from 'rehype-format';

/**
 * Converts markdown string into a HAST tree with entity embedding support.
 * @param {string} markdown - The raw markdown string.
 * @param {object} options - Optional settings.
 * @param {boolean} [options.allowRawHtml=false] - Whether to allow raw HTML via rehypeRaw.
 * @param {Array} [options.extraRehypePlugins=[]] - Additional rehype plugins to apply.
 * @returns {Promise<Object>} - A HAST (HTML AST) tree.
 */
export async function renderMarkdownToHast(markdown, options = {}) {
    const processor = await unified()
        .use(remarkParse)
        .use(supersub)
        .use(remarkEntitiesAndEmbeds)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(rehypeFormat)
        .use(rehypeResolveEntitiesAndEmbeds, options);
 
    const file = processor.parse(markdown);
    const tree = await processor.run(file)
    return tree;
}
