import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import supersub from 'remark-supersub';
import { RemarkEntitiesAndEmbeds } from '@/plugins/RemarkEntitiesAndEmbeds';
import rehypeRemark from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { RehypeResolveEntitiesAndEmbeds } from '@/plugins/RehypeResolveEntitiesAndEmbeds';
import { RehypeReplaceVariables } from '@/plugins/RehypeReplaceVariables';

interface RenderMarkdownOptions {
    markdown: string;
    tableClass?: string;
    userVars?: Record<string, any>;
}

/**
 * Render markdown that includes custom syntax like {Spell: Fireball}, {Table: my-slug}, etc.
 * Automatically resolves entity links and embedded tables.
 * @param {RenderMarkdownOptions} options - The options object containing markdown and optional parameters
 * @returns {Promise<string>} - HTML string output
 */
export async function RenderMarkdown({ markdown, tableClass = 'md-table', userVars = {} }: RenderMarkdownOptions): Promise<string> {
    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm, { singleTilde: false })
        .use(supersub)
        .use(RemarkEntitiesAndEmbeds) // Sync stage: queue lookups, insert placeholders
        .use(rehypeRemark, { allowDangerousHtml: true }) // Markdown -> HAST
        .use(rehypeRaw) // Allow inline HTML (e.g., embedded raw HTML tags in markdown)
        .use(RehypeResolveEntitiesAndEmbeds, { tableClass }) // Async: resolve IDs and fetch tables
        .use(RehypeReplaceVariables, { userVars })
        //    .use(rehypeSanitize, sanitizeSchema) // (optional) prevent unsafe HTML injection
        .use(rehypeStringify); // Serialize to HTML

    const file = await processor.process(markdown);
    return String(file);
} 