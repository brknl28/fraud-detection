<script lang="ts">
	import 'apple-svelte/styles.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		try {
			await (document as any).fonts?.load?.("24px 'Material Symbols Rounded'");
		} catch {
			/* network failed, fallback CSS keeps glyphs hidden */
		}
		document.body.classList.add('fonts-loaded');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
