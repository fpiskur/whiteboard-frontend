import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ThemeToggle from '$lib/components/ThemeToggle.svelte';
import { themeState } from '$lib/state/themeState.svelte';

afterEach(() => {
	themeState.setTheme('light');
});

describe('ThemeToggle', () => {
	it('flips the theme on click', async () => {
		themeState.setTheme('light');
		render(ThemeToggle);

		await page.getByRole('button', { name: 'Switch to dark mode' }).click();

		expect(themeState.isDark).toBe(true);
	});

	it('reflects the current theme in its accessible label', async () => {
		themeState.setTheme('dark');
		render(ThemeToggle);

		// In dark mode the toggle offers to switch to light.
		await expect.element(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
	});
});
