import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NoteFormModal from '$lib/components/NoteFormModal.svelte';
import { makeNote } from './fixtures/notes';

describe('NoteFormModal — create mode', () => {
	it('shows create-mode title and button text', async () => {
		render(NoteFormModal, { isOpen: true, editNote: null, onSubmit: vi.fn() });

		await expect.element(page.getByRole('heading', { name: 'Create a New Note' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Create Note' })).toBeVisible();
	});

	it('disables submit until the content is non-empty', async () => {
		render(NoteFormModal, { isOpen: true, editNote: null, onSubmit: vi.fn() });

		const submit = page.getByRole('button', { name: 'Create Note' });
		await expect.element(submit).toBeDisabled();

		await page.getByRole('textbox').fill('Hello');
		await expect.element(submit).toBeEnabled();
	});

	it('keeps submit disabled for whitespace-only content', async () => {
		render(NoteFormModal, { isOpen: true, editNote: null, onSubmit: vi.fn() });

		await page.getByRole('textbox').fill('   ');
		await expect.element(page.getByRole('button', { name: 'Create Note' })).toBeDisabled();
	});

	it('submits trimmed content, the chosen color, and no id', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		render(NoteFormModal, { isOpen: true, editNote: null, onSubmit });

		await page.getByRole('textbox').fill('  Buy milk  ');
		await page.getByRole('button', { name: 'Blue' }).click();
		await page.getByRole('button', { name: 'Create Note' }).click();

		expect(onSubmit).toHaveBeenCalledWith('Buy milk', 'blue', undefined);
	});
});

describe('NoteFormModal — edit mode', () => {
	const editNote = makeNote({ id: 42, content: 'Original', color_index: 'green' });

	it('shows edit-mode title/button and prefills the content', async () => {
		render(NoteFormModal, { isOpen: true, editNote, onSubmit: vi.fn() });

		await expect.element(page.getByRole('heading', { name: 'Edit Note' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
		await expect.element(page.getByRole('textbox')).toHaveValue('Original');
	});

	it('passes the edited note id back to onSubmit', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		render(NoteFormModal, { isOpen: true, editNote, onSubmit });

		await page.getByRole('textbox').fill('Changed');
		await page.getByRole('button', { name: 'Save Changes' }).click();

		expect(onSubmit).toHaveBeenCalledWith('Changed', 'green', 42);
	});
});

describe('NoteFormModal — submitting + closing', () => {
	it('disables fields and shows a progress label while submitting', async () => {
		render(NoteFormModal, { isOpen: true, editNote: null, onSubmit: vi.fn(), isSubmitting: true });

		await expect.element(page.getByRole('textbox')).toBeDisabled();
		await expect.element(page.getByText('Creating...')).toBeVisible();
	});

	it('closes on Escape', async () => {
		render(NoteFormModal, { isOpen: true, editNote: null, onSubmit: vi.fn() });
		await expect.element(page.getByRole('dialog')).toBeVisible();

		await page
			.getByRole('textbox')
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('closes when the backdrop is clicked', async () => {
		render(NoteFormModal, { isOpen: true, editNote: null, onSubmit: vi.fn() });

		(document.querySelector('.modal-backdrop') as HTMLElement).click();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
