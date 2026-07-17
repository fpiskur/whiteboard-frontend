import { describe, expect, it } from 'vitest';
import { getNotesInBox, isNoteInSelectionBox } from '$lib/utils/collision-utils';
import { makeNote } from './fixtures/notes';

describe('isNoteInSelectionBox', () => {
	const note = makeNote({ id: 1, pos_x: 100, pos_y: 100, width: 50, height: 50 });

	it('detects a box that overlaps the note', () => {
		expect(isNoteInSelectionBox(note, { x: 90, y: 90 }, { x: 160, y: 160 })).toBe(true);
	});

	it('rejects a box that misses the note entirely', () => {
		expect(isNoteInSelectionBox(note, { x: 0, y: 0 }, { x: 40, y: 40 })).toBe(false);
	});

	it('is direction-agnostic: a reversed box (end before start) still hits', () => {
		expect(isNoteInSelectionBox(note, { x: 160, y: 160 }, { x: 90, y: 90 })).toBe(true);
	});

	it('counts an edge-touching box as a hit (inclusive bounds)', () => {
		// Box's bottom-right corner exactly meets the note's top-left corner.
		expect(isNoteInSelectionBox(note, { x: 50, y: 50 }, { x: 100, y: 100 })).toBe(true);
	});

	it('treats a zero-size box inside the note as a hit', () => {
		expect(isNoteInSelectionBox(note, { x: 120, y: 120 }, { x: 120, y: 120 })).toBe(true);
	});
});

describe('getNotesInBox', () => {
	const notes = [
		makeNote({ id: 1, pos_x: 0, pos_y: 0, width: 50, height: 50 }),
		makeNote({ id: 2, pos_x: 200, pos_y: 200, width: 50, height: 50 }),
		makeNote({ id: 3, pos_x: 100, pos_y: 100, width: 50, height: 50 })
	];

	it('returns the ids of only the intersecting notes', () => {
		const ids = getNotesInBox(notes, { x: -10, y: -10 }, { x: 160, y: 160 });
		expect(ids).toEqual([1, 3]);
	});

	it('returns an empty array when nothing intersects', () => {
		expect(getNotesInBox(notes, { x: 500, y: 500 }, { x: 600, y: 600 })).toEqual([]);
	});

	it('returns an empty array for an empty note list', () => {
		expect(getNotesInBox([], { x: 0, y: 0 }, { x: 100, y: 100 })).toEqual([]);
	});
});
