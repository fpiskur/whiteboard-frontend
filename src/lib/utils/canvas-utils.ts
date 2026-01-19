import type { Camera } from '$lib/state/cameraState.svelte';

/**
 * Convert screen coordinates to world coordinates
 * @param screenX - Mouse X relative to viewport
 * @param screenY - Mouse Y relative to viewport
 * @param camera - Current camera state
 * @returns World coordinates { x, y }
 */
export function screenToWorld(
    screenX: number,
    screenY: number,
    camera: Camera
): { x: number; y: number } {
    return {
        x: (screenX - camera.x) / camera.scale,
        y: (screenY - camera.y) / camera.scale
    };
    //NOTE: The original calculation was done like this in the vanilla version:
    //  const rect = viewport.getBoundingClientRect();
    //  return {
    //    x: (screenX - rect.left - state.camera.x) / state.camera.scale,
    //    y: (screenY - rect.top - state.camera.y) / state.camera.scale
    //  };
    //The reasoning behind including 'rect' is that the 'viewport' element might be offset by the sidebar
    //so this will have to be added if the sidebar that is present in the document flow is introduced
}

/**
 * Convert world coordinates to screen coordinates
 * @param worldX - X position in world space
 * @param worldY - Y position in world space
 * @param camera - Current camera state
 * @returns Screen coordinates { x, y }
 */
export function worldToScreen(
    worldX: number,
    worldY: number,
    camera: Camera
): { x: number, y: number } {
    return {
        x: worldX * camera.scale + camera.x,
        y: worldY * camera.scale + camera.y
    };
    // NOTE: See the comment at the bottom of screenToWorld function and adjust accordingly
    // x: worldX * camera.scale + camera.x + rect.left,
    // y: worldY * camera.scale + camera.y + rect.top
}
