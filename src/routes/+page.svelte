<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchNotes } from '$lib/api/rails-api';
	import type { Note, ApiError } from '$lib/types';

	let notes = $state<Note[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			loading = true;
			error = null;
			notes = await fetchNotes();
			console.log('API connected! Notes: ', notes);
		} catch (err) {
			const apiError = err as ApiError;
			error = apiError.message;
			console.error('API error: ', apiError);
		} finally {
			loading = false;
		}
	});
</script>

<div>
	<h1>API Connection Test</h1>

	{#if loading}
		<p>Loading notes...</p>
	{:else if error}
		<p style="color: red;">Error: {error}</p>
		<p>Make sure your Rails server is running at {import.meta.env.PUBLIC_API_URL}</p>
	{:else}
		<p>Successfully connected to API</p>
		<p>Found {notes.length} notes</p>
		{#if notes.length > 0}
			<ul>
				{#each notes as note}
					<li>Note #{note.id}: {note.content || '(empty)'}</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
