import { test as base } from '@playwright/test';

export const test = base.extend({
	page: async ({ page, javaScriptEnabled }, use) => {
		// automatically wait for kit started event after navigation functions if js is enabled
		const page_navigation_functions = ['goto', 'goBack', 'reload'] as const;
		page_navigation_functions.forEach((fn) => {
			const pageFn = page[fn];
			if (!pageFn) {
				throw new Error(`function does not exist on page: ${fn}`);
			}
			// substitute the actual function with a new function that waits
			// for the selector that we've set in +layout.svelte
			page[fn] = async function (...args: Parameters<typeof pageFn>) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				const res = await pageFn.call(page, ...args);
				if (
					javaScriptEnabled &&
					(args[1] as { waitForStarted: boolean })?.waitForStarted !==
						false
				) {
					await page.waitForSelector('body[data-kit-started]', {
						timeout: 15000,
					});
				}
				return res;
			};
		});
		await use(page);
	},
});
