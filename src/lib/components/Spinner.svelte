<script lang="ts">
	import { RegularProgressIndicator } from 'apple-svelte';

	interface Props {
		label?: string;
	}

	let { label = 'Analyzing…' }: Props = $props();
</script>

<div class="spinner-container">
	<RegularProgressIndicator showLabel={true} {label} />
</div>

<style>
	.spinner-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
	}
</style>
