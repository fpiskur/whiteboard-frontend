import { setCamera } from '$lib/state/cameraState.svelte';
import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';
import {
	mouseState,
	dragState,
	panState,
	clickState,
	resizeState
} from '$lib/state/interactionState.svelte';
import { notesState } from '$lib/state/notesState.svelte';

/**
 * Reset every shared rune-state singleton to its default. The state modules are
 * module-level singletons reused across tests, so call this in a `beforeEach` to
 * keep tests isolated. Note: historyState exposes no public reset (its stacks are
 * private), so tests that touch history should assert deltas rather than absolutes.
 */
export function resetAllState(): void {
	setCamera(0, 0, 1);

	selectionState.selectedIds.clear();
	selectionState.previewIds.clear();
	selectionState.box.isBoxSelecting = false;
	selectionState.box.boxStart = null;
	selectionState.box.boxEnd = null;

	keyboardState.ctrl = false;
	keyboardState.shift = false;
	keyboardState.space = false;

	mouseState.pos = { x: 0, y: 0 };
	mouseState.downPos = { x: 0, y: 0 };
	mouseState.worldPos = { x: 0, y: 0 };
	mouseState.isDown = false;

	dragState.targetId = null;
	dragState.offset = { x: 0, y: 0 };
	dragState.relativeOffsets.clear();

	panState.isDraggingCanvas = false;
	panState.dragStart = { x: 0, y: 0 };
	panState.isMiddleMouse = false;
	panState.middleMouseAnchor = { x: 0, y: 0 };

	clickState.ctrlClickTarget = null;
	clickState.clickedNoteId = null;

	resizeState.targetId = null;
	resizeState.startSize = null;
	resizeState.startPos = null;

	notesState.items = [];
	notesState.loading = false;
	notesState.error = null;
}
