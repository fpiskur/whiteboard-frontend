import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';
import { gotoApp } from './fixtures/app';

test('creates a note from the FAB and sends it to the API', async ({ page }) => {
	const api = await mockNotesApi(page, []);
	await gotoApp(page);

	await page.getByRole('button', { name: 'Create new note' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();

	await page.getByRole('textbox').fill('Groceries');
	await page.getByRole('button', { name: 'Blue' }).click();
	await page.getByRole('button', { name: 'Create Note' }).click();

	// The new note appears on the canvas...
	await expect(page.getByRole('button', { name: /Groceries/ })).toBeVisible();
	// ...and the create request carried the content and colour.
	expect(api.created).toHaveLength(1);
	expect(api.created[0]).toMatchObject({ content: 'Groceries', color_index: 'blue' });
});
