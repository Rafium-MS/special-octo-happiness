const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactRefreshPlugin = require('eslint-plugin-react-refresh');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfigModule = require('eslint-config-prettier');

const prettierConfig = prettierConfigModule?.default ?? prettierConfigModule;

const IGNORED_PATTERNS = [
  'dist/**',
  'dist-electron/**',
  'node_modules/**',
  '*.config.*',
];

const sharedLanguageOptions = {
  ecmaVersion: 2022,
  sourceType: 'module',
};

const tsParserOptions = {
  ecmaVersion: 2022,
  sourceType: 'module',
  ecmaFeatures: {
    jsx: true,
  },
};

const sharedRules = {
  'no-console': [
    'warn',
    {
      allow: ['warn', 'error'],
    },
  ],
};

const reactRefreshRecommendedRules =
  reactRefreshPlugin?.configs?.recommended?.rules ?? {};

module.exports = [
  {
    ignores: IGNORED_PATTERNS,
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsParser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...reactRefreshRecommendedRules,
      ...sharedRules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['electron/**/*.ts'],
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsParser,
      parserOptions: tsParserOptions,
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...sharedRules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
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
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...sharedRules,
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': 'warn',
    },
  },
  prettierConfig,
];
