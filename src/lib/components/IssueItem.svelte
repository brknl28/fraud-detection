<script lang="ts">
	import type { Anomaly } from '$lib/types/anomaly';
	import { Version26ListRow } from 'apple-svelte';
	import Symbol from './Symbol.svelte';

	interface Props {
		anomaly: Anomaly;
		isChecked: boolean;
		onToggle: (id: number) => void;
	}

	let { anomaly, isChecked, onToggle }: Props = $props();

	let typeLabel = $derived(anomaly.type === 'forged' ? 'Forged' : 'Suspicious');
	let typeColor = $derived(
		anomaly.type === 'forged' ? 'var(--colors-red)' : 'var(--colors-yellow)',
	);

	function handleClick() {
		onToggle(anomaly.id);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggle(anomaly.id);
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="issue-row-wrapper"
	role="button"
	tabindex="0"
	aria-pressed={isChecked}
	aria-label="Anomaly {anomaly.id}: {anomaly.text} ({typeLabel})"
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<Version26ListRow
		title={anomaly.text}
		showSubtitle={true}
		subtitle="#{anomaly.id} · {typeLabel}"
		showEditButton={true}
		editButtonType="checkmark"
		checkmarkEditButtonState={isChecked ? 'selected' : 'default'}
	>
		<svelte:fragment slot="trailing">
			<div class="trailing">
				<Symbol
					name={anomaly.type === 'forged' ? 'warning' : 'info'}
					size="small"
					color={typeColor}
				/>
				<Symbol name="chevron_right" size="small" color="var(--labels-tertiary)" />
			</div>
		</svelte:fragment>
	</Version26ListRow>
</div>

<style>
	.issue-row-wrapper {
		cursor: pointer;
	}

	.trailing {
		display: flex;
		align-items: center;
		gap: 6px;
	}
</style>
