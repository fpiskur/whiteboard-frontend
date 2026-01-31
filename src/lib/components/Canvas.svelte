<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { camera, cameraRender, clampScale } from '$lib/state/cameraState.svelte';
    import { notesState, loadNotes, batchUpdateNotesLocal, createNoteLocal, updateNoteLocal, deleteNotesLocal } from '$lib/state/notesState.svelte';
    import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';
    import { mouseState, dragState, panState, clickState, resizeState } from '$lib/state/interactionState.svelte';
    import { historyState } from '$lib/state/historyState.svelte';
    import { screenToWorld, getCenteredNotePosition } from '$lib/utils/canvas-utils';
    import { setMouseDownPosition, setMousePosition } from '$lib/utils/viewport-utils';
    import { getNotesInBox } from '$lib/utils/collision-utils';
    import { primaryModifierKey, primaryModifierFlag } from '$lib/utils/keyboard-utils';
    import { AUTO_PAN, INTERACTION, NOTE_SIZE } from '$lib/state/constants';
    import GridCanvas from './GridCanvas.svelte';
    import OverlayCanvas from './OverlayCanvas.svelte';
    import NotesLayer from './NotesLayer.svelte';
    import CreateNoteFAB from './CreateNoteFAB.svelte';
    import NoteFormModal from './NoteFormModal.svelte';
    import ConfirmModal from './ConfirmModal.svelte';
    import Spinner from './Spinner.svelte';
    import type { Note } from '$lib/types';

    // NOTE: Temporary leak detection (Chrome only)
    // ######################################
    //let leakDetector = $state({
    //    rafCount: 0,
    //    eventListenerCount: 0,
    //    noteCount: 0,
    //    historySize: 0
    //});
    //
    //$effect(() => {
    //    const interval = setInterval(() => {
    //        leakDetector.rafCount = animationFrameId !== null ? 1 : 0;
    //        leakDetector.noteCount = notesState.items.length;
    //        leakDetector.historySize = historyState.undoStackSize + historyState.redoStackSize;
    //
    //        const memory = (performance as any).memory;
    //        const heapSize = memory ? (memory.usedJSHeapSize / 1048576).toFixed(2) : 'N/A';
    //
    //        console.log('🔍 Leak Check:', {
    //            RAF_Active: leakDetector.rafCount,
    //            Notes: leakDetector.noteCount,
    //            History: leakDetector.historySize,
    //            Heap: heapSize + ' MB'
    //        });
    //    }, 5000); // Log every 5 seconds
    //
    //    return () => clearInterval(interval);
    //});
    // ######################################

    let viewportEl = $state<HTMLDivElement | undefined>(undefined);
    let animationFrameId: number | null = null;
    let isModalOpen = $state(false);
    let editingNote = $state<Note | null>(null);
    let showDeleteConfirm = $state(false);
    let notesToDelete = $state<number[]>([]);

    let isSubmittingNote = $state(false);
    let isDeletingNotes = $state(false);

    // State for undo/redo
    let dragStartPositions = new Map<number, { x: number; y: number }>();

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

    function autoPanCamera() {
        if (!mouseState.isDown) return;

        // Only auto-pan during note drag, box selection
        if (!(dragState.targetId !== null && selectionState.selectedIds.size > 0) &&
            !selectionState.box.isBoxSelecting &&
            resizeState.targetId === null) return;

        if (!viewportEl) return;
        const rect = viewportEl.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        let dx = 0;
        let dy = 0;

        // Horizontal edge detection
        if (mouseState.pos.x <= AUTO_PAN.EDGE_SIZE) {
            const t = Math.max(0, Math.min(1, 1 - mouseState.pos.x / AUTO_PAN.EDGE_SIZE));
            const speed = AUTO_PAN.MIN_SPEED + t * (AUTO_PAN.MAX_SPEED - AUTO_PAN.MIN_SPEED);
            dx = speed;  // Move camera right (world left)
        } else if (mouseState.pos.x >= width - AUTO_PAN.EDGE_SIZE) {
            const t = Math.max(0, Math.min(1, 1 - (width - mouseState.pos.x) / AUTO_PAN.EDGE_SIZE));
            const speed = AUTO_PAN.MIN_SPEED + t * (AUTO_PAN.MAX_SPEED - AUTO_PAN.MIN_SPEED);
            dx = -speed;  // Move camera left (world right)
        }

        // Vertical edge detection
        if (mouseState.pos.y <= AUTO_PAN.EDGE_SIZE) {
            const t = Math.max(0, Math.min(1, 1 - mouseState.pos.y / AUTO_PAN.EDGE_SIZE));
            const speed = AUTO_PAN.MIN_SPEED + t * (AUTO_PAN.MAX_SPEED - AUTO_PAN.MIN_SPEED);
            dy = speed;  // Move camera down (world up)
        } else if (mouseState.pos.y >= height - AUTO_PAN.EDGE_SIZE) {
            const t = Math.max(0, Math.min(1, 1 - (height - mouseState.pos.y) / AUTO_PAN.EDGE_SIZE));
            const speed = AUTO_PAN.MIN_SPEED + t * (AUTO_PAN.MAX_SPEED - AUTO_PAN.MIN_SPEED);
            dy = -speed;  // Move camera up (world down)
        }

        if (dx !== 0 || dy !== 0) {
            camera.x += dx;
            camera.y += dy;
            cameraRender.needsRender = true;
            cameraRender.needsGridRender = true;
        }
    }

    // Update note positions while auto-panning
    function updateDraggedNotes() {
        if (dragState.targetId === null) return;

        // Convert current screen mouse position to world coordinates (runs every frame!)
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

    // Update selection box while auto-panning
    function updateSelectionBox() {
        if (!selectionState.box.isBoxSelecting) return;

        // Convert current screen mouse position to world coordinates (runs every frame!)
        const worldPos = screenToWorld(mouseState.pos.x, mouseState.pos.y, camera);
        selectionState.box.boxEnd = { x: worldPos.x, y: worldPos.y };
        cameraRender.needsRender = true;
    }

    function renderLoop() {
        let needsContinue = false;

        // Continuous aniumations that need RAF
        if (panState.isMiddleMouse) {
            updateMiddleMousePan();
            needsContinue = true;
        }

        // Add auto-pan during drag/box-select
        if (mouseState.isDown && (
            (dragState.targetId !== null && selectionState.selectedIds.size > 0) ||
            selectionState.box.isBoxSelecting
        )) {
            autoPanCamera();
            needsContinue = true;
        }

        // Update dragged notes position every frame (needed for auto-pan)
        if (dragState.targetId !== null) {
            updateDraggedNotes();
            needsContinue = true;
        }

        // Update selection box every frame (needed for auto-pan)
        if (selectionState.box.isBoxSelecting) {
            updateSelectionBox();
            needsContinue = true;
        }

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
        if (!e[primaryModifierFlag]) return;
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
        if (e.key === primaryModifierKey) keyboardState.ctrl = true;
        if (e.key === 'Shift') keyboardState.shift = true;

        if (e.key === ' ') {
            // Don't handle space during resize
            if (resizeState.targetId !== null) return;

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

        // Undo: Ctrl+Z
        if (e[primaryModifierFlag] && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            historyState.undo();
            return;
        }

        // Redo: Ctrl+Shift+Z or Ctrl+Y
        if (e[primaryModifierFlag] && ((e.key === 'Z' && e.shiftKey) || e.key === 'y')) {
            e.preventDefault();
            historyState.redo();
            return;
        }

        // Clear selection if no modals opened
        if (e.key === 'Escape' && !isModalOpen && !showDeleteConfirm && selectionState.selectedIds.size > 0) {
            selectionState.selectedIds.clear();
        }

        if (e[primaryModifierFlag] && e.key === 'a') {
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
        if (e.key === primaryModifierKey) keyboardState.ctrl = false;
        if (e.key === 'Shift') keyboardState.shift = false;
        if (e.key === ' ') keyboardState.space = false;
    }

    // Mouse state tracking
    function handleMouseDown(e: MouseEvent) {
        // Force sync keyboardState
        // -- The issue with stale keyboardState is solved with checking if e.key === primaryModifierKey
        // instead of e.ctrlKey in handleKeyDown and handleKeyUp, but this redundancy also allows remapped
        // modifier keys to work (e.key returns 'CapsLock' even thought it's remapped to 'Control' in the OS) --
        keyboardState.ctrl = e[primaryModifierFlag];
        keyboardState.shift = e.shiftKey;

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

        // Only handle left mouse button for selection/drag operations
        if (e.button !== 0) return;

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

        // Handle resizing
        if (resizeState.targetId !== null && resizeState.startSize && resizeState.startPos) {
            const note = notesState.items.find(n => n.id === resizeState.targetId);
            if (note) {
                // Calculate delta in screen space, then scale to world space
                const dx = (e.clientX - resizeState.startPos.x) / camera.scale;
                const dy = (e.clientY - resizeState.startPos.y) / camera.scale;

                // Apply new size with minimum constraints
                note.width = Math.max(NOTE_SIZE.MIN_WIDTH, resizeState.startSize.width + dx);
                note.height = Math.max(NOTE_SIZE.MIN_HEIGHT, resizeState.startSize.height + dy);
            }
            return;  // Don't handle other interactions while resizing
        }

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

        // Capture initial positions when drag starts (before first movement)
        if (dragState.targetId !== null && dragStartPositions.size === 0) {
            selectionState.selectedIds.forEach(id => {
                const note = notesState.items.find(n => n.id === id);
                if (note) {
                    dragStartPositions.set(id, { x: note.pos_x, y: note.pos_y });
                }
            });
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

        if (mouseState.isDown && (dragState.targetId !== null ||
            selectionState.box.isBoxSelecting || resizeState.targetId !== null)) {
                startRenderLoop()
        }
    }

    function handleMouseUp(_e: MouseEvent) {
        // Calculate if this was a click or drag
        const dx = mouseState.pos.x - mouseState.downPos.x;
        const dy = mouseState.pos.y - mouseState.downPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const wasClick = distance < INTERACTION.CLICK_THRESHOLD;

        // End resize - sync to backend and record history
        if (resizeState.targetId !== null) {
            const note = notesState.items.find(n => n.id === resizeState.targetId);
            if (note && resizeState.startSize) {
                const noteId = resizeState.targetId;
                const oldSize = resizeState.startSize;
                const newSize = { width: note.width, height: note.height };

                // Only record if size actually changed
                if (oldSize.width !== newSize.width || oldSize.height !== newSize.height) {
                    updateNoteLocal(resizeState.targetId, {
                        width: note.width,
                        height: note.height
                    })
                        .then(() => {
                            // Record history only after successful backend update
                            historyState.recordAction({
                                type: 'RESIZE_NOTE',
                                noteId,
                                oldSize,
                                newSize
                            });
                        })
                        .catch(err => console.error('Failed to update note size: ', err));
                }
            }

            resizeState.targetId = null;
            resizeState.startSize = null;
            resizeState.startPos = null;
            return;
        }

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
            // Colect position changes for history
            const moveUpdates = Array.from(selectionState.selectedIds)
                .map(id => {
                    const note = notesState.items.find(n => n.id === id);
                    const oldPos = dragStartPositions.get(id);
                    if (!note || !oldPos) return null;

                    return {
                        id,
                        oldPos: { x: oldPos.x, y: oldPos.y },
                        newPos: { x: note.pos_x, y: note.pos_y }
                    };
                })
                .filter((u): u is NonNullable<typeof u> => u !== null);

            // Only record if positions actually changed
            const positionsChanged = moveUpdates.some(
                u => u.oldPos.x !== u.newPos.x || u.oldPos.y !== u.newPos.y
            );

            if (positionsChanged && moveUpdates.length > 0) {
                // Update backend
                const updates = moveUpdates.map(u => ({
                    id: u.id,
                    data: { pos_x: u.newPos.x, pos_y: u.newPos.y }
                }));

                batchUpdateNotesLocal(updates)
                    .then(() => {
                        // Record history only after successful backend update
                        historyState.recordAction({
                            type: 'MOVE_NOTES',
                            updates: moveUpdates
                        });
                    })
                    .catch(err => {
                        console.error('Failed to update note positions: ', err);
                    });
            }

            dragStartPositions.clear();
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
        isSubmittingNote = true;
        try {
            if (noteId !== undefined) {
                // Update existing note - record old content for undo
                const note = notesState.items.find(n => n.id === noteId);
                const oldContent = note?.content || '';

                await updateNoteLocal(noteId, { content });

                // Record history after successful update
                if (oldContent !== content) {
                    historyState.recordAction({
                        type: 'UPDATE_NOTE_CONTENT',
                        noteId,
                        oldContent,
                        newContent: content
                    });
                }
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

                const noteData = {
                    content,
                    pos_x: position.x,
                    pos_y: position.y,
                    width: noteWidth,
                    height: noteHeight,
                    bg_color: '#fff'
                }

                await createNoteLocal(noteData);

                // Record history after successful creation
                // NOTE: We need the created note's ID
                const createdNote = notesState.items[notesState.items.length -1];
                historyState.recordAction({
                    type: 'CREATE_NOTE',
                    noteId: createdNote.id,
                    noteData
                });
            }
        } catch (err) {
            console.error('Failed to save note: ', err);
            // TODO: Show error message to user (Step 19)
        } finally {
            isSubmittingNote = false;
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
        isDeletingNotes = true;
        try {
            // Capture note data before deletion
            const notesData = notesToDelete
                .map(id => notesState.items.find(n => n.id === id))
                .filter((n): n is Note => n !== undefined);

            await deleteNotesLocal(notesToDelete);

            // Record history after successful deletion
            historyState.recordAction({
                type: 'DELETE_NOTES',
                noteIds: notesToDelete,
                notesData
            });

            selectionState.selectedIds.clear();
            notesToDelete = [];
        } catch (error) {
            console.error('Failed to delete notes: ', error);
            // TODO: Show error toast (Step 19)
        } finally {
            isDeletingNotes = false;
        }
    }

    function handleCancelDelete(): void {
        notesToDelete = [];
    }

    function handleResizeStart(noteId: number, e: MouseEvent) {
        e.stopPropagation();

        const note = notesState.items.find(n => n.id === noteId);
        if (!note) return;

        resizeState.targetId = noteId;
        resizeState.startSize = { width: note.width, height: note.height };
        resizeState.startPos = { x: e.clientX, y: e.clientY };

        // Select note if not already selected
        if (!selectionState.selectedIds.has(noteId)) {
            if (!keyboardState.ctrl) {
                selectionState.selectedIds.clear();
            }
            selectionState.selectedIds.add(noteId);
        }
    }

    // Cleanup RAF on component unmount
    onDestroy(() => {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Clean up zoom timeout
        if (zoomTimeout !== null) {
            clearTimeout(zoomTimeout);
            zoomTimeout = null;
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

{#if notesState.loading}
    <div class="loading-container">
        <Spinner size={40} />
        <p>Loading notes...</p>
    </div>
{:else if notesState.error}
    <div class="error-container">
        <p>Error: {notesState.error}</p>
    </div>
{:else}
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
        class:resizing={resizeState.targetId !== null}
        onmousedown={handleMouseDown}
    >
        <GridCanvas />
        <NotesLayer
            onEditNote={handleEditNote}
            onResizeStart={handleResizeStart}
            resizingNoteId={resizeState.targetId}
        />
        <OverlayCanvas />
    </div>

    <!-- FAB and Modal -->
    <CreateNoteFAB onclick={() => isModalOpen = true} />
    <NoteFormModal bind:isOpen={isModalOpen} bind:editNote={editingNote} onSubmit={handleSubmitNote} isSubmitting={isSubmittingNote} />
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
        isProcessing={isDeletingNotes}
    />
{/if}

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

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        gap: 1rem;
    }

    .loading-container p {
        color: #666;
        font-size: 0.875rem;
    }

    .error-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: #dc2626;
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

    .viewport.resizing {
        cursor: nwse-resize !important;
    }

    .viewport.resizing :global(.note) {
        cursor: nwse-resize !important;
    }

    .viewport.resizing :global(.resize-handle) {
        cursor: nwse-resize !important;
    }

    .viewport :global(.note.resizing) {
        cursor: nwse-resize !important;
    }

    .viewport :global(.note.resizing) :global(*) {
        cursor: nwse-resize !important;
    }

    .viewport.space-drag :global(.note.resizing),
    .viewport.space-drag :global(.note.resizing) :global(*),
    .viewport.space-drag :global(.note.resizing) :global(.resize-handle) {
        cursor: nwse-resize !important;
    }
</style>
