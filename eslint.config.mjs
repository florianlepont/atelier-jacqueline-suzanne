import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

// Flat config (ESM), mirroring the style of sanity/eslint.config.mjs. Only
// lints the root Astro app's src/; the Sanity Studio subproject has its own
// config + toolchain (sanity/eslint.config.mjs, own eslint@9 in
// sanity/node_modules) and must never be cross-linted from here.
export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'sanity/',
      // GSD workflow/agent tooling directories — not app source.
      '.planning/',
      '.claude/',
      '.agents/',
      '.codex/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    // Root JS config files (astro.config.mjs, this file) run under plain
    // Node, not TypeScript, so `no-undef` needs `process` declared.
    files: ['*.config.mjs', 'eslint.config.mjs'],
    languageOptions: {
      globals: { process: 'readonly' },
    },
  },
  {
    // `astroHTML` is Astro's ambient JSX namespace (declared globally by
    // astro/astro-jsx.d.ts) — real for frontmatter typing, but unknown to
    // `no-undef`, which only understands runtime globals.
    files: ['**/*.astro'],
    languageOptions: {
      globals: { astroHTML: 'readonly' },
    },
  },
  {
    // Non-disruptive convention already used across this codebase: a
    // leading underscore marks an intentionally-unused parameter/binding
    // (e.g. `_targetLocale`, `_defaultBrowserType`).
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
];
