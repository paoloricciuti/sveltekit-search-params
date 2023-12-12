import { expect } from '@playwright/test';
import { test } from './extends';

test.describe('queryParam', () => {
	test('works as expected with strings', async ({ page }) => {
		await page.goto('/');
		const input = page.getByTestId('str-input');
		input.fill('str');
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
});
