import { describe, expect, it } from 'vitest';
import { getViewportBounds, getVisibleNotes, isNoteVisible } from '$lib/utils/viewport-culling';
import type { Camera } from '$lib/state/cameraState.svelte';
import { makeNote } from './fixtures/notes';

const camera = (x: number, y: number, scale: number): Camera => ({ x, y, scale });

describe('getViewportBounds', () => {
	it('maps a viewport at the origin with no zoom to matching world bounds', () => {
		// toBeCloseTo avoids a -0 vs 0 mismatch: -camera.x / scale yields -0 here.
		const bounds = getViewportBounds(800, 600, camera(0, 0, 1));
		expect(bounds.minX).toBeCloseTo(0);
		expect(bounds.minY).toBeCloseTo(0);
		expect(bounds.maxX).toBe(800);
		expect(bounds.maxY).toBe(600);
	});

	it('accounts for camera pan and zoom', () => {
		// Panned by (100, 50), zoomed 2x.
		expect(getViewportBounds(800, 600, camera(100, 50, 2))).toEqual({
			minX: -50,
			maxX: 350,
			minY: -25,
			maxY: 275
		});
	});
});

describe('isNoteVisible', () => {
	const bounds = { minX: 0, maxX: 800, minY: 0, maxY: 600 };

	it('is true for a note fully inside the viewport', () => {
		expect(isNoteVisible(makeNote({ pos_x: 100, pos_y: 100 }), bounds)).toBe(true);
	});

	it('is false for a note far outside the viewport', () => {
		expect(isNoteVisible(makeNote({ pos_x: 2000, pos_y: 2000 }), bounds)).toBe(false);
	});

	it('is true for a note straddling the boundary', () => {
		expect(isNoteVisible(makeNote({ pos_x: -50, pos_y: 300, width: 120 }), bounds)).toBe(true);
	});

	it('includes a note within the default 100px preload margin', () => {
		// 60px to the left of the viewport: outside proper, inside the 100px margin.
		expect(isNoteVisible(makeNote({ pos_x: -180, pos_y: 300, width: 120 }), bounds)).toBe(true);
	});

	it('excludes that same note when the margin is 0', () => {
		expect(isNoteVisible(makeNote({ pos_x: -180, pos_y: 300, width: 120 }), bounds, 0)).toBe(false);
	});
});

describe('getVisibleNotes', () => {
	it('returns only the notes overlapping the viewport', () => {
		const notes = [
			makeNote({ id: 1, pos_x: 100, pos_y: 100 }),
			makeNote({ id: 2, pos_x: 5000, pos_y: 5000 })
		];
		const visible = getVisibleNotes(notes, 800, 600, camera(0, 0, 1));
		expect(visible.map((n) => n.id)).toEqual([1]);
	});
});
