// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// TODO: Replace with import.meta.dirname after Node.js v18 EOL, May 2025.
const __dirname = dirname(fileURLToPath(import.meta.url));

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
      '**/tsup.config.ts',
      '**/vite-env.d.ts',
      '**/vite.config.ts',
    ],
  },
  [
    {
      files: ['src/**/*.ts'],
      rules: PRODUCTION_RULES,
      tsconfigRootDir: join(__dirname, 'test'),
    },
    {
      files: ['test/**/*.ts'],
      rules: DEVELOPMENT_RULES,
      tsconfigRootDir: join(__dirname, 'test'),
    },
    {
      files: ['examples/**/*.ts'],
      ignores: ['examples/components/**'],
      rules: DEVELOPMENT_RULES,
      tsconfigRootDir: join(__dirname, 'examples'),
    },
    {
      files: ['examples/components/**/*.ts'],
      rules: DEVELOPMENT_RULES,
      tsconfigRootDir: join(__dirname, 'examples', 'components'),
    },
  ].map(({tsconfigRootDir, ...config}) => ({
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {parserOptions: {projectService: true, tsconfigRootDir}},
    ...config,
  }))
);
