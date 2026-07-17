import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';

test('resizes a note via its handle', async ({ page }) => {
	await mockNotesApi(page, [
		{ id: 1, content: 'Resizable', pos_x: 150, pos_y: 150, width: 200, height: 150 }
	]);
	await page.goto('/');

	const note = page.getByRole('button', { name: /Resizable/ });
	const before = await note.boundingBox();
	if (!before) throw new Error('note not laid out');

	// The resize handle sits at the note's bottom-right corner.
	const handle = page.getByRole('button', { name: 'Resize note' });
	const hb = await handle.boundingBox();
	if (!hb) throw new Error('handle not laid out');

	await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
	await page.mouse.down();
	await page.mouse.move(hb.x + 120, hb.y + 90, { steps: 10 });
	await page.mouse.up();

	await expect(async () => {
		const after = await note.boundingBox();
		expect(after!.width).toBeGreaterThan(before.width + 50);
		expect(after!.height).toBeGreaterThan(before.height + 30);
	}).toPass();
});

test('does not shrink a note below the 120x120 minimum', async ({ page }) => {
	await mockNotesApi(page, [
		{ id: 1, content: 'Tiny', pos_x: 150, pos_y: 150, width: 130, height: 130 }
	]);
	await page.goto('/');

	const note = page.getByRole('button', { name: /Tiny/ });
	const handle = page.getByRole('button', { name: 'Resize note' });
	const hb = await handle.boundingBox();
	if (!hb) throw new Error('handle not laid out');

	// Drag far up-left to try to collapse the note.
	await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
	await page.mouse.down();
	await page.mouse.move(hb.x - 300, hb.y - 300, { steps: 10 });
	await page.mouse.up();

	await expect(async () => {
		const after = await note.boundingBox();
		expect(after!.width).toBeGreaterThanOrEqual(120);
		expect(after!.height).toBeGreaterThanOrEqual(120);
	}).toPass();
});
