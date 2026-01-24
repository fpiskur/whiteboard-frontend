import { SvelteMap } from 'svelte/reactivity';

export type MouseState = {
    pos: { x: number; y: number };
    downPos: { x: number; y: number };
    worldPos: { x: number; y: number };
    isDown: boolean;
};

export type DragState = {
    targetId: number | null;
    offset: { x: number; y: number };
    relativeOffsets: SvelteMap<number, { x: number; y: number }>;  // For nulti-note drag
};

export type PanState = {
    isDraggingCanvas: boolean;
    dragStart: { x: number; y: number };
    isMiddleMouse: boolean;
    middleMouseAnchor: { x: number; y: number };
};

export type ClickState = {
    ctrlClickTarget: number | null;
    clickedNoteId: number | null;  // For click-to-isolate behavior
};

export type ResizeState = {
    targetId: number | null;
    startSize: { width: number; height: number } | null;
    startPos: { x: number; y: number } | null;
};

export const mouseState = $state<MouseState>({
    pos: { x: 0, y: 0 },
    downPos: { x: 0, y: 0 },
    worldPos: { x: 0, y: 0 },
    isDown: false
});

export const dragState = $state<DragState>({
    targetId: null,
    offset: { x: 0, y: 0 },
    relativeOffsets: new SvelteMap()
});

export const panState = $state<PanState>({
    isDraggingCanvas: false,
    dragStart: { x: 0, y: 0 },
    isMiddleMouse: false,
    middleMouseAnchor: { x: 0, y: 0 }
});

export const clickState = $state<ClickState>({
    ctrlClickTarget: null,
    clickedNoteId: null
});

export const resizeState = $state<ResizeState>({
    targetId: null,
    startSize: null,
    startPos: null
});
