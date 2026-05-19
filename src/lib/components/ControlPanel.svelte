<script lang="ts">
	import { untrack } from 'svelte';
	import { documentStore } from '$lib/stores/document.svelte';
	import {
		Version26List,
		Version26ListRow,
		Version26ListRowToggleTrailing,
		Version26Button,
	} from 'apple-svelte';

	let fieldsToggle = $state<'on' | 'off'>(
		documentStore.allAnomaliesVisible ? 'on' : 'off',
	);
	let ocrToggle = $state<'on' | 'off'>(documentStore.ocrVisible ? 'on' : 'off');

	$effect(() => {
		const desired = fieldsToggle === 'on';
		untrack(() => {
			if (desired !== documentStore.allAnomaliesVisible) {
				documentStore.toggleAllAnomalies();
			}
		});
	});

	$effect(() => {
		const desired = ocrToggle === 'on';
		untrack(() => {
			if (desired !== documentStore.ocrVisible) {
				documentStore.toggleOcr();
			}
		});
	});
</script>

<div class="control-panel">
	<Version26List>
		<Version26ListRow title="Show all fields">
			<svelte:fragment slot="trailing">
				<Version26ListRowToggleTrailing bind:state={fieldsToggle} showAccentColor={true} />
			</svelte:fragment>
		</Version26ListRow>
		<Version26ListRow title="OCR Text">
			<svelte:fragment slot="trailing">
				<Version26ListRowToggleTrailing bind:state={ocrToggle} showAccentColor={true} />
			</svelte:fragment>
		</Version26ListRow>
	</Version26List>

	<div class="actions">
		<Version26Button
			labelType="symbol-and-text"
			symbol="check_box"
			label="Select all"
			size="small"
			onPress={() => documentStore.selectAllOcrWords()}
		/>
		<Version26Button
			labelType="symbol-and-text"
			symbol="disabled_by_default"
			label="Reset"
			size="small"
			onPress={() => documentStore.deselectAllOcrWords()}
		/>
	</div>
</div>

<style>
	.control-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	.actions :global(button) {
		flex: 1;
		justify-content: center;
	}
</style>
