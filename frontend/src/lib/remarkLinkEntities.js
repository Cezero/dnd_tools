// lib/remarkLinkEntities.js
import { visit } from 'unist-util-visit';
import lookupService from '@/features/spells/services/LookupService';

const ENTITY_MAP = {
  Spell: '/spells/',
};

export default function remarkLinkEntities() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      const regex = /(?:\[([A-Za-z]+): ([^\]]+)\])|(?:\{([A-Za-z]+): ([^\}]+)\})/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(node.value)) !== null) {
        const [full, tag1, val1, tag2, val2] = match;
        const type = tag1 || tag2;
        const value = val1 || val2;
        const route = ENTITY_MAP[type];

        if (!route) continue;

        let url = `${route}${value.toLowerCase().replace(/\s+/g, '-')}`;
        if (type === 'Spell') {
          const spell = lookupService.getByName('spells', value.toLowerCase());
          if (spell) {
            url = `${route}${spell.spell_id}`;
          }
        }

        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        parts.push({
          type: 'link',
          url: url,
          children: [{ type: 'text', value: `${value}` }],
        });

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