import type { Note, NoteAPIResponse } from '$lib/types';

/**
 * Build a Note (numeric dimensions) for tests, overriding any fields.
 */
export function makeNote(overrides: Partial<Note> = {}): Note {
	return {
		id: 1,
		pos_x: 0,
		pos_y: 0,
		width: 120,
		height: 120,
		content: 'Test note',
		color_index: 'default',
		...overrides
	};
}

/**
 * Build a NoteAPIResponse (string dimensions, as Rails returns decimals) for
 * exercising the string -> number normalization path.
 */
export function makeApiNote(overrides: Partial<NoteAPIResponse> = {}): NoteAPIResponse {
	return {
		id: 1,
		pos_x: '10.5',
		pos_y: '20.25',
		width: '300',
		height: '150',
		content: 'Test note',
		color_index: 'default',
		...overrides
	};
}
