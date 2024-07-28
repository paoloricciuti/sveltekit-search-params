import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
				svelteFeatures: {
					experimentalGenerics: true,
				},
			},
		},
	},
	{
		ignores: [
			'**/.svelte-kit',
			'**/build',
			'**/node_modules',
			'**/static',
			'**/package',
			'**/lz-string/*',
		],
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^(_|\\$\\$)',
					varsIgnorePattern: '^(_|\\$\\$)',
					caughtErrorsIgnorePattern: '^(_|\\$\\$)',
				},
			],
		},
	},
];
