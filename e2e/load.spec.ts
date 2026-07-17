import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';

test('renders notes returned by the API', async ({ page }) => {
	await mockNotesApi(page, [
		{ id: 1, content: 'First note', pos_x: 100, pos_y: 100 },
		{ id: 2, content: 'Second note', pos_x: 400, pos_y: 200 }
	]);

	await page.goto('/');

	await expect(page.getByRole('button', { name: /First note/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /Second note/ })).toBeVisible();
});

test('shows an error message when the notes fail to load', async ({ page }) => {
	await mockNotesApi(page, [], { error: 500 });

	await page.goto('/');

	await expect(page.getByText(/error/i)).toBeVisible();
});
