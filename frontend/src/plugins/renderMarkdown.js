import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkEntitiesAndEmbeds from './remarkEntitiesAndEmbeds';
import rehypeRemark from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import rehypeResolveEntitiesAndEmbeds from './rehypeResolveEntitiesAndEmbeds';

/**
 * Render markdown that includes custom syntax like {Spell: Fireball}, {Table: my-slug}, etc.
 * Automatically resolves entity links and embedded tables.
 * @param {string} markdown - The raw markdown input
 * @returns {Promise<string>} - HTML string output
 */
export async function renderMarkdown(markdown) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkEntitiesAndEmbeds) // Sync stage: queue lookups, insert placeholders
    .use(rehypeRemark, { allowDangerousHtml: true }) // Markdown -> HAST
    .use(rehypeRaw) // Allow inline HTML (e.g., embedded raw HTML tags in markdown)
    .use(rehypeResolveEntitiesAndEmbeds) // Async: resolve IDs and fetch tables
    .use(rehypeSanitize) // (optional) prevent unsafe HTML injection
    .use(rehypeStringify); // Serialize to HTML

  const file = await processor.process(markdown);
  return String(file);
}
