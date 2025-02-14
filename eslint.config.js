// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import {join} from 'node:path';

/** @type {Partial<Record<string, any>>} */
const PRODUCTION_RULES = {
  // TODO: These rules should be re-enabled for production code.
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
};

/** @type {Partial<Record<string, any>>} */
const DEVELOPMENT_RULES = {
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',

  // TODO: These rules should be re-enabled for all code.
  '@typescript-eslint/ban-ts-comment': 'off',
};

export default tseslint.config(
  {
    ignores: [
      'build/**',
      'coverage/**',
      '**/vite-env.d.ts',
      '**/vite.config.ts',
    ],
  },

  // source
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: PRODUCTION_RULES,
  },

  // tests
  {
    files: ['test/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: join(import.meta.dirname, 'test'),
      },
    },
    rules: DEVELOPMENT_RULES,
  },

  // examples
  {
    files: ['examples/**/*.ts'],
    ignores: ['examples/components/**'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: join(import.meta.dirname, 'examples'),
      },
    },
    rules: DEVELOPMENT_RULES,
  },

  // example components
  {
    files: ['examples/components/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: join(import.meta.dirname, 'examples', 'components'),
      },
    },
    rules: DEVELOPMENT_RULES,
  }
);
