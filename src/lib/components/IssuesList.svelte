<script lang="ts">
	import { documentStore } from '$lib/stores/document.svelte';
	import { Version26List } from 'apple-svelte';
	import IssueItem from './IssueItem.svelte';
</script>

<div class="issues-section" role="region" aria-label="Anomaly list">
	{#if documentStore.anomalies.length === 0}
		<p class="empty-state">No anomalies detected</p>
	{:else}
		<Version26List>
			{#each documentStore.anomalies as anomaly (anomaly.id)}
				<IssueItem
					{anomaly}
					isChecked={documentStore.isAnomalyChecked(anomaly.id)}
					onToggle={(id) => documentStore.toggleAnomaly(id)}
				/>
			{/each}
		</Version26List>
	{/if}
</div>

<style>
	.issues-section {
		width: 100%;
	}

	.empty-state {
		padding: 12px 16px;
		font-size: 13px;
		color: var(--labels-secondary);
		text-align: center;
	}
</style>
