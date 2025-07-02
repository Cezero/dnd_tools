import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

export function RehypeLinkPreviews() {
    return (tree: Root) => {
        visit(tree, 'element', (node: Element) => {
            if (
                node.tagName === 'a' &&
                typeof node.properties?.href === 'string' &&
                node.properties.href.includes('/spells/')
            ) {
                const props = node.properties as {
                    href?: string;
                    className?: string[];
                    'data-preview'?: string;
                    [key: string]: any;
                };

                props.className = ['entity-link', 'hover-preview'];
                props['data-preview'] = props.href;
            }
        });
    };
}
