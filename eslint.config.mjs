// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Downgrade to warning - too many occurrences to fix immediately
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow unified signatures - often intentional for clarity
    '@typescript-eslint/unified-signatures': 'off',
    // Prefix unused vars with _ to ignore
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_|^err$',
    }],
    // Vue props - allow optional props without defaults
    'vue/require-default-prop': 'off',
    'vue/no-required-prop-with-default': 'warn',
    // Allow v-html when needed
    'vue/no-v-html': 'warn',
    // Allow prop mutation in composables that manage state
    'vue/no-mutating-props': 'warn',
    // Allow dynamic delete - used in filter cleanup
    '@typescript-eslint/no-dynamic-delete': 'warn',
    // Allow void in union types for event handlers
    '@typescript-eslint/no-invalid-void-type': 'warn',
    // Allow empty catch blocks with comments
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Allow explicit emits definition
    'vue/require-explicit-emits': 'warn',
  },
})
