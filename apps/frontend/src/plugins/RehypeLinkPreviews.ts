import { visit } from 'unist-util-visit';
import { Root, Element } from 'hast';

interface ElementWithProperties extends Element {
    properties?: {
        href?: string;
        className?: string[];
        'data-preview'?: string;
        [key: string]: any;
    };
}

export function RehypeLinkPreviews() {
    return (tree: Root) => {
        visit(tree, 'element', (node: ElementWithProperties) => {
            if (node.tagName === 'a' && node.properties?.href?.includes('/spells/')) {
                node.properties.className = ['entity-link', 'hover-preview'];

                // You could later enhance this with tooltips or popovers
                node.properties['data-preview'] = node.properties.href;
            }
        });
    };
} 