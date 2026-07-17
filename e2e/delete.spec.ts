import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';

test('deletes the selected note after confirmation', async ({ page }) => {
	const api = await mockNotesApi(page, [{ id: 1, content: 'Delete me', pos_x: 150, pos_y: 150 }]);
	await page.goto('/');

	const note = page.getByRole('button', { name: /Delete me/ });
	await note.click();
	await page.keyboard.press('Delete');

	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Delete Note' })).toBeVisible();

	// Scope to the dialog and use an exact name so this doesn't also match the
	// note whose accessible name contains "Delete".
	await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

	await expect(note).toHaveCount(0);
	expect(api.notes).toHaveLength(0);
});
