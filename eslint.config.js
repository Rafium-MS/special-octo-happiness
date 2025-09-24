import js from "@eslint/js";
import globals from "globals";
import tsParser from "./tools/eslint/ts-transpile-parser.js";

const IGNORED_PATTERNS = [
  "dist/**",
  "dist-electron/**",
  "node_modules/**",
  "*.config.*",
];

const sharedLanguageOptions = {
  ecmaVersion: 2022,
  sourceType: "module",
};

const sharedRules = {
  "no-console": [
    "warn",
    {
      allow: ["warn", "error"],
    },
  ],
};

export default [
  {
    ignores: IGNORED_PATTERNS,
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsParser,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
      "no-unused-vars": "off",
    },
  },
  {
    files: ["electron/**/*.ts"],
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsParser,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    ...js.configs.recommended,
    languageOptions: {
      ...sharedLanguageOptions,
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
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
