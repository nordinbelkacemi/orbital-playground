import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
    pluginJs.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'warn',
            'eqeqeq': 'error',
            'curly': ['error', 'multi-line'],
            'no-var': 'error',
            'prefer-const': 'error',
            'semi': ['error', 'always'],
        },
    },
];
