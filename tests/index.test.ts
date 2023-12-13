import { expect } from '@playwright/test';
import { test } from './extends';

test.describe('queryParam', () => {
	test('works as expected with strings', async ({ page }) => {
		await page.goto('/');
		const input = page.getByTestId('str-input');
		await input.fill('str');
		const str = page.getByTestId('str');
		await expect(str).toHaveText('str');
		const url = new URL(page.url());
		expect(url.searchParams.get('str')).toBe('str');
	});

	test('works as expected with numbers', async ({ page }) => {
		await page.goto('/?num=0');
		const btn = page.getByTestId('num');
		await expect(btn).toHaveText('0');
		btn.click();
		await expect(btn).toHaveText('1');
		const url = new URL(page.url());
		expect(url.searchParams.get('num')).toBe('1');
	});

	test('works as expected with bools', async ({ page }) => {
		await page.goto('/');
		let input = page.getByTestId('bools');
		await expect(input).not.toBeChecked();
		input.click();
		await expect(input).toBeChecked();
		const url = new URL(page.url());
		expect(url.searchParams.get('bools')).toBe('true');
		await page.goto('/?bools=true');
		input = page.getByTestId('bools');
		await expect(input).toBeChecked();
		await page.goto('/?bools=other');
		input = page.getByTestId('bools');
		await expect(input).toBeChecked();
		await page.goto('/?bools=false');
		input = page.getByTestId('bools');
		await expect(input).not.toBeChecked();
	});

	test('works as expected with objects', async ({ page }) => {
		await page.goto('/?obj=%7B%22str%22%3A%22%22%7D');
		const input = page.getByTestId('obj-input');
		await input.fill('str');
		const obj = page.getByTestId('obj');
		await expect(obj).toHaveText('{"str":"str"}');
		const url = new URL(page.url());
		expect(url.searchParams.get('obj')).toBe('{"str":"str"}');
	});

	test('works as expected with array', async ({ page }) => {
		await page.goto('/');
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
		await page.goto('/');
		const input = page.getByTestId('lz-input');
		await input.fill('lz');
		const str = page.getByTestId('lz');
		await expect(str).toHaveText('lz');
		const url = new URL(page.url());
		expect(url.searchParams.get('lz')).toBe('EQGwXsQ');
	});

	test("changing one parameter doesn't interfere with the rest", async ({
		page,
	}) => {
		await page.goto('/?something=else&lz=EQGwXsQ');
		const str = page.getByTestId('lz');
		await expect(str).toHaveText('lz');
		const input = page.getByTestId('lz-input');
		await input.fill('lz changed');
		const url = new URL(page.url());
		expect(url.searchParams.get('lz')).toBe('EQGwXgBAxgFghgOwOYFMAmwg');
		expect(url.searchParams.get('something')).toBe('else');
	});

	test("changing one parameter doesn't interfere with the hash", async ({
		page,
	}) => {
		await page.goto('/#test-hash');
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
		await page.goto('/');
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
});

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

	test("changing one parameter doesn't interfere with the rest", async ({
		page,
	}) => {
		await page.goto('/queryparameters?something=else&lz=EQGwXsQ');
		const str = page.getByTestId('lz');
		await expect(str).toHaveText('lz');
		const input = page.getByTestId('lz-input');
		await input.fill('lz changed');
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
});
