import type { MouseState } from '$lib/state/interactionState.svelte';

/**
 * Get viewport bounding rect from any element inside it
 */
export function getViewportRect(element: HTMLElement): DOMRect | null {
    const viewport = element.closest('.viewport');
    return viewport?.getBoundingClientRect() ?? null;
}

/**
 * Update mouse down position (sets both pos and downPos)
 */
export function setMouseDownPosition(
    e: MouseEvent,
    mouseState: MouseState,
    viewportRect: DOMRect
): void {
    const x = e.clientX - viewportRect.left;
    const y = e.clientY - viewportRect.top;
    mouseState.pos.x = x;
    mouseState.pos.y = y;
    mouseState.downPos.x = x;
    mouseState.downPos.y = y;
}

/**
 * Update mouse position during move (only updates pos, not downPos)
 */
export function setMousePosition(
    e: MouseEvent,
    mouseState: MouseState,
    viewportRect: DOMRect
): void {
    mouseState.pos.x = e.clientX - viewportRect.left;
    mouseState.pos.y = e.clientY - viewportRect.top;
}
