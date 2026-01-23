<script lang="ts">
	import type { Anomaly } from "$lib/types/anomaly";

	interface Props {
		anomaly: Anomaly;
		isChecked: boolean;
		onToggle: (id: number) => void;
	}

	let { anomaly, isChecked, onToggle }: Props = $props();

	function handleClick() {
		onToggle(anomaly.id);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onToggle(anomaly.id);
		}
	}
</script>

<button
	type="button"
	class="issue-item"
	class:active={isChecked}
	class:original={anomaly.type === "original"}
	class:forged={anomaly.type === "forged"}
	onclick={handleClick}
	onkeydown={handleKeydown}
	aria-pressed={isChecked}
>
	<input
		type="checkbox"
		class="issue-checkbox"
		checked={isChecked}
		onchange={handleClick}
		aria-label="Check area {anomaly.id}"
		tabindex="-1"
	/>
	<div class="issue-content">
		<div class="issue-header">
			<span class="issue-number">#{anomaly.id}</span>
			<span
				class="issue-type"
				class:original={anomaly.type === "original"}
				class:forged={anomaly.type === "forged"}
			>
				{anomaly.type === "original" ? "Original" : "Suspicious"}
			</span>
		</div>
		<p class="issue-text">{anomaly.text}</p>
	</div>
</button>
