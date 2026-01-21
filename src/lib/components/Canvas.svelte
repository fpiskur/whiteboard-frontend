<script lang="ts">
    import { onMount } from 'svelte';
    import { camera, cameraRender } from '$lib/state/cameraState.svelte';
    import { notesState, loadNotes, batchUpdateNotesLocal } from '$lib/state/notesState.svelte';
    import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';
    import { mouseState, dragState, panState, clickState } from '$lib/state/interactionState.svelte';
    import { screenToWorld } from '$lib/utils/canvas-utils';
    import { INTERACTION } from '$lib/state/constants';
    import GridCanvas from './GridCanvas.svelte';
    import OverlayCanvas from './OverlayCanvas.svelte';
    import NotesLayer from './NotesLayer.svelte';

    let viewportEl: HTMLDivElement;

    // NOTE: Expose notes to window for drag offset calculaten (temporary solution)
    $effect(() => {
        (window as any).__notes = notesState.items;
    });

    onMount(async () => {
        await loadNotes();
    });

    // Keyboard state tracking
    function handleKeyDown(e: KeyboardEvent) {
        keyboardState.ctrl = e.ctrlKey;
        keyboardState.shift = e.shiftKey;

        if (e.key === ' ') {
            keyboardState.space = true;
        }

        if (e.key === 'Escape' && selectionState.selectedIds.size > 0) {
            selectionState.selectedIds.clear();
        }

        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            notesState.items.forEach(note => {
                selectionState.selectedIds.add(note.id);
            });
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        keyboardState.ctrl = e.ctrlKey;
        keyboardState.shift = e.shiftKey;

        if (e.key === ' ') {
            keyboardState.space = false;
        }
    }

    // Mouse state tracking
    function handleMouseDown(e: MouseEvent) {
        if (!viewportEl) return;

        mouseState.isDown = true;

        const rect = viewportEl.getBoundingClientRect();
        mouseState.pos.x = e.clientX - rect.left;
        mouseState.pos.y = e.clientY - rect.top;
        mouseState.downPos.x = mouseState.pos.x;
        mouseState.downPos.y = mouseState.pos.y;

        // Background click - prepare for box selection
        if (e.target === viewportEl && !keyboardState.space) {
            // Clear selection if no modifiers
            if (!keyboardState.ctrl && !keyboardState.shift && selectionState.selectedIds.size > 0) {
                selectionState.selectedIds.clear();
            }

            const worldPos = screenToWorld(mouseState.pos.x, mouseState.pos.y, camera);
            selectionState.box.boxStart = { x: worldPos.x, y: worldPos.y };
            selectionState.box.boxEnd = { x: worldPos.x, y: worldPos.y };
        }
    }

    function handleMouseMove(e: MouseEvent) {
        if (!viewportEl) return;

        const rect = viewportEl.getBoundingClientRect();
        mouseState.pos.x = e.clientX - rect.left;
        mouseState.pos.y = e.clientY - rect.top;

        if (!mouseState.isDown) return;

        // Update dragged notes positions
        if (dragState.targetId !== null) {
            const worldPos = screenToWorld(mouseState.pos.x, mouseState.pos.y, camera);
            mouseState.worldPos.x = worldPos.x;
            mouseState.worldPos.y = worldPos.y;

            // Update drag target
            const targetNote = notesState.items.find(n => n.id === dragState.targetId);
            if (targetNote) {
                targetNote.pos_x = worldPos.x - dragState.offset.x;
                targetNote.pos_y = worldPos.y - dragState.offset.y;

                // Update other selected notes with relative offsets
                selectionState.selectedIds.forEach(id => {
                    if (id === dragState.targetId) return;

                    const note = notesState.items.find(n => n.id === id);
                    const relOffset = dragState.relativeOffsets.get(id);

                    if (note && relOffset) {
                        note.pos_x = targetNote!.pos_x + relOffset.x;
                        note.pos_y = targetNote!.pos_y + relOffset.y;
                    }
                });
            }
        }

        // Start box selecting only when mouse moves after background click
        if (selectionState.box.boxStart && !selectionState.box.isBoxSelecting && !dragState.targetId) {
            selectionState.box.isBoxSelecting = true;
        }

        // Update selection box
        if (selectionState.box.isBoxSelecting && selectionState.box.boxStart) {
            const worldPos = screenToWorld(mouseState.pos.x, mouseState.pos.y, camera);
            selectionState.box.boxEnd = { x: worldPos.x, y: worldPos.y };
            cameraRender.needsRender = true;
        }
    }

    function handleMouseUp(_e: MouseEvent) {
        // Calculate if this was a click or drag
        const dx = mouseState.pos.x - mouseState.downPos.x;
        const dy = mouseState.pos.y - mouseState.downPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const wasClick = distance < INTERACTION.CLICK_THRESHOLD;

        // Handle Ctrl+click toggle
        if (clickState.ctrlClickTarget !== null && keyboardState.ctrl && wasClick) {
            if (selectionState.selectedIds.has(clickState.ctrlClickTarget)) {
                selectionState.selectedIds.delete(clickState.ctrlClickTarget);
            } else {
                selectionState.selectedIds.add(clickState.ctrlClickTarget);
            }
            clickState.ctrlClickTarget = null;
        }

        // Handle click-to-isolate (click on already selected note in multi-selection)
        if (wasClick && clickState.clickedNoteId !== null && selectionState.selectedIds.size > 1) {
            selectionState.selectedIds.clear();
            selectionState.selectedIds.add(clickState.clickedNoteId);
        }

        // End drag - sync positions to backend
        if (dragState.targetId !== null && !wasClick) {
            // Update all dragged notes in backend
            const updates = Array.from(selectionState.selectedIds).map(id => {
                const note = notesState.items.find(n => n.id === id);
                return {
                    id,
                    data: { pos_x: note!.pos_x, pos_y: note!.pos_y }
                };
            });

            batchUpdateNotesLocal(updates).catch(err =>
                console.error('Failed to update note positions: ', err)
            );
        }

        // End box selection
        if (selectionState.box.isBoxSelecting) {
            // TODO: Select notes in box (next step)
            selectionState.box.isBoxSelecting = false;
            cameraRender.needsRender = true;
        }

        // Cleanup
        mouseState.isDown = false;
        dragState.targetId = null;
        dragState.relativeOffsets.clear();
        clickState.clickedNoteId = null;
        clickState.ctrlClickTarget = null;
    }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<!-- role, tabindex and aria-label are added for a11y compliance -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class="viewport"
    bind:this={viewportEl}
    role="application"
    tabindex="0"
    aria-label="Interactive canvas workspace"
    class:space-drag={keyboardState.space}
    class:middle-mouse-pan={panState.isMiddleMouse}
    class:box-selecting={selectionState.box.isBoxSelecting}
    onmousedown={handleMouseDown}
>
    <GridCanvas />
    <OverlayCanvas />
    <NotesLayer />
</div>

<style>
    .viewport {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #f5f5f5;
    }

    .viewport.space-drag {
        cursor: grab !important;
    }

    .viewport.space-drag:active {
        cursor: grabbing !important;
    }

    .viewport.space-drag :global(.note) {
        cursor: grab !important;
    }

    .viewport.space-drag:active :global(.note) {
        cursor: grabbing !important;
    }

    .viewport.space-drag :global(.resize-handle) {
        cursor: grab !important;
    }

    .viewport.space-drag:active :global(.resize-handle) {
        cursor: grabbing !important;
    }

    .viewport.middle-mouse-pan :global(.note) {
        cursor: all-scroll !important;
    }

    .viewport.box-selecting {
        cursor: crosshair !important;
    }

    .viewport.box-selecting :global(.note) {
        cursor: crosshair !important;
    }

    .viewport.box-selecting :global(.note) :global(*) {
        cursor: crosshair !important;
    }

    .viewport.box-selecting :global(.resize-handle) {
        cursor: crosshair !important;
    }
</style>
