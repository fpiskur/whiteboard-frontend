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
}

/**
 * Get the center of the viewport in world coordinates, adjusted for note dimensions
 * This positions the note so its CENTER is at viewport center, not top-left corner
 */
export function getCenteredNotePosition(
    viewportWidth: number,
    viewportHeight: number,
    noteWidth: number,
    noteHeight: number,
    camera: { x: number; y: number; scale: number }
): { x: number; y: number } {
    // Center of viewport in screen coordinates
    const screenCenterX = viewportWidth / 2;
    const screenCenterY = viewportHeight / 2;

    // Convert to world coordinates
    const worldCenter = screenToWorld(screenCenterX, screenCenterY, camera);

    // Adjust for note dimensions (position is top-left, so subtract half width/height)
    return {
        x: worldCenter.x - noteWidth / 2,
        y: worldCenter.y - noteHeight / 2
    };
}
