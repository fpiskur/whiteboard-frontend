<script lang="ts">
    import type { Note as NoteType } from '$lib/types';
    import { camera } from '$lib/state/cameraState.svelte';
    import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';
    import { mouseState, dragState, clickState, panState } from '$lib/state/interactionState.svelte';
    import { COLORS, BORDER } from '$lib/state/constants';
    import { screenToWorld } from '$lib/utils/canvas-utils';

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

    function handleMouseDown(e: MouseEvent) {
        // Exit middle mouse panning on any mouse button press
        if (panState.isMiddleMouse) {
            panState.isMiddleMouse = false;
            // If it was middle mouse button itself, just exit
            if (e.button === 1) {
                e.preventDefault();
                return;
            }
        }

        if (e.button !== 0) return;  // Only left click allowed
        if (keyboardState.space) return;  // Don't select when panning

        // Check if clicking resize handle
        const target = e.target as HTMLElement;
        if (target.closest('.resize-handle')) {
            // TODO: Handle resize in future step
            return;
        }

        e.stopPropagation();  // Prevent canvas background selection

        // Set mouse down state
        mouseState.isDown = true;

        // Capture mouse down position for all note clicks
        const rect = (e.currentTarget as HTMLElement).closest('.viewport')?.getBoundingClientRect();
        if (!rect) return;

        mouseState.downPos.x = e.clientX - rect.left;
        mouseState.downPos.y = e.clientY - rect.top;
        mouseState.pos.x = mouseState.downPos.x;
        mouseState.pos.y = mouseState.downPos.y;

        if (keyboardState.ctrl) {
            // Ctrl+click: toggle selection (don't start drag yet)
            clickState.ctrlClickTarget = note.id;
            return;
        }

        // Track if this note was already selected (for click-to-isolate)
        if (isSelected && selectionState.selectedIds.size > 1) {
            clickState.clickedNoteId = note.id;
        } else {
            clickState.clickedNoteId = null;
        }

        // If not already selected, clear selection and select this note
        if (!isSelected) {
            selectionState.selectedIds.clear();
            selectionState.selectedIds.add(note.id);
        }

        // Start drag
        const mouseWorld = screenToWorld(
            mouseState.pos.x,
            mouseState.pos.y,
            camera
        );

        dragState.targetId = note.id;
        dragState.offset = {
            x: mouseWorld.x - note.pos_x,
            y: mouseWorld.y - note.pos_y
        };

        // Store relative offsets for all selected notes (for multi-drag)
        dragState.relativeOffsets.clear();
        selectionState.selectedIds.forEach(id => {
            if (id === note.id) return;

            // Find the note in notesState
            const selectedNote = (window as any).__notes?.find((n: NoteType) => n.id === id);
            if (selectedNote) {
                dragState.relativeOffsets.set(id, {
                    x: selectedNote.pos_x - note.pos_x,
                    y: selectedNote.pos_y - note.pos_y
                });
            }
        });
    }
</script>

<!-- role, tabindex and aria-label are added for a11y compliance -->
<div
    class="note"
    class:selected={isSelected}
    role="button"
    tabindex="0"
    aria-label="Draggable note: {note.content.substring(0, 50)}"
    style="
        --tx: {note.pos_x}px;
        --ty: {note.pos_y}px;
        width: {note.width}px;
        height: {note.height}px;
        background-color: {note.bg_color};
        box-shadow: {boxShadow};
    "
    onmousedown={handleMouseDown}
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

    /* Remove focus outline for mouse/pointer interactions */
    .note:focus {
        outline: none;
    }

    /* Keep outline for keyboard navigation (accessibility) */
    .note:focus-visible {
        outline: 2px solid #007acc;
        outline-offset: 2px;
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
