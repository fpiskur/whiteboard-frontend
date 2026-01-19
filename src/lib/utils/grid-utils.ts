const GRID_CONSTANTS = {
    BASE_SIZE: 20,
    ZOOM_LEVELS: [0.125, 0.25, 0.5, 1, 2, 4, 8, 16],
    SIZES: [160, 80, 40, 20, 20, 20, 10, 5]
};

/**
 * Calculate grid size based on camera scale
 * @param scale - Current camera scale
 * @returns Grid size in world units
 */
export function getGridSize(scale: number): number {
    let gridSize = GRID_CONSTANTS.BASE_SIZE;

    for (let i = 0; i < GRID_CONSTANTS.ZOOM_LEVELS.length; i++) {
        if (scale <= GRID_CONSTANTS.ZOOM_LEVELS[i]) {
            gridSize = GRID_CONSTANTS.SIZES[i];
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
