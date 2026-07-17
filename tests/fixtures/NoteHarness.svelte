<script lang="ts">
	import Note from '$lib/components/Note.svelte';
	import { camera } from '$lib/state/cameraState.svelte';
	import type { Note as NoteType } from '$lib/types';

	interface Props {
		note: NoteType;
		onEdit?: (noteId: number) => void;
		onResizeStart?: (noteId: number, e: MouseEvent) => void;
		isResizing?: boolean;
	}

	let { note, onEdit, onResizeStart = () => {}, isResizing = false }: Props = $props();
</script>

<!--
	Mirrors the part of the real tree Note depends on: it walks up to `.viewport` via
	getViewportRect(), and the camera transform is applied by `.notes-layer` above it
	(see NotesLayer.svelte). The viewport is pinned to the top-left so that screen
	coordinates in tests are just page coordinates.
-->
<div class="viewport">
	<div
		class="notes-layer"
		style="transform: translate({camera.x}px, {camera.y}px) scale({camera.scale})"
	>
		<Note {note} {onEdit} {onResizeStart} {isResizing} />
	</div>
</div>

<style>
	.viewport {
		position: fixed;
		top: 0;
		left: 0;
		width: 800px;
		height: 600px;
		overflow: hidden;
	}

	.notes-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transform-origin: 0 0;
	}
</style>
