import { beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import NoteHarness from './fixtures/NoteHarness.svelte';
import { camera, setCamera } from '$lib/state/cameraState.svelte';
import { dragState, mouseState, panState } from '$lib/state/interactionState.svelte';
import { keyboardState, selectionState } from '$lib/state/selectionState.svelte';
import type { Note } from '$lib/types';

// Kept small and near the origin so that even at 2x zoom the note's on-screen
// centre stays inside the test iframe's viewport and remains clickable.
const note: Note = {
	id: 7,
	pos_x: 20,
	pos_y: 20,
	width: 100,
	height: 80,
	content: 'Buy milk',
	color_index: 'yellow'
};

// The rune state modules are singletons shared across every test in this file.
beforeEach(() => {
	setCamera(0, 0, 1);
	selectionState.selectedIds.clear();
	selectionState.previewIds.clear();
	selectionState.box.isBoxSelecting = false;
	keyboardState.ctrl = false;
	keyboardState.space = false;
	panState.isMiddleMouse = false;
	dragState.targetId = null;
	dragState.offset = { x: 0, y: 0 };
	dragState.relativeOffsets.clear();
	mouseState.isDown = false;
});

describe('Note', () => {
	it('lays out at its world position with its real size', async () => {
		render(NoteHarness, { note });

		const element = page.getByRole('button', { name: /Draggable note/ });
		await expect.element(element).toBeVisible();

		// Real layout: jsdom would report all zeroes here.
		const rect = (await element.element()).getBoundingClientRect();
		expect(rect.width).toBe(note.width);
		expect(rect.height).toBe(note.height);
		expect(rect.left).toBe(note.pos_x);
		expect(rect.top).toBe(note.pos_y);
	});

	it('selects the note and arms a drag on mousedown', async () => {
		render(NoteHarness, { note });

		const element = page.getByRole('button', { name: /Draggable note/ });
		await element.click();

		expect([...selectionState.selectedIds]).toEqual([note.id]);
		expect(mouseState.isDown).toBe(true);
		expect(dragState.targetId).toBe(note.id);

		// Clicking the centre of the note means the grab offset is half its size.
		// A real browser click can land a pixel off centre, so allow 1px of slack.
		expect(Math.abs(dragState.offset.x - note.width / 2)).toBeLessThanOrEqual(1);
		expect(Math.abs(dragState.offset.y - note.height / 2)).toBeLessThanOrEqual(1);
	});

	it('keeps the grab offset in world units while zoomed in', async () => {
		setCamera(0, 0, 2);
		render(NoteHarness, { note });

		await page.getByRole('button', { name: /Draggable note/ }).click();

		expect(camera.scale).toBe(2);
		expect(dragState.targetId).toBe(note.id);

		// The offset is stored in world units, so it is independent of zoom: still
		// half the note's (unscaled) size even though the note is drawn twice as big.
		// The click point is halved by the 2x scale, so allow 1px (0.5 world unit) of slack.
		expect(Math.abs(dragState.offset.x - note.width / 2)).toBeLessThanOrEqual(1);
		expect(Math.abs(dragState.offset.y - note.height / 2)).toBeLessThanOrEqual(1);
	});

	it('does not select while the space bar is held for panning', async () => {
		keyboardState.space = true;
		render(NoteHarness, { note });

		await page.getByRole('button', { name: /Draggable note/ }).click();

		expect(selectionState.selectedIds.size).toBe(0);
		expect(dragState.targetId).toBeNull();
	});
});
