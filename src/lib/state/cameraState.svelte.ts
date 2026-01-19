import { ZOOM_CONSTRAINTS } from '$lib/state/constants';

export type Camera = {
    x: number;
    y: number;
    scale: number;
};

export type CameraRenderFlags = {
    needsRender: boolean;
    needsGridRender: boolean;
    //needsBorderUpdate: boolean; // Perplexity suggested I can remove this because Svelte will re-render components when their reactive state changes
    isLoopActive: boolean;
};

export const camera = $state<Camera>({
    x: 0,
    y: 0,
    scale: 1
});

export const cameraRender = $state<CameraRenderFlags>({
    needsRender: true,
    needsGridRender: true,
    //needsBorderUpdate: true,
    isLoopActive: false
});

// Helpers
export function clampScale(newScale: number) {
    return Math.max(ZOOM_CONSTRAINTS.MIN_SCALE, Math.min(ZOOM_CONSTRAINTS.MAX_SCALE, newScale));
}

export function setCamera(x: number, y: number, scale: number) {
    camera.x = x;
    camera.y = y;
    camera.scale = clampScale(scale);
    cameraRender.needsRender = true;
    cameraRender.needsGridRender = true;
    //cameraRender.needsBorderUpdate = true;
}
