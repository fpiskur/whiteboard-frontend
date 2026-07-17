import { expect, test } from '@playwright/test';
import { mockNotesApi } from './fixtures/api';

const seed = [
	{ id: 1, content: 'Note A', pos_x: 120, pos_y: 120 },
	{ id: 2, content: 'Note B', pos_x: 420, pos_y: 120 }
];

test('selects a single note on click', async ({ page }) => {
	await mockNotesApi(page, seed);
	await page.goto('/');

	const a = page.getByRole('button', { name: /Note A/ });
	await a.click();

	await expect(a).toHaveClass(/selected/);
	await expect(page.getByRole('button', { name: /Note B/ })).not.toHaveClass(/selected/);
});

test('adds to the selection with Ctrl+click', async ({ page }) => {
	await mockNotesApi(page, seed);
	await page.goto('/');

	await page.getByRole('button', { name: /Note A/ }).click();
	await page.getByRole('button', { name: /Note B/ }).click({ modifiers: ['Control'] });

	await expect(page.getByRole('button', { name: /Note A/ })).toHaveClass(/selected/);
	await expect(page.getByRole('button', { name: /Note B/ })).toHaveClass(/selected/);
});

test('Ctrl+A selects all notes and Escape clears the selection', async ({ page }) => {
	await mockNotesApi(page, seed);
	await page.goto('/');
	// Focus the canvas so the window keydown handler is active.
	await page.getByRole('button', { name: /Note A/ }).click();

	await page.keyboard.press('Control+a');
	await expect(page.getByRole('button', { name: /Note A/ })).toHaveClass(/selected/);
	await expect(page.getByRole('button', { name: /Note B/ })).toHaveClass(/selected/);

	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: /Note A/ })).not.toHaveClass(/selected/);
	await expect(page.getByRole('button', { name: /Note B/ })).not.toHaveClass(/selected/);
});
