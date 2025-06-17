import { visit } from 'unist-util-visit';

function remarkReferenceTable() {
    return (tree) => {
        visit(tree, 'text', (node, index, parent) => {
            const regex = /::reference-table-id-(\d+)::/g;
            let match;
            let lastIndex = 0;
            const children = [];

            while ((match = regex.exec(node.value)) !== null) {
                const [fullMatch, id] = match;
                const startIndex = match.index;
                const endIndex = regex.lastIndex;

                if (startIndex > lastIndex) {
                    children.push({
                        type: 'text',
                        value: node.value.substring(lastIndex, startIndex),
                    });
                }

                children.push({
                    type: 'element',
                    tagName: 'reference-table',
                    properties: {
                        id: parseInt(id, 10),
                    },
                    children: [],
                });
                lastIndex = endIndex;
            }

            if (lastIndex < node.value.length) {
                children.push({
                    type: 'text',
                    value: node.value.substring(lastIndex),
                });
            }

            if (children.length > 1 || (children.length === 1 && children[0].type !== 'text')) {
                parent.children.splice(index, 1, ...children);
            }
        });
    };
}

export default remarkReferenceTable; 