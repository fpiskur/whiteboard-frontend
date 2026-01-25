<script lang="ts">
    import type { Note as NoteType } from '$lib/types';
    import { camera } from '$lib/state/cameraState.svelte';
    import { notesState } from '$lib/state/notesState.svelte';
    import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';
    import { mouseState, dragState, clickState, panState } from '$lib/state/interactionState.svelte';
    import { COLORS, BORDER, INTERACTION, RESIZE_HANDLE } from '$lib/state/constants';
    import { screenToWorld } from '$lib/utils/canvas-utils';
    import { getViewportRect, setMouseDownPosition } from '$lib/utils/viewport-utils';

    interface Props {
        note: NoteType;
        scale: number;
        onEdit?: (noteId: number) => void;
        onResizeStart: (noteId: number, e: MouseEvent) => void;
        isResizing: boolean;
    }

    let { note, scale, onEdit, onResizeStart, isResizing }: Props = $props();

    const isSelected = $derived(selectionState.selectedIds.has(note.id));

    // Determine if resize handle should be large
    const isLargeHandle = $derived(scale < RESIZE_HANDLE.SCALE_BREAKPOINT);

    // Track local mousedown position for drag detection
    let localMouseDownPos = $state({ x: 0, y: 0 });

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

        // Get viewport rect and update mouse state
        const rect = getViewportRect(e.currentTarget as HTMLElement);
        if (!rect) return;

        // Set mouse down state
        mouseState.isDown = true;
        setMouseDownPosition(e, mouseState, rect);

        // Store local mousedown position for double-click drag detecion
        localMouseDownPos.x = mouseState.pos.x;
        localMouseDownPos.y = mouseState.pos.y;

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
        const mouseWorld = screenToWorld(mouseState.pos.x, mouseState.pos.y, camera);

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
            const selectedNote = notesState.items.find((n: NoteType) => n.id === id);
            if (selectedNote) {
                dragState.relativeOffsets.set(id, {
                    x: selectedNote.pos_x - note.pos_x,
                    y: selectedNote.pos_y - note.pos_y
                });
            }
        });
    }

    function handleDoubleClick(e: MouseEvent) {
        e.stopPropagation();

        // Don't trigger edit when clicking resize handle
        const target = e.target as HTMLElement;
        if (target.closest('.resize-handle')) return;

        // Check if this was actually a drag (not a clean double-click)
        const dx = mouseState.pos.x - localMouseDownPos.x;
        const dy = mouseState.pos.y - localMouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Only trigger edit callback if no significant movement (wasn't a drag)
        if (distance < INTERACTION.CLICK_THRESHOLD) {
            onEdit?.(note.id);
        }
    }

    function handleResizeMouseDown(e: MouseEvent) {
        e.stopPropagation();  // Prevent drag start
        onResizeStart(note.id, e);
    }
</script>

<!-- role, tabindex and aria-label are added for a11y compliance -->
<div
    class="note"
    class:selected={isSelected}
    class:resizing={isResizing}
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
    ondblclick={handleDoubleClick}
>
    <div class="note-content">{note.content}</div>
    <div
        class="resize-handle"
        class:large={isLargeHandle}
        onmousedown={handleResizeMouseDown}
        role="button"
        tabindex="-1"
        aria-label="Resize note"
    ></div>
</div>

<style>
    .note {
        position: absolute;
        padding: var(--spacing-xl);
        border-radius: var(--radius-sm);
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
        outline: 2px solid var(--color-primary);
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

    /* Visual indicator extends beyond the clickable area */
    .resize-handle::before {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        background-image: url('/images/resize-grip-small-gray.svg');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: bottom right;
        opacity: 0;
        transition: opacity 0.15s;
        pointer-events: none;
    }

    /* Large handle variant */
    .resize-handle.large::before {
        width: 16px;
        height: 16px;
        background-image: url('/images/resize-grip-large-gray.svg');
    }

    .note:hover .resize-handle::before {
        opacity: 1;
    }

    .note.selected .resize-handle::before {
        opacity: 1;
    }
</style>
