<script lang="ts">
	import type { OcrLine } from '$lib/types/anomaly';
	import { onMount } from 'svelte';
	import Symbol from './Symbol.svelte';

	interface Props {
		showBoxes: boolean;
		showText: boolean;
		lines: OcrLine[];
		selectedIndices: Set<number>;
		width: number;
		height: number;
	}

	let { showBoxes, showText, lines, selectedIndices, width, height }: Props = $props();

	let openTooltipIdx = $state<number | null>(null);
	let tooltipPosition = $state<{ x: number; y: number } | null>(null);
	let tooltipSeverity = $state<string>('WARNING');

	function severityClass(severity: string): string {
		if (severity === 'DANGER') return 'danger';
		if (severity === 'SAFE') return 'safe';
		return 'warning';
	}

	function toggleTooltip(idx: number, severity: string, event: MouseEvent) {
		event.stopPropagation();
		if (openTooltipIdx === idx) {
			openTooltipIdx = null;
			tooltipPosition = null;
		} else {
			openTooltipIdx = idx;
			tooltipSeverity = severity;
			const rect = (event.currentTarget as Element).getBoundingClientRect();
			tooltipPosition = { x: rect.right + 10, y: rect.top - 10 };
		}
	}

	function handleKeydown(idx: number, severity: string, event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			if (openTooltipIdx === idx) {
				openTooltipIdx = null;
				tooltipPosition = null;
			} else {
				openTooltipIdx = idx;
				tooltipSeverity = severity;
				const rect = (event.currentTarget as Element).getBoundingClientRect();
				tooltipPosition = { x: rect.right + 10, y: rect.top - 10 };
			}
		}
	}

	function getTooltipText(severity: string): string {
		if (severity === 'DANGER') {
			return 'This OCR word has low confidence and should be checked against the source image.';
		}
		if (severity === 'WARNING') {
			return 'This OCR word has medium confidence. Manual review is recommended.';
		}
		return 'This OCR word has enough confidence for the current thresholds.';
	}

	function closeTooltip() {
		openTooltipIdx = null;
		tooltipPosition = null;
	}

	onMount(() => {
		const handleGlobalClick = () => closeTooltip();
		document.addEventListener('click', handleGlobalClick);
		document.addEventListener('wheel', closeTooltip);
		document.addEventListener('scroll', closeTooltip, true);
		return () => {
			document.removeEventListener('click', handleGlobalClick);
			document.removeEventListener('wheel', closeTooltip);
			document.removeEventListener('scroll', closeTooltip, true);
		};
	});

	const visibleLines = $derived(
		lines
			.map((line, idx) => ({ line, idx }))
			.filter(({ idx }) => selectedIndices.has(idx)),
	);
</script>

{#if (showBoxes || showText) && visibleLines.length > 0}
	<svg
		class="ocr-overlay"
		viewBox="0 0 {width} {height}"
		preserveAspectRatio="xMidYMid meet"
		aria-label="OCR text layer"
	>
		{#each visibleLines as { line, idx } (idx)}
			{@const x = line.x * width}
			{@const y = line.y * height}
			{@const w = (line.width || 0) * width}
			{@const h = (line.height || line.fontSize || 0) * height}
			{@const severity = (line as any).severity || 'WARNING'}
			{@const cls = severityClass(severity)}

			{@const infoRadius = 30}
			{@const infoX = x + w - infoRadius / 2}
			{@const infoY = y - infoRadius - 5}
			{@const iconSize = infoRadius * 1.4}

			{#if showBoxes}
				<rect
					{x}
					{y}
					width={w}
					height={h}
					class="ocr-word-box {cls}"
					stroke-width="3"
					stroke-dasharray="8 4"
				/>

				{#if severity !== 'SAFE'}
					<g
						class="info-button-group {cls}"
						class:active={openTooltipIdx === idx}
						role="button"
						tabindex="0"
						aria-label="Show info"
						onclick={(e) => toggleTooltip(idx, severity, e)}
						onkeydown={(e) => handleKeydown(idx, severity, e)}
						style="cursor: pointer;"
					>
						<circle cx={infoX} cy={infoY} r={infoRadius} class="info-button {cls}" />
						{#if severity === 'DANGER'}
							<svg
								x={infoX - iconSize / 2}
								y={infoY - iconSize / 2}
								width={iconSize}
								height={iconSize}
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								style="pointer-events: none;"
							>
								<path
									d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
								/>
								<path d="M12 9v4" />
								<path d="M12 17h.01" />
							</svg>
						{:else}
							<svg
								x={infoX - iconSize / 2}
								y={infoY - iconSize / 2}
								width={iconSize}
								height={iconSize}
								viewBox="0 0 24 24"
								fill="none"
								stroke="white"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								style="pointer-events: none;"
							>
								<circle cx="12" cy="12" r="10" />
								<path d="M12 8v4" />
								<path d="M12 16h.01" />
							</svg>
						{/if}
					</g>
				{/if}
			{/if}

			{#if showText}
				<text
					{x}
					y={y + h * 0.8}
					class="ocr-text {cls}"
					dominant-baseline="auto"
					text-anchor="start"
					font-size={h}
					textLength={w}
					lengthAdjust="spacingAndGlyphs"
				>
					{line.text}
				</text>
			{/if}
		{/each}
	</svg>
{/if}

{#if openTooltipIdx !== null && tooltipPosition}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed-tooltip liquid-glass liquid-glass-small {severityClass(tooltipSeverity)}"
		style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="tooltip-arrow {severityClass(tooltipSeverity)}"></div>
		<div class="tooltip-content">
			<strong class="tooltip-title {severityClass(tooltipSeverity)}">
				<Symbol
					name={tooltipSeverity === 'DANGER' ? 'warning' : 'info'}
					size="small"
				/>
				<span>
					{tooltipSeverity === 'DANGER' ? 'Forged Field' : 'Suspicious Field'}
				</span>
			</strong>
			<p>{getTooltipText(tooltipSeverity)}</p>
		</div>
	</div>
{/if}

<style>
	.ocr-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.ocr-word-box {
		fill: transparent;
		pointer-events: none;
	}

	.ocr-word-box.danger {
		stroke: var(--colors-red);
		fill: color-mix(in srgb, var(--colors-red) 15%, transparent);
	}

	.ocr-word-box.warning {
		stroke: var(--colors-yellow);
		fill: color-mix(in srgb, var(--colors-yellow) 15%, transparent);
	}

	.ocr-word-box.safe {
		stroke: var(--colors-green);
		fill: color-mix(in srgb, var(--colors-green) 15%, transparent);
	}

	.ocr-text {
		font-family: var(--sans-serif-font-family);
		font-size: 12px;
		font-weight: 600;
		pointer-events: none;
	}

	.ocr-text.danger {
		fill: var(--colors-red);
	}

	.ocr-text.warning {
		fill: var(--colors-yellow);
	}

	.ocr-text.safe {
		fill: var(--colors-green);
	}

	.info-button {
		pointer-events: all;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
		transition: filter 0.15s ease;
	}

	.info-button.danger {
		fill: var(--colors-red);
	}

	.info-button.warning {
		fill: var(--colors-yellow);
	}

	.info-button-group:hover .info-button {
		filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.6)) brightness(1.15);
	}

	.info-button-group.active .info-button {
		filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7)) brightness(1.2);
	}

	.fixed-tooltip {
		position: fixed;
		z-index: 9999;
		min-width: 280px;
		max-width: 320px;
		border-radius: 14px;
		padding: 0;
		pointer-events: auto;
		animation: tooltipFadeIn 0.15s ease-out;
		background: var(--app-glass-bg);
		border: 0.5px solid var(--app-glass-border);
		box-shadow: var(--app-floating-shadow);
		backdrop-filter: blur(24px) saturate(1.28);
		-webkit-backdrop-filter: blur(24px) saturate(1.28);
	}

	.fixed-tooltip::before,
	.fixed-tooltip::after {
		border-radius: inherit;
	}

	@keyframes tooltipFadeIn {
		from {
			opacity: 0;
			transform: translateY(5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.fixed-tooltip.danger {
		border-color: color-mix(in srgb, var(--colors-red) 72%, var(--app-glass-border));
	}

	.fixed-tooltip.warning {
		border-color: color-mix(in srgb, var(--colors-yellow) 72%, var(--app-glass-border));
	}

	.tooltip-arrow {
		position: absolute;
		left: -8px;
		top: 20px;
		width: 0;
		height: 0;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
		border-right: 8px solid var(--app-glass-bg);
	}

	.tooltip-content {
		padding: 14px 16px;
		color: var(--labels-primary);
	}

	.tooltip-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		margin-bottom: 6px;
	}

	.tooltip-title.danger {
		color: var(--colors-red);
	}

	.tooltip-title.warning {
		color: var(--colors-yellow);
	}

	.tooltip-content p {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--labels-secondary);
	}
</style>
