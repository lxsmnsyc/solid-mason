import config from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [config],
  ignorePatterns: ['**/dist/**', '**/node_modules/**'],
  rules: {
    // `Mason` composes `Dynamic` and `For` by calling them directly instead of
    // going through JSX, and Solid components are capitalised plain functions.
    'new-cap': 'off',
  },
  overrides: [
    {
      // The layout pass reads and writes the DOM by hand, so the module keeps
      // a mutable `MasonState` record and reassigns element styles in place.
      // Both are the point of the module rather than accidents to lint away.
      files: ['packages/*/src/**'],
      rules: {
        'typescript/no-unsafe-type-assertion': 'off',
      },
    },
    {
      // Tests drive real layout in a browser, which means fake elements sized
      // by inline styles and assertions against `HTMLElement` members that the
      // generic query helpers type as `Element`. The `.tsx` files sit outside
      // the project the type-aware pass loads, so JSX there resolves to the
      // error type and every component reads as unsafe.
      files: ['packages/*/test/**'],
      rules: {
        'import/prefer-default-export': 'off',
        'no-console': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-module-boundary-types': 'off',
        'typescript/no-non-null-assertion': 'off',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
      },
    },
    {
      files: ['examples/**'],
      rules: {
        'import/prefer-default-export': 'off',
        'no-console': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-module-boundary-types': 'off',
      },
    },
  ],
});
