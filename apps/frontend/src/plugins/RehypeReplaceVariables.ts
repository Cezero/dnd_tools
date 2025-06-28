import { visit } from 'unist-util-visit';
import { Root, Element, Text } from 'hast';

interface RehypeReplaceVariablesOptions {
    userVars?: Record<string, any>;
}

interface ElementWithDataVar extends Element {
    properties?: {
        dataVarName?: string;
        [key: string]: any;
    };
}

type NodeWithDataVar = ElementWithDataVar | Text;

export function RehypeReplaceVariables(options: RehypeReplaceVariablesOptions = {}) {
    const { userVars = {} } = options;
    return (tree: Root) => {
        visit(tree, 'element', (node: ElementWithDataVar) => {
            if (node.properties && node.properties.dataVarName) {
                const varName = node.properties.dataVarName;
                const varValue = userVars[varName];

                if (varValue !== undefined) {
                    // Replace the node with its value. If the value is HTML, parse it.
                    // For simplicity, we'll assume basic text substitution for now.
                    // More complex scenarios might require parsing varValue into HAST nodes.
                    (node as any).type = 'text';
                    (node as any).value = String(varValue);
                    delete (node as any).children; // Remove children as it's now a text node
                    delete (node as any).properties; // Remove custom properties
                } else {
                    // If variable not found, optionally replace with empty string or original placeholder
                    (node as any).type = 'text';
                    (node as any).value = `[var: ${varName}]`; // Keep original placeholder if not found
                }
            }
        });
    };
} 