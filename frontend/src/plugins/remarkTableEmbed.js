// plugins/remarkTableEmbed.js
import { visit } from 'unist-util-visit';

export default function remarkTableEmbed() {
  const TABLE_REGEX = /\{Table:\s*"([^"}]+)"\}/g;

  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      let match;
      const newNodes = [];
      let lastIndex = 0;

      while ((match = TABLE_REGEX.exec(node.value)) !== null) {
        const [fullMatch, slug] = match;

        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index),
          });
        }

        newNodes.push({
          type: 'mdxJsxFlowElement',
          name: 'ReferenceTable',
          attributes: [
            { type: 'mdxJsxAttribute', name: 'slug', value: slug }
          ],
          children: [],
        });

        lastIndex = match.index + fullMatch.length;
      }

      if (lastIndex < node.value.length) {
        newNodes.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        });
      }

      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
}
