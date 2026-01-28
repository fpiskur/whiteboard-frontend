import type { Note } from '$lib/types';
import type { Camera } from '$lib/state/cameraState.svelte';

interface ViewportBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

/**
 * Calculate world-space bounds of the visible viewport
 */
export function getViewportBounds(
    viewportWidth: number,
    viewportHeight: number,
    camera: Camera
): ViewportBounds {
    // Top-left corner in world space
    const minX = -camera.x / camera.scale;
    const minY = -camera.y / camera.scale;

    // Bottom-right corner in world space
    const maxX = (viewportWidth - camera.x) / camera.scale;
    const maxY = (viewportHeight - camera.y) / camera.scale;

    return { minX, maxX, minY, maxY };
}

/**
 * Check if a note intersects with viewport bounds
 */
export function isNoteVisible(note: Note, bounds: ViewportBounds, margin: number = 100): boolean {
    // Add margin to load notes slightly before they enter viewport (smoother panning)
    const noteLeft = note.pos_x - margin;
    const noteRight = note.pos_x + note.width + margin;
    const noteTop = note.pos_y - margin;
    const noteBottom = note.pos_y + note.height + margin;

    // Check if note overlaps with viewport bounds
    return !(
        noteRight < bounds.minX ||  // Note is left of viewport
        noteLeft > bounds.maxX ||   // Note is right of viewport
        noteBottom < bounds.minY || // Note is above viewport
        noteTop > bounds.maxY       // Note is below viewport
    );
}

/**
 * Filter notes to only those visible in viewport
 */
export function getVisibleNotes(
    notes: Note[],
    viewportWidth: number,
    viewportHeight: number,
    camera: Camera,
    margin?: number
): Note[] {
    const bounds = getViewportBounds(viewportWidth, viewportHeight, camera);
    return notes.filter(note => isNoteVisible(note, bounds, margin));
}
