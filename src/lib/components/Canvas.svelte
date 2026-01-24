<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { camera, cameraRender, clampScale } from '$lib/state/cameraState.svelte';
    import { notesState, loadNotes, batchUpdateNotesLocal, createNoteLocal, updateNoteLocal, deleteNotesLocal } from '$lib/state/notesState.svelte';
    import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';
    import { mouseState, dragState, panState, clickState } from '$lib/state/interactionState.svelte';
    import { screenToWorld, getCenteredNotePosition } from '$lib/utils/canvas-utils';
    import { setMouseDownPosition, setMousePosition } from '$lib/utils/viewport-utils';
    import { getNotesInBox } from '$lib/utils/collision-utils';
    import { INTERACTION, NOTE_SIZE } from '$lib/state/constants';
    import GridCanvas from './GridCanvas.svelte';
    import OverlayCanvas from './OverlayCanvas.svelte';
    import NotesLayer from './NotesLayer.svelte';
    import CreateNoteFAB from './CreateNoteFAB.svelte';
    import NoteFormModal from './NoteFormModal.svelte';
    import ConfirmModal from './ConfirmModal.svelte';
    import type { Note } from '$lib/types';

    let viewportEl: HTMLDivElement;
    let animationFrameId: number | null = null;
    let isModalOpen = $state(false);
    let editingNote = $state<Note | null>(null);
    let showDeleteConfirm = $state(false);
    let notesToDelete = $state<number[]>([]);

    onMount(async () => {
        await loadNotes();
    });

    // ===== RENDER LOOP (Hybrid Approach) =====
    function updateMiddleMousePan() {
        if(!panState.isMiddleMouse) return;

        // Calculate distance and direction from anchor to current mouse
        const dx = mouseState.pos.x - panState.middleMouseAnchor.x;
        const dy = mouseState.pos.y - panState.middleMouseAnchor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Dead zone - don't pan if too close to anchor
        if (distance < INTERACTION.MIDDLE_MOUSE.DEAD_ZONE) return;

        // Calculate speed based on distance (clamped to max distance)
        const clampedDistance = Math.min(distance, INTERACTION.MIDDLE_MOUSE.MAX_DISTANCE);
        const speedFactor = clampedDistance / INTERACTION.MIDDLE_MOUSE.MAX_DISTANCE;
        const speed = speedFactor * INTERACTION.MIDDLE_MOUSE.MAX_SPEED;

        // Normalize direction and apply speed
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Pan camera in mouse direction
        camera.x -= dirX * speed;
        camera.y -= dirY * speed;

        cameraRender.needsRender = true;
        cameraRender.needsGridRender = true;
    }

    function renderLoop() {
        let needsContinue = false;

        // Continuous aniumations that need RAF
        if (panState.isMiddleMouse) {
            updateMiddleMousePan();
            needsContinue = true;
        }

        // TODO: Add auto-pan during drag here later

        if (needsContinue) {
            animationFrameId = requestAnimationFrame(renderLoop);
        } else {
            animationFrameId = null;
        }
    }

    function startRenderLoop() {
        if (animationFrameId === null) {
            animationFrameId = requestAnimationFrame(renderLoop);
        }
    }
    // ===== /RENDER LOOP =====

    let zoomTimeout: number | null = null;
    function handleWheel(e: WheelEvent) {
        if (!e.ctrlKey) return;
        e.preventDefault();

        // Get cursor position in world coordinates before zoom
        const pos = screenToWorld(e.clientX, e.clientY, camera);

        // Zoom factor: 0.9 for zoom out, 1.1 for zoom in
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = clampScale(camera.scale * factor);

        // Update camera to zoom toward cursor position
        camera.scale = newScale;
        camera.x = e.clientX - (pos.x * camera.scale);
        camera.y = e.clientY - (pos.y * camera.scale);

        cameraRender.needsRender = true;
        cameraRender.needsGridRender = true;

        // Chrome blurring fix
        if (zoomTimeout !== null) clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
            if (viewportEl) {
                viewportEl.style.display = 'none';
                void viewportEl.offsetHeight;  // Force reflow
                viewportEl.style.display = 'block';
            }
        }, 200) as unknown as number;
    }

    // Keyboard state tracking
    function handleKeyDown(e: KeyboardEvent) {
        keyboardState.ctrl = e.ctrlKey;
        keyboardState.shift = e.shiftKey;

        if (e.key === ' ') {
            keyboardState.space = true;
            // Remove focus from focused note element when Space is pressed
            // (this is to prevent Chrome from showing an outline over focused note on Space key)
            const activeEl = document.activeElement;
            if (activeEl instanceof HTMLElement) {
                const isNote = activeEl.classList.contains('note') || activeEl.closest('.note') !== null;

                if (isNote) {
                    activeEl.blur();
                }
            }
        }

        // Clear selection if no modals opened
        if (e.key === 'Escape' && !isModalOpen && !showDeleteConfirm && selectionState.selectedIds.size > 0) {
            selectionState.selectedIds.clear();
        }

        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            notesState.items.forEach(note => {
                selectionState.selectedIds.add(note.id);
            });
        }

        if (e.key === 'Delete' && selectionState.selectedIds.size > 0) {
            e.preventDefault();
            notesToDelete = Array.from(selectionState.selectedIds);
            showDeleteConfirm = true;
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

        const rect = viewportEl.getBoundingClientRect();

        // Exit middle mouse panning on any mouse button press
        if (panState.isMiddleMouse) {
            panState.isMiddleMouse = false;
            // If it was middle button itself, prevent default and return
            if (e.button === 1) {
                e.preventDefault();
                return;
            }
        }

        // Middle mouse button - start joystick-style panning
        if (e.button === 1) {
            e.preventDefault();
            panState.isMiddleMouse = true;
            panState.middleMouseAnchor.x = e.clientX - rect.left;
            panState.middleMouseAnchor.y = e.clientY - rect.top;
            startRenderLoop();
            return;
        }

        mouseState.isDown = true;
        setMouseDownPosition(e, mouseState, rect);

        // Space+drag panning - handle before other interactions
        if (keyboardState.space) {
            panState.isDraggingCanvas = true;
            panState.dragStart.x = e.clientX - camera.x;
            panState.dragStart.y = e.clientY - camera.y;
            return;  // Don't handle box selection
        }

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
        setMousePosition(e, mouseState, rect);

        // Handle Space+drag panning
        if (keyboardState.space && panState.isDraggingCanvas) {
            camera.x = e.clientX - panState.dragStart.x;
            camera.y = e.clientY - panState.dragStart.y;

            cameraRender.needsRender = true;
            cameraRender.needsGridRender = true;
            return;
        }

        if (!mouseState.isDown) return;

        // Handle active panning without space key held
        if (panState.isDraggingCanvas && !keyboardState.space) {
            panState.isDraggingCanvas = false;
        }

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

        // End box selection - select notes in box
        if (selectionState.box.isBoxSelecting) {
            selectNotesInBox();
            selectionState.box.isBoxSelecting = false;
            selectionState.box.boxStart = null;
            selectionState.box.boxEnd = null;
            cameraRender.needsRender = true;
        }

        // End panning
        if (panState.isDraggingCanvas) {
            panState.isDraggingCanvas = false;
        }

        // Cleanup
        mouseState.isDown = false;
        dragState.targetId = null;
        dragState.relativeOffsets.clear();
        clickState.clickedNoteId = null;
        clickState.ctrlClickTarget = null;
    }

    // Select notes inside a box
    function selectNotesInBox(): void {
        if (!selectionState.box.boxStart || !selectionState.box.boxEnd) return;

        const notesInBox = getNotesInBox(
            notesState.items,
            selectionState.box.boxStart,
            selectionState.box.boxEnd
        );

        // Handle modifier keys
        if (keyboardState.ctrl) {
            // Ctrl: Add to selection
            notesInBox.forEach(id => selectionState.selectedIds.add(id));
        } else if (keyboardState.shift) {
            // Shift: Remove from selection (subtractive)
            notesInBox.forEach(id => selectionState.selectedIds.delete(id));
        } else {
            // No modifier: Replace selection
            selectionState.selectedIds.clear();
            notesInBox.forEach(id => selectionState.selectedIds.add(id));
        }
    }

    async function handleSubmitNote(content: string, noteId?: number): Promise<void> {
        try {
            if (noteId !== undefined) {
                // Edit existing note
                await updateNoteLocal(noteId, { content });
            } else {
                // Create new note
                if (!viewportEl) return;

                const rect = viewportEl.getBoundingClientRect();
                const noteWidth = NOTE_SIZE.DEFAULT_WIDTH;
                const noteHeight = NOTE_SIZE.DEFAULT_HEIGHT;

                // Calculate precise center position
                const position = getCenteredNotePosition(
                    rect.width,
                    rect.height,
                    noteWidth,
                    noteHeight,
                    camera
                );

                await createNoteLocal({
                    content,
                    pos_x: position.x,
                    pos_y: position.y,
                    width: noteWidth,
                    height: noteHeight,
                    bg_color: '#fff'
                });
            }
        } catch (err) {
            console.error('Failed to save note: ', err);
            // TODO: Show error message to user (Step 19)
        }
    }

    function handleEditNote(noteId: number): void {
        const note = notesState.items.find(n => n.id === noteId);
        if (note) {
            editingNote = note;
            isModalOpen = true;
        }
    }

    async function handleConfirmDelete(): Promise<void> {
        try {
            await deleteNotesLocal(notesToDelete);
            selectionState.selectedIds.clear();
            notesToDelete = [];
        } catch (error) {
            console.error('Failed to delete notes: ', error);
            // TODO: Show error toast (Step 19)
        }
    }

    function handleCancelDelete(): void {
        notesToDelete = [];
    }

    // Cleanup RAF on component unmount
    onDestroy(() => {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    })
</script>

<svelte:window
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:wheel|nonpassive={handleWheel}
/>

<!-- role, tabindex and aria-label are added for a11y compliance -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class="viewport"
    bind:this={viewportEl}
    role="application"
    tabindex="0"
    aria-label="Interactive canvas workspace"
    class:space-drag={keyboardState.space && !dragState.targetId && !selectionState.box.isBoxSelecting}
    class:middle-mouse-pan={panState.isMiddleMouse}
    class:box-selecting={selectionState.box.isBoxSelecting}
    onmousedown={handleMouseDown}
>
    <GridCanvas />
    <NotesLayer onEditNote={handleEditNote} />
    <OverlayCanvas />
</div>

<!-- FAB and Modal -->
<CreateNoteFAB onclick={() => isModalOpen = true} />
<NoteFormModal bind:isOpen={isModalOpen} bind:editNote={editingNote} onSubmit={handleSubmitNote} />
<ConfirmModal
    bind:isOpen={showDeleteConfirm}
    title="Delete {notesToDelete.length === 1 ? 'Note' : 'Notes'}"
    message={notesToDelete.length === 1
        ? 'Are you sure you want to delete this note? This action cannot be undone.'
        : `Are you sure you want to delete ${notesToDelete.length} notes? This action cannot be undone.`}
    confirmText="Delete"
    variant="danger"
    onConfirm={handleConfirmDelete}
    onCancel={handleCancelDelete}
/>

<style>
    .viewport {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: var(--color-background);
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

    .viewport.middle-mouse-pan {
        cursor: all-scroll !important;
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
