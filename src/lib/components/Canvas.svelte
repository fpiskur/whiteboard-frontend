<script lang="ts">
    import { onMount } from 'svelte';
    import { camera, cameraRender } from '$lib/state/cameraState.svelte';
    import { notesState, loadNotes } from '$lib/state/notesState.svelte';
    import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';
    import GridCanvas from './GridCanvas.svelte';
    import OverlayCanvas from './OverlayCanvas.svelte';
    import NotesLayer from './NotesLayer.svelte';

    let viewportEl: HTMLDivElement;

    // Track interaction states for cursor styling
    let isSpaceDragging = $state(false);
    let isMiddleMousePanning = $state(false);

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
            isSpaceDragging = false;
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div
    class="viewport"
    bind:this={viewportEl}
    class:space-drag={isSpaceDragging}
    class:middle-mouse-pan={isMiddleMousePanning}
    class:box-selecting={selectionState.box.isBoxSelecting}
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
