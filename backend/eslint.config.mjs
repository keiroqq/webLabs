import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  pluginJs.configs.recommended,

  ...tseslint.configs.recommended,

  pluginPrettierRecommended,

  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },

  eslintConfigPrettier,
];
