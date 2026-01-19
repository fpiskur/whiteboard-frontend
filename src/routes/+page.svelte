<script lang="ts">
  import { onMount } from 'svelte';
  import { notesState, loadNotes } from '$lib/state/notesState.svelte';
  import { camera, cameraRender } from '$lib/state/cameraState.svelte';
  import { selectionState, keyboardState } from '$lib/state/selectionState.svelte';

  onMount(() => {
    loadNotes();
  });
</script>

<div>
	<h1>API Connection Test</h1>

	<!-- Example usage (no actual UI yet) -->
	{#if notesState.loading}
	  <p>Loading notes…</p>
	{:else if notesState.error}
	  <p style="color:red;">{notesState.error}</p>
	{:else}
	  <p>Loaded {notesState.items.length} notes.</p>
	{/if}
</div>
