import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the API boundary so state logic is tested without the network.
vi.mock('$lib/api/rails-api', () => ({
	fetchNotes: vi.fn(),
	createNote: vi.fn(),
	updateNote: vi.fn(),
	batchUpdateNotes: vi.fn(),
	deleteNote: vi.fn(),
	batchDeleteNotes: vi.fn()
}));

import {
	fetchNotes,
	createNote,
	updateNote,
	batchUpdateNotes,
	deleteNote,
	batchDeleteNotes
} from '$lib/api/rails-api';
import {
	notesState,
	loadNotes,
	createNoteLocal,
	updateNoteLocal,
	batchUpdateNotesLocal,
	deleteNoteLocal,
	deleteNotesLocal
} from '$lib/state/notesState.svelte';
import { makeNote } from './fixtures/notes';

beforeEach(() => {
	vi.clearAllMocks();
	notesState.items = [];
	notesState.loading = false;
	notesState.error = null;
});

describe('loadNotes', () => {
	it('stores fetched notes and clears loading/error on success', async () => {
		vi.mocked(fetchNotes).mockResolvedValue([makeNote({ id: 1 }), makeNote({ id: 2 })]);

		await loadNotes();

		expect(notesState.items.map((n) => n.id)).toEqual([1, 2]);
		expect(notesState.loading).toBe(false);
		expect(notesState.error).toBeNull();
	});

	it('captures the ApiError message into state on failure', async () => {
		vi.mocked(fetchNotes).mockRejectedValue({ message: 'boom', status: 500 });

		await loadNotes();

		expect(notesState.error).toBe('boom');
		expect(notesState.loading).toBe(false);
	});
});

describe('createNoteLocal', () => {
	it('appends the created note', async () => {
		vi.mocked(createNote).mockResolvedValue(makeNote({ id: 9 }));

		await createNoteLocal({ pos_x: 0, pos_y: 0, content: 'x' });

		expect(notesState.items.map((n) => n.id)).toEqual([9]);
	});
});

describe('updateNoteLocal', () => {
	it('replaces the matching note in place', async () => {
		notesState.items = [makeNote({ id: 1, content: 'old' })];
		vi.mocked(updateNote).mockResolvedValue(makeNote({ id: 1, content: 'new' }));

		await updateNoteLocal(1, { content: 'new' });

		expect(notesState.items[0].content).toBe('new');
	});

	it('is a no-op when the id is not found', async () => {
		notesState.items = [makeNote({ id: 1 })];
		vi.mocked(updateNote).mockResolvedValue(makeNote({ id: 999, content: 'ghost' }));

		await updateNoteLocal(999, { content: 'ghost' });

		expect(notesState.items).toHaveLength(1);
		expect(notesState.items[0].id).toBe(1);
	});
});

describe('batchUpdateNotesLocal', () => {
	it('replaces each returned note by id', async () => {
		notesState.items = [makeNote({ id: 1, pos_x: 0 }), makeNote({ id: 2, pos_x: 0 })];
		vi.mocked(batchUpdateNotes).mockResolvedValue([
			makeNote({ id: 1, pos_x: 100 }),
			makeNote({ id: 2, pos_x: 200 })
		]);

		await batchUpdateNotesLocal([
			{ id: 1, data: { pos_x: 100 } },
			{ id: 2, data: { pos_x: 200 } }
		]);

		expect(notesState.items.map((n) => n.pos_x)).toEqual([100, 200]);
	});
});

describe('deletion', () => {
	it('deleteNoteLocal removes a single note', async () => {
		notesState.items = [makeNote({ id: 1 }), makeNote({ id: 2 })];
		vi.mocked(deleteNote).mockResolvedValue(undefined);

		await deleteNoteLocal(1);

		expect(notesState.items.map((n) => n.id)).toEqual([2]);
	});

	it('deleteNotesLocal removes every listed note', async () => {
		notesState.items = [makeNote({ id: 1 }), makeNote({ id: 2 }), makeNote({ id: 3 })];
		vi.mocked(batchDeleteNotes).mockResolvedValue(undefined);

		await deleteNotesLocal([1, 3]);

		expect(notesState.items.map((n) => n.id)).toEqual([2]);
	});
});
