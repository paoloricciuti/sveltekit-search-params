import { expect } from '@playwright/test';
import { test } from './extends';

test.describe('queryParameters with async context', () => {
	// page.url uses component context on the server; hydration would hide the error.
	test.use({ javaScriptEnabled: false });

	test('explains missing context after await and how to avoid it', async ({
		page,
	}) => {
		const response = await page.goto('/async-context?value=from-url');
		expect(response?.status()).toBe(200);
		await expect(page.getByTestId('before-await')).toHaveText('from-url');
		await expect(page.getByTestId('context-error')).toHaveText([
			'sveltekit-search-params: Unable to access page.url. Move your queryParameters() definition and any initial read in a component before the first await.',
			'sveltekit-search-params: Unable to access page.url. Move your queryParameters() definition and any initial read in a component before the first await.',
		]);
		await expect(page.getByTestId('has-cause')).toHaveText([
			'true',
			'true',
		]);
	});
});
