// eslint-rules/no-typeof-schema-parse.ts

import { TSESTree, ESLintUtils } from '@typescript-eslint/utils';

export const noTypeofSchemaParse = ESLintUtils.RuleCreator(
  () => 'https://your-docs-site.local/no-typeof-schema-parse'
)({
  name: 'no-typeof-schema-parse',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow use of typeof Schema.parse; use z.infer<typeof Schema> instead'
    },
    messages: {
      avoidTypeofParse:
        'Avoid using `typeof Schema.parse`; use `z.infer<typeof Schema>` or `InferZod<typeof Schema>` instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSTypeQuery(node: TSESTree.TSTypeQuery) {
        const expr = node.exprName;

        // typeof Schema.parse => TSQualifiedName with "parse" as the right side
        if (
          expr.type === 'TSQualifiedName' &&
          expr.right.type === 'Identifier' &&
          expr.right.name === 'parse'
        ) {
          context.report({
            node,
            messageId: 'avoidTypeofParse',
          });
        }
      },
    };
  },
});
