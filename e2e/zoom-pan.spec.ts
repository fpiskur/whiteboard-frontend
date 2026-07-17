import { expect, test, type Page } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';
import { gotoApp } from './fixtures/app';

/** Read the current scale from the .notes-layer transform matrix. */
async function currentScale(page: Page): Promise<number> {
	const transform = await page
		.locator('.notes-layer')
		.evaluate((el) => getComputedStyle(el).transform);
	if (transform === 'none') return 1;
	const m = transform.match(/matrix\(([^)]+)\)/);
	return m ? parseFloat(m[1].split(',')[0]) : 1;
}

test('Ctrl+wheel zooms the canvas in', async ({ page }) => {
	await mockNotesApi(page, [{ id: 1, content: 'Anchor', pos_x: 300, pos_y: 300 }]);
	await gotoApp(page);

	expect(await currentScale(page)).toBeCloseTo(1, 1);

	// Playwright's mouse.wheel does not carry keyboard modifiers, and the app only
	// zooms on a ctrl/cmd wheel, so dispatch a real ctrl+wheel event on the viewport.
	await page.locator('.viewport').evaluate((el) => {
		el.dispatchEvent(
			new WheelEvent('wheel', {
				deltaY: -300,
				ctrlKey: true,
				clientX: 400,
				clientY: 300,
				bubbles: true,
				cancelable: true
			})
		);
	});

	await expect(async () => {
		expect(await currentScale(page)).toBeGreaterThan(1);
	}).toPass();
});

test('Space+drag pans the canvas', async ({ page }) => {
	await mockNotesApi(page, [{ id: 1, content: 'Anchor', pos_x: 300, pos_y: 300 }]);
	await gotoApp(page);

	const before = await page
		.locator('.notes-layer')
		.evaluate((el) => getComputedStyle(el).transform);

	// Pan from an empty part of the canvas (the note sits around 300,300).
	await page.keyboard.down('Space');
	await page.mouse.move(150, 550);
	await page.mouse.down();
	await page.mouse.move(400, 650, { steps: 10 });
	await page.mouse.up();
	await page.keyboard.up('Space');

	await expect(async () => {
		const after = await page
			.locator('.notes-layer')
			.evaluate((el) => getComputedStyle(el).transform);
		expect(after).not.toBe(before);
	}).toPass();
});
