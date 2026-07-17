import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeNote } from './fixtures/notes';
import type { Note } from '$lib/types';

// Mock the collaborators so history logic is isolated from network + UI.
vi.mock('$lib/state/notesState.svelte', () => ({
	createNoteLocal: vi.fn().mockResolvedValue(undefined),
	deleteNotesLocal: vi.fn().mockResolvedValue(undefined),
	updateNoteLocal: vi.fn().mockResolvedValue(undefined),
	batchUpdateNotesLocal: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('$lib/state/toastState.svelte', () => ({
	toastState: { showSuccess: vi.fn(), showError: vi.fn() }
}));

import { historyState } from '$lib/state/historyState.svelte';

// SCOPE NOTE: this file covers only history's synchronous, context-free logic
// (recordAction stack management). The async undo()/redo() flow is gated by the
// module's `canUndo`/`canRedo` `$derived` values, which Svelte 5 only recomputes
// inside a live reactive context — not when driven directly from a plain node test.
// Undo/redo behavior (operations, toasts, pluralized messages, and the known
// original-id bug) is therefore exercised end-to-end in e2e/undo-redo.spec.ts,
// where the running app supplies that context.

const createAction = (noteId: number) => {
	const note = makeNote({ id: noteId });
	const noteData: Omit<Note, 'id'> = {
		pos_x: note.pos_x,
		pos_y: note.pos_y,
		width: note.width,
		height: note.height,
		content: note.content,
		color_index: note.color_index
	};
	return { type: 'CREATE_NOTE' as const, noteId, noteData };
};

// Reset the shared undo stack by overflowing past the 50-item cap, so each test
// starts from a known bounded size. (There is no public reset, and undo() cannot
// run outside a reactive context — see the scope note above.)
beforeEach(() => {
	vi.clearAllMocks();
	for (let i = 0; i < 51; i++) {
		historyState.recordAction(createAction(-i));
	}
});

describe('recordAction', () => {
	it('grows the undo stack and keeps the redo stack empty', () => {
		const before = historyState.undoStackSize;
		historyState.recordAction(createAction(1));
		// Already at the 50 cap, so size holds at 50 rather than growing to 51.
		expect(before).toBe(50);
		expect(historyState.undoStackSize).toBe(50);
		expect(historyState.redoStackSize).toBe(0);
	});

	it('caps the undo stack at 50 entries', () => {
		for (let i = 0; i < 20; i++) {
			historyState.recordAction(createAction(100 + i));
		}
		expect(historyState.undoStackSize).toBe(50);
	});
});
