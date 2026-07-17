import { describe, expect, it } from 'vitest';
import { getCenteredNotePosition, screenToWorld, worldToScreen } from '$lib/utils/canvas-utils';
import type { Camera } from '$lib/state/cameraState.svelte';

const camera = (x: number, y: number, scale: number): Camera => ({ x, y, scale });

describe('screenToWorld / worldToScreen', () => {
	it('is an identity mapping for a camera at origin with no zoom', () => {
		expect(screenToWorld(120, 80, camera(0, 0, 1))).toEqual({ x: 120, y: 80 });
	});

	it('accounts for camera pan and zoom', () => {
		expect(screenToWorld(300, 200, camera(100, 50, 2))).toEqual({ x: 100, y: 75 });
	});

	it('round-trips back to the original screen coordinates', () => {
		const cam = camera(-40, 130, 1.75);
		const world = screenToWorld(640, 480, cam);
		const screen = worldToScreen(world.x, world.y, cam);

		expect(screen.x).toBeCloseTo(640);
		expect(screen.y).toBeCloseTo(480);
	});
});

describe('getCenteredNotePosition', () => {
	it('centers the note on the viewport rather than aligning its top-left corner', () => {
		const pos = getCenteredNotePosition(1000, 600, 200, 100, camera(0, 0, 1));

		expect(pos).toEqual({ x: 400, y: 250 });
	});

	it('centers the note while zoomed in', () => {
		const pos = getCenteredNotePosition(1000, 600, 200, 100, camera(0, 0, 2));

		// Viewport center is world (250, 150); back off half the note's size.
		expect(pos).toEqual({ x: 150, y: 100 });
	});
});
