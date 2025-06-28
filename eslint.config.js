import globals from "globals";
import cssPlugin from "eslint-plugin-css";
import importPlugin from "eslint-plugin-import";
import prismaPlugin from "eslint-plugin-prisma";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  js.configs.recommended,
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.vite,
  importPlugin.flatConfigs.recommended,
  {
    // Base config applied to all files
    files: ["**/*"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
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
          project: "./apps/frontend/tsconfig.json"
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
      reactHooks: reactHooks,
      reactRefresh: reactRefresh,
    },

    rules: {
      "import/no-unresolved": "error",
      "import/no-named-default": "error",
      "import/named": "error",
      "import/default": "error",
      "no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "warn",
    },

    // Extend is replaced by manually adding configs as entries in the array or via 'extends' plugin if supported
  },

  // TypeScript/TSX specific configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
    },
  },

  // You can add overrides by adding more config objects with 'files' filters, e.g.:
  {
    files: ["**/*.css"],
    plugins: {
      css: cssPlugin,
    },
    rules: {
      ...cssPlugin.configs.recommended.rules,
    }
  },
];
