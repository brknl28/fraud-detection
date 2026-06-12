<script lang="ts">
	import { documentStore } from '$lib/stores/document.svelte';
	import { Version26Button, Version26Alert, Version26AlertButton } from 'apple-svelte';

	let alertState = $state<'default' | 'hidden'>('hidden');
	let panelEl: HTMLDivElement | undefined = $state();

	let canDecide = $derived(documentStore.ocrLines.length > 0);

	function markFraud() {
		if (!canDecide) return;
		documentStore.markAsFraud();
		alertState = 'default';
	}

	function markGenuine() {
		documentStore.markAsLegitimate();
	}

	function dismissAlert() {
		alertState = 'hidden';
		queueMicrotask(() => {
			panelEl?.querySelector('button')?.focus();
		});
	}
</script>

<div class="decision-panel" bind:this={panelEl}>
	<div class="decision-button" class:disabled={!canDecide || documentStore.fraudMarked}>
		<Version26Button
			labelType="symbol-and-text"
			symbol="warning"
			label="Forged"
			size="medium"
			style="--colors-accent: var(--colors-red); --colors-accent-2: var(--colors-red-2); color: var(--colors-red);"
			onPress={markFraud}
		/>
	</div>

	<div class="decision-button" class:disabled={!canDecide || !documentStore.fraudMarked}>
		<Version26Button
			labelType="symbol-and-text"
			symbol="verified_user"
			label="Genuine"
			size="medium"
			onPress={markGenuine}
		/>
	</div>
</div>

<Version26Alert
	bind:state={alertState}
	title="Marked as forged"
	showDescription={true}
	description="The reviewer verdict is now set to forged. Mark as Genuine to revert the decision."
>
	<svelte:fragment slot="button-1">
		<Version26AlertButton state="primary" label="OK" onPress={dismissAlert} />
	</svelte:fragment>
</Version26Alert>

<style>
	.decision-panel {
		display: flex;
		gap: 8px;
		width: 100%;
	}

	.decision-button {
		flex: 1;
		display: flex;
	}

	.decision-button :global(button) {
		flex: 1;
		justify-content: center;
		width: 100%;
	}

	.decision-button.disabled {
		opacity: 0.4;
		pointer-events: none;
	}
</style>
