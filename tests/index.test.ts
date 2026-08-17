import { expect } from '@playwright/test';
import { test } from './extends';

test.describe('queryParameters', () => {
	test('works as expected with strings', async ({ page }) => {
		await page.goto('/queryparameters');
		const input = page.getByTestId('str-input');
		await input.fill('str');
		const str = page.getByTestId('str');
		await expect(str).toHaveText('str');
		const url = new URL(page.url());
		expect(url.searchParams.get('str')).toBe('str');
	});

	test('works as expected with numbers', async ({ page }) => {
		await page.goto('/queryparameters?num=0');
		const btn = page.getByTestId('num');
		await expect(btn).toHaveText('0');
		btn.click();
		await expect(btn).toHaveText('1');
		const url = new URL(page.url());
		expect(url.searchParams.get('num')).toBe('1');
	});

	test('works as expected with bools', async ({ page }) => {
		await page.goto('/queryparameters');
		let input = page.getByTestId('bools');
		await expect(input).not.toBeChecked();
		input.click();
		await expect(input).toBeChecked();
		const url = new URL(page.url());
		expect(url.searchParams.get('bools')).toBe('true');
		await page.goto('/queryparameters?bools=true');
		input = page.getByTestId('bools');
		await expect(input).toBeChecked();
		await page.goto('/queryparameters?bools=other');
		input = page.getByTestId('bools');
		await expect(input).toBeChecked();
		await page.goto('/queryparameters?bools=false');
		input = page.getByTestId('bools');
		await expect(input).not.toBeChecked();
	});

	test('works as expected with objects', async ({ page }) => {
		await page.goto('/queryparameters?obj=%7B%22str%22%3A%22%22%7D');
		const input = page.getByTestId('obj-input');
		await input.fill('str');
		const obj = page.getByTestId('obj');
		await expect(obj).toHaveText('{"str":"str"}');
		const url = new URL(page.url());
		expect(url.searchParams.get('obj')).toBe('{"str":"str"}');
	});

	test('works as expected with array', async ({ page }) => {
		await page.goto('/queryparameters');
		const input = page.getByTestId('arr-input');
		await input.click();
		let arr = page.getByTestId('arr');
		expect(await arr.count()).toBe(1);
		let url = new URL(page.url());
		expect(url.searchParams.get('arr')).toBe('[0]');
		await input.click();
		arr = page.getByTestId('arr');
		expect(await arr.count()).toBe(2);
		url = new URL(page.url());
		expect(url.searchParams.get('arr')).toBe('[0,1]');
	});

	test('works as expected with lz', async ({ page }) => {
		await page.goto('/queryparameters');
		const input = page.getByTestId('lz-input');
		await input.fill('lz');
		const str = page.getByTestId('lz');
		await expect(str).toHaveText('lz');
		const url = new URL(page.url());
		expect(url.searchParams.get('lz')).toBe('EQGwXsQ');
	});

	test("changes to the store doesn't trigger reactivity multiple times", async ({
		page,
	}) => {
		await page.goto('/queryparameters?bools=false');
		const input = page.getByTestId('str-input');
		await input.fill('s');
		const store_changes = page.getByTestId('how-many-store-changes');
		await expect(store_changes).toHaveText('2');
	});

	test("changing one parameter doesn't interfere with the rest", async ({
		page,
	}) => {
		await page.goto('/queryparameters?something=else&lz=EQGwXsQ');
		const str = page.getByTestId('lz');
		await expect(str).toHaveText('lz');
		const input = page.getByTestId('lz-input');
		await input.fill('lz changed');
		await expect(str).toHaveText('lz changed');
		const url = new URL(page.url());
		expect(url.searchParams.get('lz')).toBe('EQGwXgBAxgFghgOwOYFMAmwg');
		expect(url.searchParams.get('something')).toBe('else');
	});

	test("changing one parameter doesn't interfere with the hash", async ({
		page,
	}) => {
		await page.goto('/queryparameters#test-hash');
		const input = page.getByTestId('str-input');
		await input.fill('str');
		const str = page.getByTestId('str');
		await expect(str).toHaveText('str');
		const url = new URL(page.url());
		expect(url.searchParams.get('str')).toBe('str');
		expect(url.hash).toBe('#test-hash');
	});

	test("changing two parameters in the same function doesn't negate", async ({
		page,
	}) => {
		await page.goto('/queryparameters');
		const btn = page.getByTestId('change-two');
		await btn.click();
		const str = page.getByTestId('str');
		const num = page.getByTestId('num');
		await expect(str).toHaveText('one');
		await expect(num).toHaveText('42');
		const url = new URL(page.url());
		expect(url.searchParams.get('str')).toBe('one');
		expect(url.searchParams.get('num')).toBe('42');
	});

	test('parameters are kept in alphabetical order by default', async ({
		page,
	}) => {
		await page.goto('/queryparameters?num=0');
		const arr_btn = page.getByTestId('arr-input');
		const btn = page.getByTestId('num');
		await btn.click();
		await arr_btn.click();
		const url = new URL(page.url());
		expect(url.search).toBe('?arr=%5B0%5D&num=1');
	});

	test('parameters are not ordered if updated through a store that has specifically set sort to false', async ({
		page,
	}) => {
		await page.goto('/queryparameters');
		const input = page.getByTestId('str-input');
		const str = page.getByTestId('str');
		await input.fill('str');
		const btn = page.getByTestId('arr-unordered-input');
		await btn.click();
		const arr = page.getByTestId('arr-unordered');
		expect(await arr.count()).toBe(1);
		await expect(str).toHaveText('str');
		let url = new URL(page.url());
		expect(url.searchParams.get('arr-unordered')).toBe('[0]');
		expect(url.searchParams.get('str')).toBe('str');
		expect(url.search).toBe('?str=str&arr-unordered=%5B0%5D');

		// expect them to be ordered if you access an ordered store
		await input.fill('string');
		await expect(str).toHaveText('string');
		url = new URL(page.url());
		expect(url.searchParams.get('arr-unordered')).toBe('[0]');
		expect(url.searchParams.get('str')).toBe('string');
		expect(url.search).toBe('?arr-unordered=%5B0%5D&str=string');
	});
});

test.describe('default values', () => {
	test("defaults redirect immediately to the correct url if js is enabled but it doesn't show the paramaters where showDefaults is false", async ({
		page,
	}) => {
		await page.goto('/default');
		await page.waitForURL((url) => {
			return url.searchParams.get('str2') === 'str2';
		});
		const str2 = page.getByTestId('str2');
		const str2_no_show = page.getByTestId('str2-no-show');
		await expect(str2).toHaveText('str2');
		const url = new URL(page.url());
		await expect(str2_no_show).toHaveText('str2-no-show');
		expect(url.searchParams.get('str2-no-show')).toBeNull();
	});

	test.skip("default values for complex values doesn't get override on writes", async ({
		page,
	}) => {
		await page.goto('/default/obj');
		const input = page.locator('input');
		input.fill('test');
		const link = page.locator('a');
		await link.click();
		await page.waitForURL(
			(url) => url.searchParams.get('obj') === '{"test":""}',
		);
		const url = new URL(page.url());
		expect(url.searchParams.get('obj')).toBe('{"test":""}');
	});

	test("default values for complex values doesn't get override on writes (queryParameters)", async ({
		page,
	}) => {
		await page.goto('/default/parameters-obj');
		const input = page.locator('input');
		input.fill('test');
		const link = page.locator('a');
		await link.click();
		await page.waitForURL(
			(url) => url.searchParams.get('obj') === '{"test":""}',
		);
		const url = new URL(page.url());
		expect(url.searchParams.get('obj')).toBe('{"test":""}');
	});
});

test.describe('debounce history entry', () => {
	test('debounce update the url only after 1000ms (set on the store)', async ({
		page,
	}) => {
		await page.goto('/debounce?num=0');
		let url = new URL(page.url());

		const num = page.getByTestId('num');
		await num.click();
		url = new URL(page.url());
		await expect(num).toHaveText('1');
		expect(url.searchParams.get('num')).toBe('0');
		await new Promise((r) => setTimeout(r, 1100));
		url = new URL(page.url());
		expect(url.searchParams.get('num')).toBe('1');

		const str2 = page.getByTestId('str2');
		const str2_input = page.getByTestId('str2-input');
		await str2_input.fill('str2');
		url = new URL(page.url());
		await expect(str2).toHaveText('str2');
		expect(url.searchParams.get('str2')).toBeNull();
		await new Promise((r) => setTimeout(r, 1100));
		url = new URL(page.url());
		expect(url.searchParams.get('str2')).toBe('str2');

		const change_both = page.getByTestId('change-both');
		await change_both.click();
		url = new URL(page.url());
		await expect(str2).toHaveText('changed');
		await expect(num).toHaveText('2');
		expect(url.searchParams.get('str2')).toBe('str2');
		expect(url.searchParams.get('num')).toBe('1');
		await new Promise((r) => setTimeout(r, 1100));
		url = new URL(page.url());
		expect(url.searchParams.get('str2')).toBe('changed');
		expect(url.searchParams.get('num')).toBe('2');
	});
});

test.describe('default values during ssr', () => {
	test.use({
		javaScriptEnabled: false,
	});

	test("defaults don't redirect but the value is still present", async ({
		page,
	}) => {
		await page.goto('/default');
		const str2 = page.getByTestId('str2');
		await expect(str2).toHaveText('str2');
	});
});

test.describe('equalityFn to specify when the store is the same as before (not triggering reactivity but still navigating)', () => {
	test('equalityFn impact the amount of rerenders with queryParameters', async ({
		page,
		context,
	}) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/equalityFn?str=%7B%22value%22%3A%22test%22%7D');
		const str_input = page.getByTestId('str2-input');
		await str_input.selectText();
		await str_input.press('ControlOrMeta+c');
		await str_input.press('ControlOrMeta+v');
		const obj_changes = page.getByTestId('how-many-store-changes');
		await expect(obj_changes).toHaveText('3');
	});
});

test.describe('original methods are accessible on the returned object', () => {
	test('JSON.stringify works', async ({ page }) => {
		await page.goto(
			'/original-methods?str=%7B%22value%22%3A%22test%22%7D&number=10&obj=%7B%22value%22%3A%22test%22%7D',
		);
		const stringified_text = page.getByTestId('stringified');
		await expect(stringified_text).toHaveText(
			'{"test":null,"number":10,"another_number":42,"obj":{"value":"test"},"str":"{\\"value\\":\\"test\\"}"}',
		);
	});
});
