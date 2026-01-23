<script lang="ts">
	import { documentStore } from "$lib/stores/document.svelte";
	import IssueItem from "./IssueItem.svelte";
</script>

<div class="side-panel">
	<div class="issues-list" role="list" aria-label="Anomalienliste">
		{#each documentStore.anomalies as anomaly (anomaly.id)}
			<IssueItem
				{anomaly}
				isChecked={documentStore.isAnomalyChecked(anomaly.id)}
				onToggle={(id) => documentStore.toggleAnomaly(id)}
			/>
		{/each}
	</div>
</div>
