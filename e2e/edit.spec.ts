import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';

test('edits a note via double-click', async ({ page }) => {
	await mockNotesApi(page, [{ id: 1, content: 'Old text', pos_x: 150, pos_y: 150 }]);
	await page.goto('/');

	await page.getByRole('button', { name: /Old text/ }).dblclick();

	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Edit Note' })).toBeVisible();
	await expect(page.getByRole('textbox')).toHaveValue('Old text');

	await page.getByRole('textbox').fill('New text');
	await page.getByRole('button', { name: 'Save Changes' }).click();

	await expect(page.getByRole('button', { name: /New text/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /Old text/ })).toHaveCount(0);
});
