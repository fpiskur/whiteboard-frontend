import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';
import { gotoApp } from './fixtures/app';

test('toggles the theme and persists the preference', async ({ page }) => {
	await mockNotesApi(page, []);
	await gotoApp(page);

	// App initializes to light in a fresh context.
	const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
	await expect(toggle).toBeVisible();

	await toggle.click();

	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();

	const stored = await page.evaluate(() => localStorage.getItem('theme-preference'));
	expect(stored).toBe('dark');
});
