import { GRID } from '$lib/state/constants';

/**
 * Calculate grid size based on camera scale
 * @param scale - Current camera scale
 * @returns Grid size in world units
 */
export function getGridSize(scale: number): number {
    let gridSize = GRID.BASE_SIZE;

    for (let i = 0; i < GRID.ZOOM_LEVELS.length; i++) {
        if (scale <= GRID.ZOOM_LEVELS[i]) {
            gridSize = GRID.SIZES[i];
            break;
        }
    }

    return gridSize;
}

/**
 * Calculate grid offset for seamless panning
 * @param cameraOffset - Camera x or y offset
 * @param screenGridSize - Grid size in screen pixels
 * @returns Offset for drawing grid lines
 */
export function getGridOffset(cameraOffset: number, screenGridSize: number): number {
    return (cameraOffset % screenGridSize + screenGridSize) % screenGridSize;
}
