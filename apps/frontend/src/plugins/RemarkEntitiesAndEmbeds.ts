import { visit } from 'unist-util-visit';
import { QueueEntityResolution } from '@/services/EntityResolver';
import { Root, Node, Parent, Text, Link, Element } from 'unist';

const ENTITY_TYPES: Record<string, string> = {
    Spell: '/spells/',
    Item: '/items/',
    Monster: '/monsters/',
};

interface TextNode extends Text {
    value: string;
}

interface LinkNode extends Link {
    url: string;
    data?: {
        hName: string;
        hProperties: Record<string, any>;
    };
    children: Node[];
}

interface ElementNode extends Element {
    tagName: string;
    data?: {
        hName: string;
        hProperties: Record<string, any>;
    };
    children: Node[];
}

interface VariableNode extends Element {
    type: 'variableNode';
    data?: {
        hName: string;
        hProperties: Record<string, any>;
    };
    children: Node[];
}

type ProcessedNode = TextNode | LinkNode | ElementNode | VariableNode;

export function RemarkEntitiesAndEmbeds() {
    return (tree: Root) => {
        visit(tree, 'text', (node: TextNode, index: number, parent: Parent) => {
            // eslint-disable-next-line no-useless-escape
            const regex = /(?:\[([A-Za-z]+):\s*([^\]]+)\])|(?:\{([A-Za-z]+):\s*([^\}]+)\})/g;
            const parts: ProcessedNode[] = [];
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(node.value)) !== null) {
                const [fullMatch, tag1, val1, tag2, val2] = match;
                const r_type = (tag1 || tag2 || '').trim();
                const r_value = (val1 || val2 || '').trim();

                if (match.index > lastIndex) {
                    parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
                }

                if (ENTITY_TYPES[r_type]) {
                    // Queue entity resolution
                    QueueEntityResolution(r_type.toLowerCase(), r_value.toLowerCase());

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
                } else if (r_type === 'Table') {
                    // Queue table resolution
                    QueueEntityResolution('referencetable', r_value.toLowerCase());

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