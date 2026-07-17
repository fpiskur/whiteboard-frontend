import { describe, expect, it } from 'vitest';
import { getGridOffset, getGridSize } from '$lib/utils/grid-utils';
import { GRID } from '$lib/state/constants';

describe('getGridSize', () => {
	it('maps each zoom level to its paired size', () => {
		for (let i = 0; i < GRID.ZOOM_LEVELS.length; i++) {
			expect(getGridSize(GRID.ZOOM_LEVELS[i])).toBe(GRID.SIZES[i]);
		}
	});

	it('returns the coarsest size below the smallest zoom level', () => {
		// scale <= 0.125 falls into the first bucket (160).
		expect(getGridSize(0.05)).toBe(160);
	});

	it('falls back to BASE_SIZE above the largest zoom level', () => {
		// scale 20 exceeds every level (max 16), so no bucket matches.
		expect(getGridSize(20)).toBe(GRID.BASE_SIZE);
	});

	it('selects the bucket at an exact boundary', () => {
		expect(getGridSize(1)).toBe(20);
	});
});

describe('getGridOffset', () => {
	it('wraps a positive offset within the grid size', () => {
		expect(getGridOffset(45, 20)).toBe(5);
	});

	it('returns a positive offset for a negative camera offset', () => {
		// Plain JS modulo would give -5; the double-mod normalizes to 15.
		expect(getGridOffset(-45, 20)).toBe(15);
	});

	it('returns 0 when the offset is a multiple of the grid size', () => {
		expect(getGridOffset(40, 20)).toBe(0);
	});
});
