import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import boundaries from 'eslint-plugin-boundaries'
import checkFile from 'eslint-plugin-check-file'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'

const textAllowlist = new Set(['', ' ', '\n'])
const colorPattern =
  /(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\(|color-mix\(|\b(?:white|black|red|blue|green|yellow|purple|gray|grey|transparent)\b)/

const projectRules = {
  rules: {
    'no-hardcoded-text': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow hardcoded user-facing text in JSX' },
        schema: [],
      },
      create(context) {
        const reportText = (node, value) => {
          const normalized = String(value).replace(/\s+/g, ' ').trim()
          if (!normalized || textAllowlist.has(normalized)) return
          if (/^[{}()[\].,:;+\-*/%<>=!?|&'"`~\d\s]+$/.test(normalized)) return
          context.report({
            node,
            message: 'Move user-facing text to i18n/constants instead of hardcoding it in JSX.',
          })
        }

        return {
          JSXText(node) {
            reportText(node, node.value)
          },
          JSXExpressionContainer(node) {
            if (node.expression?.type === 'Literal' && typeof node.expression.value === 'string') {
              reportText(node, node.expression.value)
            }
          },
        }
      },
    },
    'no-hardcoded-color': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow hardcoded color literals' },
        schema: [],
      },
      create(context) {
        const isClassNameAttribute = (node) => {
          let current = node.parent
          while (current) {
            if (current.type === 'JSXAttribute') {
              return current.name?.name === 'className'
            }
            current = current.parent
          }
          return false
        }

        return {
          Literal(node) {
            if (typeof node.value !== 'string') return
            if (isClassNameAttribute(node)) return
            if (colorPattern.test(node.value)) {
              context.report({
                node,
                message: 'Move color literals to theme/tokens instead of hardcoding them.',
              })
            }
          },
          TemplateElement(node) {
            if (colorPattern.test(node.value.raw)) {
              context.report({
                node,
                message: 'Move color literals to theme/tokens instead of hardcoding them.',
              })
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'coverage/**']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      boundaries,
      'check-file': checkFile,
      'project-rules': projectRules,
      'unused-imports': unusedImports,
    },
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        vi: 'readonly',
        global: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      'boundaries/elements': [
        { type: 'assets', pattern: 'src/assets/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'constants', pattern: 'src/constants/**' },
        { type: 'hooks', pattern: 'src/hooks/**' },
        { type: 'layouts', pattern: 'src/layouts/**' },
        { type: 'lib', pattern: 'src/lib/**' },
        { type: 'pages', pattern: 'src/pages/**' },
        { type: 'providers', pattern: 'src/providers/**' },
        { type: 'routes', pattern: 'src/routes/**' },
        { type: 'schemas', pattern: 'src/schemas/**' },
        { type: 'services', pattern: 'src/services/**' },
        { type: 'store', pattern: 'src/store/**' },
        { type: 'styles', pattern: 'src/styles/**' },
        { type: 'utils', pattern: 'src/utils/**' },
        { type: 'legacy-api', pattern: 'src/api/**' },
      ],
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],
      'project-rules/no-hardcoded-text': 'error',
      'project-rules/no-hardcoded-color': 'error',
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{js,jsx,ts,tsx}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true
        }
      ],
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/**/': 'KEBAB_CASE',
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          rules: [
            { from: { type: 'pages' }, disallow: { to: { type: 'legacy-api' } } },
            {
              from: { type: 'components' },
              disallow: { to: { type: ['pages', 'routes', 'legacy-api'] } },
            },
            {
              from: { type: 'layouts' },
              disallow: { to: { type: ['pages', 'routes', 'legacy-api'] } },
            },
            { from: { type: 'hooks' }, disallow: { to: { type: ['pages', 'routes'] } } },
            {
              from: { type: 'services' },
              disallow: { to: { type: ['pages', 'components', 'layouts', 'routes'] } },
            },
            {
              from: { type: 'lib' },
              disallow: { to: { type: ['pages', 'components', 'layouts', 'routes', 'store'] } },
            },
            { from: { type: 'store' }, disallow: { to: { type: ['pages', 'routes'] } } },
          ],
        },
      ],
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: [
      'vite.config.{js,ts}',
      'eslint.config.js',
      'tailwind.config.js',
      'src/test/**',
      'tests/**',
      '**/*.test.{js,jsx,ts,tsx}',
      'src/styles/**',
      'src/constants/**',
    ],
    rules: {
      'project-rules/no-hardcoded-text': 'off',
      'project-rules/no-hardcoded-color': 'off',
      'no-magic-numbers': 'off',
      'check-file/filename-naming-convention': 'off',
      'check-file/folder-naming-convention': 'off',
    },
  },
])

