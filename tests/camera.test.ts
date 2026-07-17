import { describe, expect, it } from 'vitest';
import { camera, cameraRender, clampScale, setCamera } from '$lib/state/cameraState.svelte';
import { ZOOM_CONSTRAINTS } from '$lib/state/constants';

describe('clampScale', () => {
	it('passes through a value within range', () => {
		expect(clampScale(1)).toBe(1);
	});

	it('clamps to the minimum scale', () => {
		expect(clampScale(0.01)).toBe(ZOOM_CONSTRAINTS.MIN_SCALE);
	});

	it('clamps a negative value up to the minimum scale', () => {
		expect(clampScale(-5)).toBe(ZOOM_CONSTRAINTS.MIN_SCALE);
	});

	it('clamps to the maximum scale', () => {
		expect(clampScale(999)).toBe(ZOOM_CONSTRAINTS.MAX_SCALE);
	});

	it('preserves the exact boundaries', () => {
		expect(clampScale(ZOOM_CONSTRAINTS.MIN_SCALE)).toBe(ZOOM_CONSTRAINTS.MIN_SCALE);
		expect(clampScale(ZOOM_CONSTRAINTS.MAX_SCALE)).toBe(ZOOM_CONSTRAINTS.MAX_SCALE);
	});
});

describe('setCamera', () => {
	it('sets position, clamps scale, and raises both render flags', () => {
		cameraRender.needsRender = false;
		cameraRender.needsGridRender = false;

		setCamera(30, 40, 999);

		expect(camera.x).toBe(30);
		expect(camera.y).toBe(40);
		expect(camera.scale).toBe(ZOOM_CONSTRAINTS.MAX_SCALE);
		expect(cameraRender.needsRender).toBe(true);
		expect(cameraRender.needsGridRender).toBe(true);
	});
});
