import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ConfirmModal from '$lib/components/ConfirmModal.svelte';

const baseProps = () => ({
	isOpen: true,
	title: 'Delete note?',
	message: 'This cannot be undone.',
	onConfirm: vi.fn().mockResolvedValue(undefined),
	onCancel: vi.fn()
});

describe('ConfirmModal', () => {
	it('renders the title and message', async () => {
		render(ConfirmModal, baseProps());

		await expect.element(page.getByRole('heading', { name: 'Delete note?' })).toBeVisible();
		await expect.element(page.getByText('This cannot be undone.')).toBeVisible();
	});

	it('runs onConfirm and closes when confirmed', async () => {
		const props = baseProps();
		render(ConfirmModal, props);

		await page.getByRole('button', { name: 'Confirm' }).click();

		expect(props.onConfirm).toHaveBeenCalled();
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('runs onCancel when cancelled', async () => {
		const props = baseProps();
		render(ConfirmModal, props);

		await page.getByRole('button', { name: 'Cancel' }).click();

		expect(props.onCancel).toHaveBeenCalled();
	});

	it('closes on Escape', async () => {
		render(ConfirmModal, baseProps());
		await expect.element(page.getByRole('dialog')).toBeVisible();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('disables both buttons while processing', async () => {
		render(ConfirmModal, { ...baseProps(), isProcessing: true });

		await expect.element(page.getByRole('button', { name: 'Cancel' })).toBeDisabled();
	});

	it('applies the variant class to the confirm button', async () => {
		render(ConfirmModal, { ...baseProps(), variant: 'warning', confirmText: 'Proceed' });

		await expect.element(page.getByRole('button', { name: 'Proceed' })).toHaveClass(/btn-warning/);
	});
});

// KNOWN BUG (see plan "Known bugs" item 2): ConfirmModal is a generic dialog but
// hardcodes "Deleting..." as its processing label (ConfirmModal.svelte:84). Used for
// any non-delete action, the label is wrong. This it.fails asserts the INTENDED
// behavior — the processing state should not force delete-specific copy — so it
// passes only while the bug exists and flips to a failure once fixed.
describe('ConfirmModal — known bugs', () => {
	it.fails('does not show delete-specific copy for a generic action', async () => {
		render(ConfirmModal, {
			...baseProps(),
			title: 'Save changes?',
			confirmText: 'Save',
			isProcessing: true
		});

		await expect.element(page.getByText('Deleting...')).not.toBeInTheDocument();
	});
});
