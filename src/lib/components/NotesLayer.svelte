<script lang="ts">
    import { camera } from '$lib/state/cameraState.svelte';
    import { notesState } from '$lib/state/notesState.svelte';
    import Note from './Note.svelte';

    // Reactive transform based on camera
    $effect(() => {
        // This will reactively update when camera changes
    });

    let { onEditNote }: { onEditNote?: (noteId: number) => void } = $props();
</script>

<div
    class="notes-layer"
    style="transform: translate({camera.x}px, {camera.y}px) scale({camera.scale})"
>
    {#each notesState.items as note (note.id)}
        <Note {note} onEdit={onEditNote} />
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
