import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
    pluginJs.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                Simulation: 'writable',
                Renderer: 'writable',
                BODY_PRESETS: 'writable',
            },
        },
        rules: {
            'no-redeclare': 'off',
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
