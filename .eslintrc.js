module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-base',
  ],
  // Below is for AIRBNB
  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      mjs: 'never',
      jsx: 'never',
      ts: 'never',
    }],
    'linebreak-style': 0,
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.spec.ts', '**/*.spec.tsx'] }],
    'require-await': 'warn',
    'import/prefer-default-export': 'off',
    'no-unused-vars': 'off', // Show false positives in TS projects when using an imported interface as a type
    'max-len': ['warn', { code: 120, ignoreTemplateLiterals: true, ignoreComments: true }],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
  },
  // Below is required to correctly resolve .ts files
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
        paths: ['./src'],
      },
    },
  },
};
