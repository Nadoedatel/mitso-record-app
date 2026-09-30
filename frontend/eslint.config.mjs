import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['.nuxt/**', '.output/**', 'node_modules/**', 'dist/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
  },
  {
    rules: {
      // Project rules (see CLAUDE.md): strict typing, no debug output in production code
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
      // Nuxt auto-imports (useRoute, definePageMeta, ...) are unknown to no-undef; TypeScript checks them
      'no-undef': 'off',
      // Existing component style: single-word names for layouts and pages, no strict attribute layout
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'error',
      // Both camelCase and kebab-case are used across the codebase; not worth churn
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/attributes-order': 'off',
      // Props used only in the template are reported as unused by typescript-eslint
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': 'allow-with-description' }],
    },
  },
  {
    files: ['tests/**'],
    rules: { 'no-console': 'off' },
  },
  prettier,
)
