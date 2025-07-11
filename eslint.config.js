import js from '@eslint/js';
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import prismaPlugin from "eslint-plugin-prisma";
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from "globals";
import { noTypeofSchemaParse } from './eslint-rules/no-typeof-schema-parse.ts'

export default [
    {
        ignores: ["node_modules", "dist", "build", "public"],
    },
    js.configs.recommended,
    reactHooks.configs['recommended-latest'],
    reactRefresh.configs.vite,
    importPlugin.flatConfigs.recommended,
    {
        // Base config applied to all files
        files: ["**/*.{ts,tsx,js,jsx}"],


        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parser: typescriptParser,
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        settings: {
            "import/resolver": {
                typescript: {
                    project: "./tsconfig.json"
                },
                node: {
                    moduleDirectory: ["node_modules", "./"],
                    extensions: [".js", ".jsx", ".ts", ".tsx"],
                },
            },
        },

        plugins: {
            prisma: prismaPlugin,
            "@typescript-eslint": typescriptPlugin,
						local: {
              rules: {
                'no-type-of-schema-parse': noTypeofSchemaParse,
              },
						},
            reactHooks: reactHooks,
            reactRefresh: reactRefresh
        },

        rules: {
            'import/order': [
                'warn',
                {
                    groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling'], ['index']],
                    pathGroups: [
                        {
                            pattern: '@/**',
                            group: 'internal'
                        },
                        {
                            pattern: '@shared/**',
                            group: 'internal'
                        }
                    ],
                    pathGroupsExcludedImportTypes: ['builtin'],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true
                    }
                }
            ],
            "local/no-type-of-schema-parse": 'error',
            "import/no-unresolved": "error",
            "import/no-named-default": "error",
            "import/named": "error",
            "import/default": "error",
            ...typescriptPlugin.configs.recommended.rules,
            "@typescript-eslint/no-unused-vars": ["warn", {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            }],
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
            "react-refresh/only-export-components": "warn",
        },

        // Extend is replaced by manually adding configs as entries in the array or via 'extends' plugin if supported
    },
];
