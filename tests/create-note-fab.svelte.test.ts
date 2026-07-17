import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CreateNoteFAB from '$lib/components/CreateNoteFAB.svelte';

describe('CreateNoteFAB', () => {
	it('invokes its onclick when pressed', async () => {
		const onclick = vi.fn();
		render(CreateNoteFAB, { onclick });

		await page.getByRole('button', { name: 'Create new note' }).click();

		expect(onclick).toHaveBeenCalledTimes(1);
	});
});
