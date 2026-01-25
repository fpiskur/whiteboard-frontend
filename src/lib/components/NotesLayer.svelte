<script lang="ts">
    import { camera } from '$lib/state/cameraState.svelte';
    import { notesState } from '$lib/state/notesState.svelte';
    import Note from './Note.svelte';

    // Reactive transform based on camera
    $effect(() => {
        // This will reactively update when camera changes
    });

    interface Props {
        onEditNote?: (noteId: number) => void;
        onResizeStart: (noteId: number, e: MouseEvent) => void;
        resizingNoteId: number | null;
    }

    let { onEditNote, onResizeStart, resizingNoteId }: Props = $props();
</script>

<div
    class="notes-layer"
    style="transform: translate({camera.x}px, {camera.y}px) scale({camera.scale})"
>
    {#each notesState.items as note (note.id)}
        <Note {note} onEdit={onEditNote} {onResizeStart} isResizing={resizingNoteId === note.id} />
    {/each}
</div>

<style>
    .notes-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 0px;
        height: 0px;
        transform-origin: 0 0;
        will-change: transform;
        z-index: 2;
    }
</style>
