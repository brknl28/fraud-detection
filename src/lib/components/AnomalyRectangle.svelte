<script lang="ts">
	import type { Anomaly } from '$lib/types/anomaly';

	interface Props {
		anomaly: Anomaly;
		isChecked: boolean;
		onToggle: (id: number) => void;
	}

	let { anomaly, isChecked, onToggle }: Props = $props();
	let showTooltip = $state(false);

	function handleClick() {
		onToggle(anomaly.id);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggle(anomaly.id);
		}
	}

	function handleInfoClick(event: MouseEvent) {
		event.stopPropagation();
		showTooltip = !showTooltip;
	}

	function handleInfoKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			showTooltip = !showTooltip;
		}
	}

	const severity = $derived((anomaly as any).severity || 'WARNING');

	const strokeToken = $derived(
		severity === 'DANGER'
			? 'var(--colors-red)'
			: severity === 'WARNING'
				? 'var(--colors-yellow)'
				: 'var(--colors-green)',
	);

	const fillStyle = $derived(
		`fill: color-mix(in srgb, ${strokeToken.replace('var(', '').replace(')', '')} 15%, transparent)`,
	);

	// Use direct CSS variable usage via inline style on parent group
	const groupStyle = $derived(
		severity === 'DANGER'
			? '--anomaly-color: var(--colors-red); --anomaly-fill: var(--colors-red-2)'
			: severity === 'WARNING'
				? '--anomaly-color: var(--colors-yellow); --anomaly-fill: var(--colors-yellow-2)'
				: '--anomaly-color: var(--colors-green); --anomaly-fill: var(--colors-green-2)',
	);

	const tooltipText = $derived.by(() => {
		if (severity === 'DANGER') {
			return 'This region is marked as forged in the document metadata.';
		}
		if (severity === 'WARNING') {
			return 'This region is marked as suspicious in the document metadata.';
		}
		return 'This region is not flagged by the current metadata.';
	});

	const infoX = $derived(anomaly.x + anomaly.width - 12);
	const infoY = $derived(anomaly.y - 12);
	const infoRadius = 10;
</script>

<g class="anomaly-group" class:checked={isChecked} style={groupStyle}>
	<rect
		x={anomaly.x}
		y={anomaly.y}
		width={anomaly.width}
		height={anomaly.height}
		class="highlight-fill"
		class:active={isChecked}
	/>

	<rect
		x={anomaly.x}
		y={anomaly.y}
		width={anomaly.width}
		height={anomaly.height}
		fill="none"
		stroke-width={isChecked ? 8 : 6}
		stroke-dasharray={isChecked ? 'none' : '6,4'}
		class="highlight-rect"
		class:active={isChecked}
		role="button"
		tabindex="0"
		aria-label="Anomaly {anomaly.id}: {anomaly.text}"
		aria-pressed={isChecked}
		onclick={handleClick}
		onkeydown={handleKeydown}
	/>

	{#if severity !== 'SAFE'}
		<g class="info-button-group">
			<circle
				cx={infoX}
				cy={infoY}
				r={infoRadius}
				class="info-button"
				role="button"
				tabindex="0"
				aria-label="Show info"
				onclick={handleInfoClick}
				onkeydown={handleInfoKeydown}
			/>

			<text
				x={infoX}
				y={infoY + 4}
				text-anchor="middle"
				fill="white"
				font-size="12"
				font-weight="bold"
				font-family="serif"
				style="pointer-events: none;"
			>
				i
			</text>
		</g>

		{#if showTooltip}
			<g class="tooltip-group">
				<rect
					x={anomaly.x + anomaly.width + 8}
					y={anomaly.y - 10}
					width="200"
					height="60"
					rx="6"
					ry="6"
					class="tooltip-bg"
				/>

				<polygon
					points="{anomaly.x + anomaly.width + 8},{anomaly.y +
						10} {anomaly.x + anomaly.width},{anomaly.y +
						10} {anomaly.x + anomaly.width + 8},{anomaly.y + 18}"
					class="tooltip-bg"
				/>

				<foreignObject
					x={anomaly.x + anomaly.width + 14}
					y={anomaly.y - 4}
					width="188"
					height="52"
				>
					<div
						xmlns="http://www.w3.org/1999/xhtml"
						class="tooltip-text"
					>
						{tooltipText}
					</div>
				</foreignObject>
			</g>
		{/if}
	{/if}
</g>

<style>
	.highlight-fill {
		fill: var(--anomaly-fill);
		opacity: 0.6;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}

	.highlight-fill.active {
		opacity: 1;
	}

	.highlight-rect {
		stroke: var(--anomaly-color);
		cursor: pointer;
		transition: stroke-width 0.2s ease;
		pointer-events: auto;
	}

	.highlight-rect:hover {
		stroke-width: 8 !important;
	}

	.highlight-rect:focus,
	.highlight-rect:focus-visible {
		outline: none;
		stroke-width: 8 !important;
	}

	.info-button {
		fill: var(--anomaly-color);
		cursor: pointer;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
		transition: filter 0.15s ease;
	}

	.info-button:hover {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4)) brightness(1.1);
	}

	.info-button-group {
		opacity: 0.9;
	}

	.info-button-group:hover {
		opacity: 1;
	}

	.tooltip-bg {
		fill: var(--bg-grouped-secondary);
		stroke: var(--anomaly-color);
		stroke-width: 1;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
	}

	.tooltip-text {
		color: var(--labels-primary);
		font-size: 11px;
		line-height: 1.3;
		font-family: var(--sans-serif-font-family);
	}
</style>
