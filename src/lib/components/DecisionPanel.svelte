<script lang="ts">
	import { documentStore } from "$lib/stores/document.svelte";
	import { AlertTriangle, ShieldCheck } from "lucide-svelte";
</script>

<div class="decision-panel">
	<button
		type="button"
		class="decision-btn fraud"
		onclick={() => documentStore.markAsFraud()}
		disabled={documentStore.fraudMarked}
		aria-pressed={documentStore.fraudMarked}
	>
		<AlertTriangle size={18} />
		<span>Forged</span>
	</button>

	<button
		type="button"
		class="decision-btn legitimate"
		onclick={() => documentStore.markAsLegitimate()}
		disabled={!documentStore.fraudMarked}
	>
		<ShieldCheck size={18} />
		<span>Genuine</span>
	</button>
</div>
