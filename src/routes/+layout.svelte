<script lang="ts">
	import { onMount } from 'svelte';
	import { themeState } from '$lib/state/themeState.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import '../lib/styles/theme.css';

	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();

	onMount(() => {
		themeState.init();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<ToastContainer />
<ThemeToggle />
