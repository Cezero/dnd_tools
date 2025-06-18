import { visit } from 'unist-util-visit';

export default function rehypeLinkPreviews() {
    return (tree) => {
      visit(tree, 'element', (node) => {
        if (node.tagName === 'a' && node.properties?.href?.includes('/spells/')) {
          node.properties.className = ['entity-link', 'hover-preview'];
  
          // You could later enhance this with tooltips or popovers
          node.properties['data-preview'] = node.properties.href;
        }
      });
    };
  }
  