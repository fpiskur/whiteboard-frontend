import type { Note } from '$lib/types';

/**
 * Check if a note intersects with a selection box
 * @param note - The note to check
 * @param boxStart - Selection box start in world coords
 * @param boxEnd - Selection box end in world coords
 * @returns true if note overlaps selection box
 */
export function isNoteInSelectionBox(
    note: Note,
    boxStart: { x: number; y: number},
    boxEnd: { x: number; y: number }
): boolean {
    const minX = Math.min(boxStart.x, boxEnd.x);
    const maxX = Math.max(boxStart.x, boxEnd.x);
    const minY = Math.min(boxStart.y, boxEnd.y);
    const maxY = Math.max(boxStart.y, boxEnd.y);

    const noteX = note.pos_x;
    const noteY = note.pos_y;
    const noteW = note.width;
    const noteH = note.height;

    // Check if selection box overlaps note bounds
    return (
        noteX + noteW >= minX && noteX <= maxX &&
        noteY + noteH >= minY && noteY <= maxY
    );
}

/**
 * Get all notes that intersect with a selection box
 * @param notes - Array of notes to check
 * @param boxStart - Selection box start in world coords
 * @param boxEnd - Selection box end in world coords
 * @returns Array of note IDs that intersect
 */
export function getNotesInBox(
    notes: Note[],
    boxStart: { x: number; y: number },
    boxEnd: { x: number; y: number }
): number[] {
    return notes
        .filter(note => isNoteInSelectionBox(note, boxStart, boxEnd))
        .map(note => note.id)
}
