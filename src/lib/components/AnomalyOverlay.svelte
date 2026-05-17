<script lang="ts">
	import type { Anomaly } from "$lib/types/anomaly";
	import AnomalyRectangle from "./AnomalyRectangle.svelte";

	interface Props {
		width: number;
		height: number;
		anomalies: Anomaly[];
		checkedIds: Set<number>;
		onToggle: (id: number) => void;
	}

	let { width, height, anomalies, checkedIds, onToggle }: Props = $props();
</script>

<svg
	class="svg-overlay"
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="xMidYMid meet"
	aria-label="Anomaly highlight layer"
	role="img"
>
	{#each anomalies as anomaly (anomaly.id)}
		<AnomalyRectangle
			{anomaly}
			isChecked={checkedIds.has(anomaly.id)}
			{onToggle}
		/>
	{/each}
</svg>
