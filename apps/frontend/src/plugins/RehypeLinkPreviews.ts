import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

const entityPatterns = [
    { pattern: /^\/spells\/(\d+)$/, type: 'spell' },
    { pattern: /^\/monsters\/(\d+)$/, type: 'monster' },
    { pattern: /^\/items\/(\d+)$/, type: 'item' },
    { pattern: /^\/feats\/(\d+)$/, type: 'feat' },
    { pattern: /^\/classes\/(\d+)$/, type: 'class' },
    { pattern: /^\/races\/(\d+)$/, type: 'race' },
    { pattern: /^\/domains\/(\d+)$/, type: 'domain' },
];

export function RehypeLinkPreviews() {
    return (tree: Root) => {
        visit(tree, 'element', (node: Element) => {
            if (
                node.tagName === 'a' &&
                typeof node.properties?.href === 'string'
            ) {
                const href = node.properties.href;
                const props = node.properties as {
                    href?: string;
                    className?: string[];
                    'data-entity-type'?: string;
                    'data-entity-id'?: string;
                    [key: string]: unknown;
                };

                // Check if this matches an entity URL pattern
                for (const { pattern, type } of entityPatterns) {
                    const match = href.match(pattern);
                    if (match) {
                        const entityId = match[1];

                        // Only add attributes if they're not already present
                        // (to avoid overwriting attributes from createEntityLink)
                        if (!props['data-entity-type']) {
                            props['data-entity-type'] = type;
                        }
                        if (!props['data-entity-id']) {
                            props['data-entity-id'] = entityId;
                        }

                        // Ensure entity-link class is present
                        if (!props.className) {
                            props.className = [];
                        }
                        if (Array.isArray(props.className) && !props.className.includes('entity-link')) {
                            props.className.push('entity-link');
                        }

                        break;
                    }
                }
            }
        });
    };
}
