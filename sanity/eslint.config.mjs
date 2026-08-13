import studio from '@sanity/eslint-config-studio'

export default [
  ...studio,
  {
    // Studio's own eslint-config targets browser/React code and doesn't
    // declare Node globals. scripts/ holds standalone Node CLI scripts
    // (e.g. the TSX coverage gate run via `node scripts/...`), which
    // genuinely need these. Declared inline rather than pulling in the
    // `globals` package as a new devDependency for two names.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
]
