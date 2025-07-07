import type { Root, Text, Link } from 'mdast';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

import { queueTableResolution } from '@/lib/TableResolution';

const ENTITY_TYPES: Record<string, string> = {
    spell: '/spells/',
    item: '/items/',
    monster: '/monsters/',
};

interface TextNode extends Text {
    value: string;
}

interface LinkNode extends Link {
    url: string;
    data?: {
        hName: string;
        hProperties: Record<string, string | number | boolean | (string | number)[]>;
    };
}

interface ElementNode extends Node {
    type: 'element';
    tagName: string;
    data?: {
        hName: string;
        hProperties: Record<string, string | number | boolean | (string | number)[]>;
    };
    children: Node[];
}

interface VariableNode extends Node {
    type: 'variableNode';
    data?: {
        hName: string;
        hProperties: { dataVarName: string };
    };
    children: Text[];
}

type ProcessedNode = TextNode | LinkNode | ElementNode | VariableNode;

interface RemarkEntitiesAndEmbedsOptions {
    id: string;
}

export function RemarkEntitiesAndEmbeds(options: RemarkEntitiesAndEmbedsOptions) {
    const { id } = options;
    return (tree: Root) => {
        visit(tree, 'text', (node: TextNode, index: number, parent: Parent) => {
            // eslint-disable-next-line no-useless-escape
            const regex = /(?:\[([A-Za-z]+):\s*([^\]]+)\])|(?:\{([A-Za-z]+):\s*([^\}]+)\})/g;
            const parts: ProcessedNode[] = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = regex.exec(node.value)) !== null) {
                const [fullMatch, tag1, val1, tag2, val2] = match;
                const r_type = (tag1 || tag2 || '').trim().toLowerCase();
                const r_value = (val1 || val2 || '').trim().toLowerCase();

                if (match.index > lastIndex) {
                    parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
                }

                if (ENTITY_TYPES[r_type]) {
                    parts.push({
                        type: 'link',
                        url: '', // filled in later
                        data: {
                            hName: 'a',
                            hProperties: {
                                href: '',
                                dataEntityType: r_type.toLowerCase(),
                                dataEntityValue: r_value.toLowerCase(),
                            },
                        },
                        children: [{ type: 'text', value: r_value.toLowerCase() }],
                    });
                } else if (r_type === 'table') {
                    // Queue table resolution with instance id
                    queueTableResolution(r_value.toLowerCase(), id);

                    parts.push({
                        type: 'element',
                        tagName: 'div',
                        data: {
                            hName: 'div',
                            hProperties: {
                                dataTableSlug: r_value.toLowerCase(),
                            },
                        },
                        children: [],
                    });
                } else if (r_type === 'var') {
                    parts.push({
                        type: 'variableNode', // Custom node type for variables
                        data: {
                            hName: 'span', // Placeholder, will be replaced by rehype plugin
                            hProperties: {
                                dataVarName: r_value.toLowerCase(),
                            },
                        },
                        children: [{ type: 'text', value: fullMatch }], // Keep original text as child for now
                    } as VariableNode);
                } else {
                    // Not recognized, fallback to plain text
                    parts.push({ type: 'text', value: fullMatch });
                }

                lastIndex = regex.lastIndex;
            }

            if (lastIndex < node.value.length) {
                parts.push({ type: 'text', value: node.value.slice(lastIndex) });
            }

            if (parts.length > 0 && parent && Array.isArray(parent.children)) {
                const idx = parent.children.indexOf(node);
                parent.children.splice(idx, 1, ...parts);
            }
        });
    };
} 