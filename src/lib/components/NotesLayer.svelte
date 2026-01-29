<script lang="ts">
    import { camera } from '$lib/state/cameraState.svelte';
    import { notesState } from '$lib/state/notesState.svelte';
    import { getVisibleNotes } from '$lib/utils/viewport-culling';
    import Note from './Note.svelte';

    interface Props {
        onEditNote?: (noteId: number) => void;
        onResizeStart: (noteId: number, e: MouseEvent) => void;
        resizingNoteId: number | null;
    }

    let { onEditNote, onResizeStart, resizingNoteId }: Props = $props();

    // Track viewport dimensions for culling
    let viewportWidth = $state(0);
    let viewportHeight = $state(0);
    let layerEl: HTMLDivElement;

    // Setup ResizeObserver to track viewport size
    $effect(() => {
        if (!layerEl) return;

        const resizeObserver = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            viewportWidth = rect.width;
            viewportHeight = rect.height;
        });

        const viewport = layerEl.closest('.viewport');
        if (viewport) {
            resizeObserver.observe(viewport);  // Observe parent (viewport)
        }

        return () => resizeObserver.disconnect();
    });

    // Filter to only visible notes
    const visibleNotes = $derived(
        viewportWidth > 0 && viewportHeight > 0
            ? getVisibleNotes(notesState.items, viewportWidth, viewportHeight, camera)
            : notesState.items  // Fallback to all notes until viewport size known
    );
</script>

<div
    bind:this={layerEl}
    class="notes-layer"
    style="transform: translate({camera.x}px, {camera.y}px) scale({camera.scale})"
>
    {#each visibleNotes as note (note.id)}
        <Note {note} onEdit={onEditNote} {onResizeStart} isResizing={resizingNoteId === note.id} />
    {/each}
</div>

<style>
    .notes-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform-origin: 0 0;
        will-change: transform;
        z-index: 2;
        pointer-events: none;
    }
</style>
