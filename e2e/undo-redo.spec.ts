import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';
import { gotoApp } from './fixtures/app';

test('undo removes a created note and redo brings it back', async ({ page }) => {
	await mockNotesApi(page, []);
	await gotoApp(page);

	// Create a note.
	await page.getByRole('button', { name: 'Create new note' }).click();
	await page.getByRole('textbox').fill('Undoable');
	await page.getByRole('button', { name: 'Create Note' }).click();

	const note = page.getByRole('button', { name: /Undoable/ });
	await expect(note).toBeVisible();

	// Undo -> the note is removed.
	await page.keyboard.press('Control+z');
	await expect(note).toHaveCount(0);

	// Redo (Ctrl+Y is the unambiguous binding) -> the note comes back.
	await page.keyboard.press('Control+y');
	await expect(page.getByRole('button', { name: /Undoable/ })).toBeVisible();
});

test('undo restores a note position after a move', async ({ page }) => {
	await mockNotesApi(page, [
		{ id: 1, content: 'Mover', pos_x: 150, pos_y: 150, width: 200, height: 120 }
	]);
	await gotoApp(page);

	const note = page.getByRole('button', { name: /Mover/ });
	const start = await note.boundingBox();
	if (!start) throw new Error('note not laid out');

	// Grab the centre, then move by a clear delta from that grab point.
	const centerX = start.x + start.width / 2;
	const centerY = start.y + start.height / 2;
	await page.mouse.move(centerX, centerY);
	await page.mouse.down();
	await page.mouse.move(centerX + 200, centerY + 150, { steps: 10 });
	await page.mouse.up();

	await expect(async () => {
		expect((await note.boundingBox())!.x).toBeGreaterThan(start.x + 150);
	}).toPass();

	await page.keyboard.press('Control+z');

	await expect(async () => {
		const back = await note.boundingBox();
		expect(Math.abs(back!.x - start.x)).toBeLessThan(5);
		expect(Math.abs(back!.y - start.y)).toBeLessThan(5);
	}).toPass();
});
