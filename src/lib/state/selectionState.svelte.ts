import { SvelteSet } from 'svelte/reactivity';

export type SelectionBox = {
    isBoxSelecting: boolean;
    boxStart: { x: number; y: number } | null;
    boxEnd: { x: number; y: number } | null;
};

export type SelectionState = {
    selectedIds: SvelteSet<number>;
    box: SelectionBox;
    previewIds: SvelteSet<number>;
};

export const selectionState = $state<SelectionState>({
    selectedIds: new SvelteSet(),
    box: {
        isBoxSelecting: false,
        boxStart: null,
        boxEnd: null
    },
    previewIds: new SvelteSet()
});

export type KeyboardState = {
    ctrl: boolean;
    shift: boolean;
    space: boolean;
};

export const keyboardState = $state<KeyboardState>({
    ctrl: false,
    shift: false,
    space: false
});
