import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';

test('drags a note to a new position and syncs it to the API', async ({ page }) => {
	const api = await mockNotesApi(page, [
		{ id: 1, content: 'Draggable', pos_x: 150, pos_y: 150, width: 200, height: 120 }
	]);
	await page.goto('/');

	const note = page.getByRole('button', { name: /Draggable/ });
	const start = await note.boundingBox();
	if (!start) throw new Error('note not laid out');

	const fromX = start.x + start.width / 2;
	const fromY = start.y + start.height / 2;

	await page.mouse.move(fromX, fromY);
	await page.mouse.down();
	await page.mouse.move(fromX + 180, fromY + 120, { steps: 10 });
	await page.mouse.up();

	// The note moved on screen...
	await expect(async () => {
		const end = await note.boundingBox();
		expect(end!.x).toBeGreaterThan(start.x + 100);
		expect(end!.y).toBeGreaterThan(start.y + 60);
	}).toPass();

	// ...and a batch position update was sent for it.
	expect(api.bulkUpdated.some((u) => u.id === 1)).toBe(true);
});
