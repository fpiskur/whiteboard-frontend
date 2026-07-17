import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ToastContainer from '$lib/components/ToastContainer.svelte';
import { toastState } from '$lib/state/toastState.svelte';

function clearToasts() {
	for (const t of [...toastState.items]) {
		toastState.removeToast(t.id);
	}
}

beforeEach(clearToasts);
afterEach(clearToasts);

describe('ToastContainer', () => {
	it('renders a toast with its message and type icon', async () => {
		// duration 0 => persistent, so no timers involved.
		toastState.addToast('Saved!', 'success', 0);
		render(ToastContainer);

		await expect.element(page.getByText('Saved!')).toBeVisible();
		await expect.element(page.getByText('✓')).toBeVisible();
	});

	it('removes a toast when its close button is clicked', async () => {
		toastState.addToast('Dismiss me', 'info', 0);
		render(ToastContainer);

		await expect.element(page.getByText('Dismiss me')).toBeVisible();
		await page.getByRole('button', { name: 'Close notification' }).click();

		await expect.element(page.getByText('Dismiss me')).not.toBeInTheDocument();
		expect(toastState.items).toHaveLength(0);
	});
});
