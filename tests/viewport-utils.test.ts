import { describe, expect, it } from 'vitest';
import { setMouseDownPosition, setMousePosition } from '$lib/utils/viewport-utils';
import type { MouseState } from '$lib/state/interactionState.svelte';

const freshMouseState = (): MouseState => ({
	pos: { x: 0, y: 0 },
	downPos: { x: 0, y: 0 },
	worldPos: { x: 0, y: 0 },
	isDown: false
});

// A fake DOMRect is enough — the helpers only read left/top.
const rect = { left: 30, top: 20 } as DOMRect;

describe('setMouseDownPosition', () => {
	it('sets both pos and downPos relative to the viewport rect', () => {
		const state = freshMouseState();
		setMouseDownPosition({ clientX: 130, clientY: 120 } as MouseEvent, state, rect);

		expect(state.pos).toEqual({ x: 100, y: 100 });
		expect(state.downPos).toEqual({ x: 100, y: 100 });
	});
});

describe('setMousePosition', () => {
	it('updates pos but leaves downPos untouched', () => {
		const state = freshMouseState();
		state.downPos = { x: 5, y: 5 };

		setMousePosition({ clientX: 80, clientY: 70 } as MouseEvent, state, rect);

		expect(state.pos).toEqual({ x: 50, y: 50 });
		expect(state.downPos).toEqual({ x: 5, y: 5 });
	});
});
