import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import supersub from 'remark-supersub';
import remarkEntitiesAndEmbeds from './remarkEntitiesAndEmbeds';
import rehypeRemark from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import rehypeResolveEntitiesAndEmbeds from './rehypeResolveEntitiesAndEmbeds';
import { sanitizeSchema } from '../config/rehypeSanitizeConfig';

/**
 * Render markdown that includes custom syntax like {Spell: Fireball}, {Table: my-slug}, etc.
 * Automatically resolves entity links and embedded tables.
 * @param {string} markdown - The raw markdown input
 * @param {string} [tableClass='md-table'] - The CSS class to apply to rendered tables.
 * @returns {Promise<string>} - HTML string output
 */
export async function renderMarkdown(markdown, tableClass = 'md-table') {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm, { singleTilde: false })
    .use(supersub)
    .use(remarkEntitiesAndEmbeds) // Sync stage: queue lookups, insert placeholders
    .use(rehypeRemark, { allowDangerousHtml: true }) // Markdown -> HAST
    .use(rehypeRaw) // Allow inline HTML (e.g., embedded raw HTML tags in markdown)
    .use(rehypeResolveEntitiesAndEmbeds, { tableClass }) // Async: resolve IDs and fetch tables
//    .use(rehypeSanitize, sanitizeSchema) // (optional) prevent unsafe HTML injection
    .use(rehypeStringify); // Serialize to HTML

  const file = await processor.process(markdown);
  return String(file);
}
