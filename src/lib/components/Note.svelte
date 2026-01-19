<script lang="ts">
    import type { Note as NoteType } from '$lib/types';
    import { camera } from '$lib/state/cameraState.svelte';
    import { selectionState } from '$lib/state/selectionState.svelte';
    import { COLORS, BORDER } from '$lib/state/constants';

    let { note }: { note: NoteType } = $props();

    const isSelected = $derived(selectionState.selectedIds.has(note.id));

    // Calculate border width based on camera scale
    const borderWidthPx = $derived(
        camera.scale >= 1
            ? BORDER.BASE_PX
            : Math.max(BORDER.BASE_PX, Math.round(BORDER.TARGET_PX / camera.scale))
    );

    const shadowWidthPx = $derived(
        camera.scale >=1
            ? BORDER.BASE_SELECTED_PX
            : Math.max(BORDER.BASE_SELECTED_PX, Math.round(BORDER.TARGET_SELECTED_PX / camera.scale))
    );

    // Dynamic box-shadow based on selection state
    const boxShadow = $derived(
        isSelected
            ? `0 0 0 ${shadowWidthPx}px ${COLORS.SELECTION}, 0 2px 8px rgba(0,0,0,0.1)`
            : `0 0 0 ${borderWidthPx}px ${COLORS.NOTE_BORDER}, 0 2px 8px rgba(0,0,0,0.1)`
    );
</script>

<div
    class="note"
    class:selected={isSelected}
    style="
        --tx: {note.pos_x}px;
        --ty: {note.pos_y}px;
        width: {note.width}px;
        height: {note.height}px;
        background-color: {note.bg_color};
        box-shadow: {boxShadow};
    "
>
    <div class="note-content">{note.content}</div>
    <div class="resize-handle"></div>
</div>

<style>
    .note {
        position: absolute;
        padding: 40px;
        border-radius: 4px;
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        -webkit-user-select: none;
        transform: translate(var(--tx), var(--ty));
        will-change: transform;
    }

    .note.selected {
        background-color: #f0f8ff;
    }

    .note-content {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        pointer-events: auto;
        word-wrap: break-word;
        scrollbar-width: auto;
        scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    }

    .resize-handle {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 8px;
        height: 8px;
        cursor: nwse-resize;
        background: transparent;
        z-index: 3;
    }

    .resize-handle::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        /* Will add background-image for resize grip later */
        opacity: 0;
        transition: opacity 0.15s;
        pointer-events: none;
    }

    .note:hover .resize-handle::before {
        opacity: 1;
    }

    .note.selected .resize-handle::before {
        opacity: 1;
    }
</style>
