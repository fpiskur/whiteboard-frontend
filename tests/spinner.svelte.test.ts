import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Spinner from '$lib/components/Spinner.svelte';

describe('Spinner', () => {
	it('defaults to a 20px status graphic', async () => {
		render(Spinner);

		const svg = page.getByRole('status');
		await expect.element(svg).toHaveAttribute('width', '20');
		await expect.element(svg).toHaveAttribute('aria-label', 'Loading');
	});

	it('applies the size prop', async () => {
		render(Spinner, { size: 48 });

		await expect.element(page.getByRole('status')).toHaveAttribute('width', '48');
	});
});
