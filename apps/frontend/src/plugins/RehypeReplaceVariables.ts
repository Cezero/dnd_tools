import { visit } from 'unist-util-visit';
import type { Root, Element, Text } from 'hast';

interface RehypeReplaceVariablesOptions {
    userVars?: Record<string, any>;
}

export function RehypeReplaceVariables(options: RehypeReplaceVariablesOptions = {}) {
    const { userVars = {} } = options;
    return (tree: Root) => {
        visit(tree, 'element', (node: Element) => {
            const properties = node.properties as {
                dataVarName?: string;
                [key: string]: any;
            };

            if (typeof properties.dataVarName === 'string') {
                const varName = properties.dataVarName;
                const varValue = userVars[varName];

                
                    (node as any).type = 'text';
                    (node as any).value = varValue !== undefined
                        ? String(varValue)
                        : `[var: ${varName}]`;
                    delete (node as any).children;
                    delete (node as any).tagName;
                    delete (node as any).properties;
            }
        });
    };
}
