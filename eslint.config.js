// eslint.config.js (Flat Config para ESLint v9)
import js from '@eslint/js'
import globals from 'globals'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'

export default [
  // Ignorar carpetas de build, cobertura y dependencias
  { ignores: ['dist/**', 'build/**', 'coverage/**', 'node_modules/**'] },

  js.configs.recommended,

  // Reglas para el código de la app
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react: pluginReact, 'react-hooks': pluginReactHooks },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs['jsx-runtime'].rules,
      ...pluginReactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
    settings: { react: { version: 'detect' } },
  },

  // Reglas/escope para tests (Vitest + jsdom)
  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.vitest },
    },
  },
]
