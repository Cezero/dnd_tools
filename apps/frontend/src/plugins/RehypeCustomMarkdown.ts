import type { Root, Text, Element, ElementContent } from 'hast';
import { visit } from 'unist-util-visit';

import { directiveProcessors } from './customProcessors';
import { MarkdownComponentProps, MarkdownProcessingOptions } from '@/plugins/types';

// Regex: [entityType:value] or {directiveType:value}
// eslint-disable-next-line no-useless-escape
const directiveRegex = /(?:\[([A-Za-z]+):\s*([^\]]+)\])|(?:\{([A-Za-z]+):\s*([^\}]+)\})/g;

// Process a single text node, replacing directives with their processed equivalents
function processTextNode(textNode: Text, props: MarkdownComponentProps, options: MarkdownProcessingOptions): ElementContent[] {
    const matches = Array.from(textNode.value.matchAll(directiveRegex));
    if (matches.length === 0) {
        return [textNode];
    }

    const result: ElementContent[] = [];
    let lastIndex = 0;

    for (const match of matches) {
        // Add text before the match
        if (match.index! > lastIndex) {
            result.push({ type: 'text', value: textNode.value.slice(lastIndex, match.index) });
        }

        // Process the directive
        const type = match[1] || match[3];
        const rawValue = match[2] || match[4];

        if (type && rawValue) {
            const processor = directiveProcessors[type.toLowerCase()];
            if (processor) {
                result.push(processor(rawValue, props, options));
            } else {
                // Fallback: leave unmodified
                result.push({ type: 'text', value: match[0] });
            }
        } else {
            // Fallback: leave unmodified
            result.push({ type: 'text', value: match[0] });
        }

        lastIndex = match.index! + match[0].length;
    }

    // Add remaining text after the last match
    if (lastIndex < textNode.value.length) {
        result.push({ type: 'text', value: textNode.value.slice(lastIndex) });
    }

    return result;
}

export function RehypeCustomMarkdown(props: MarkdownComponentProps, options: MarkdownProcessingOptions) {
    return function transformer(tree: Root) {
        // Process all paragraph elements that might contain directives
        visit(tree, 'element', (node: Element, index, parent) => {
            // Only process paragraph elements
            if (node.tagName !== 'p') return;

            const newChildren: ElementContent[] = [];
            const tablesToPromote: Element[] = [];

            // Process each child of the paragraph
            for (const child of node.children) {
                if (child.type !== 'text') {
                    newChildren.push(child);
                    continue;
                }

                const processedChildren = processTextNode(child, props, options);

                // Check if any of the processed children are tables that need promotion
                for (const processedChild of processedChildren) {
                    if (processedChild.type === 'element' && processedChild.tagName === 'table') {
                        tablesToPromote.push(processedChild);
                    } else {
                        newChildren.push(processedChild);
                    }
                }
            }

            // Update the paragraph with processed children
            node.children = newChildren;

            // If we have tables to promote, insert them after this paragraph at the root level
            if (tablesToPromote.length > 0 && parent && Array.isArray(parent.children)) {
                const parentIndex = parent.children.indexOf(node);
                if (parentIndex !== -1) {
                    parent.children.splice(parentIndex + 1, 0, ...tablesToPromote);
                }
            }

            // If the paragraph is now empty (only whitespace), remove it entirely
            const hasContent = newChildren.some(child =>
                child.type === 'text' ? child.value.trim() !== '' : true
            );
            if (!hasContent && parent && Array.isArray(parent.children)) {
                const parentIndex = parent.children.indexOf(node);
                if (parentIndex !== -1) {
                    parent.children.splice(parentIndex, 1);
                }
            }
        });
    };
}
