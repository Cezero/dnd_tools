import { visit } from 'unist-util-visit';

export default function rehypeReplaceVariables(options = {}) {
    const { userVars = {} } = options;
    return (tree) => {
        visit(tree, 'element', (node, index, parent) => {
            if (node.properties && node.properties.dataVarName) {
                const varName = node.properties.dataVarName;
                const varValue = userVars[varName];

                if (varValue !== undefined) {
                    // Replace the node with its value. If the value is HTML, parse it.
                    // For simplicity, we'll assume basic text substitution for now.
                    // More complex scenarios might require parsing varValue into HAST nodes.
                    node.type = 'text';
                    node.value = String(varValue);
                    delete node.children; // Remove children as it's now a text node
                    delete node.properties; // Remove custom properties
                } else {
                    // If variable not found, optionally replace with empty string or original placeholder
                    node.type = 'text';
                    node.value = `[var: ${varName}]`; // Keep original placeholder if not found
                }
            }
        });
    };
} 