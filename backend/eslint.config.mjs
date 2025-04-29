// eslint.config.mjs
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier'; // <-- Добавлен импорт
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'; // <-- Добавлен импорт

export default [
  // Базовая конфигурация ESLint
  pluginJs.configs.recommended,

  // Конфигурации TypeScript ESLint
  ...tseslint.configs.recommended,

  // Рекомендуемая конфигурация плагина Prettier <-- Добавлено
  // Запускает Prettier как правило ESLint и включает правило "prettier/prettier": "error"
  pluginPrettierRecommended,

  // Ваша кастомная конфигурация (оставьте или адаптируйте)
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
      // Ваши правила
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Примечание: Некоторые правила здесь могут быть отключены eslintConfigPrettier, если они конфликтуют с Prettier
    },
  },

  // Игнорируемые файлы (оставьте)
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },

  // Конфигурация eslint-config-prettier <-- Добавлено В КОНЕЦ МАССИВА
  // ВАЖНО: Должна быть последней, чтобы отключать конфликтующие правила из предыдущих конфигураций
  eslintConfigPrettier,
];
