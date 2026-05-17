<script lang="ts">
	import type { OcrLine } from "$lib/types/anomaly";
	import { onMount } from "svelte";
	import { AlertTriangle, AlertCircle } from "lucide-svelte";

	interface Props {
		showBoxes: boolean;
		showText: boolean;
		lines: OcrLine[];
		selectedIndices: Set<number>;
		width: number;
		height: number;
	}

	let { showBoxes, showText, lines, selectedIndices, width, height }: Props =
		$props();

	let openTooltipIdx = $state<number | null>(null);
	let tooltipPosition = $state<{ x: number; y: number } | null>(null);
	let tooltipSeverity = $state<string>("WARNING");

	function toggleTooltip(idx: number, severity: string, event: MouseEvent) {
		event.stopPropagation();

		if (openTooltipIdx === idx) {
			openTooltipIdx = null;
			tooltipPosition = null;
		} else {
			openTooltipIdx = idx;
			tooltipSeverity = severity;

			const rect = (
				event.currentTarget as Element
			).getBoundingClientRect();
			tooltipPosition = {
				x: rect.right + 10,
				y: rect.top - 10,
			};
		}
	}

	function handleKeydown(
		idx: number,
		severity: string,
		event: KeyboardEvent,
	) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			event.stopPropagation();

			if (openTooltipIdx === idx) {
				openTooltipIdx = null;
				tooltipPosition = null;
			} else {
				openTooltipIdx = idx;
				tooltipSeverity = severity;
				const rect = (
					event.currentTarget as Element
				).getBoundingClientRect();
				tooltipPosition = {
					x: rect.right + 10,
					y: rect.top - 10,
				};
			}
		}
	}

	function getTooltipText(severity: string): string {
		if (severity === "DANGER") {
			return "This field was detected as forged. There are inconsistencies in font, color, or alignment.";
		}
		if (severity === "WARNING") {
			return "This field was marked as suspicious. Manual review is recommended.";
		}
		return "This field was classified as safe.";
	}

	function closeTooltip() {
		openTooltipIdx = null;
		tooltipPosition = null;
	}

	function handleGlobalClick() {
		closeTooltip();
	}

	onMount(() => {
		document.addEventListener("click", handleGlobalClick);

		document.addEventListener("wheel", closeTooltip);
		document.addEventListener("scroll", closeTooltip, true);

		return () => {
			document.removeEventListener("click", handleGlobalClick);
			document.removeEventListener("wheel", closeTooltip);
			document.removeEventListener("scroll", closeTooltip, true);
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
		{#each visibleLines as { line, idx }}
			{@const x = line.x * width}
			{@const y = line.y * height}
			{@const w = (line.width || 0) * width}
			{@const h = (line.height || line.fontSize || 0) * height}

			{@const severity = (line as any).severity || "WARNING"}
			{@const color =
				severity === "DANGER"
					? "#ef4444"
					: severity === "SAFE"
						? "#22c55e"
						: "#eab308"}
			{@const fillColor =
				severity === "DANGER"
					? "rgba(239, 68, 68, 0.15)"
					: severity === "SAFE"
						? "rgba(34, 197, 94, 0.15)"
						: "rgba(234, 179, 8, 0.15)"}

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
					fill={fillColor}
					stroke={color}
					stroke-width="3"
					stroke-dasharray="8 4"
					class="ocr-word-box"
				/>

				{#if severity !== "SAFE"}
					<g
						class="info-button-group"
						class:active={openTooltipIdx === idx}
						role="button"
						tabindex="0"
						aria-label="Show info"
						onclick={(e) => toggleTooltip(idx, severity, e)}
						onkeydown={(e) => handleKeydown(idx, severity, e)}
						style="cursor: pointer;"
					>
						<circle
							cx={infoX}
							cy={infoY}
							r={infoRadius}
							fill={color}
							class="info-button"
						/>

						{#if severity === "DANGER"}
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
					class="ocr-text"
					dominant-baseline="auto"
					text-anchor="start"
					font-size={h}
					textLength={w}
					lengthAdjust="spacingAndGlyphs"
					fill={color}
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
		class="fixed-tooltip"
		class:danger={tooltipSeverity === "DANGER"}
		class:warning={tooltipSeverity === "WARNING"}
		style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px;"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="tooltip-arrow"></div>
		<div class="tooltip-content">
			{#if tooltipSeverity === "DANGER"}
				<strong class="tooltip-title danger">
					<AlertTriangle size={16} />
					<span>Forged Field</span>
				</strong>
			{:else}
				<strong class="tooltip-title warning">
					<AlertCircle size={16} />
					<span>Suspicious Field</span>
				</strong>
			{/if}
			<p>{getTooltipText(tooltipSeverity)}</p>
		</div>
	</div>
{/if}

<style>
	.info-button {
		pointer-events: all;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
		transition: filter 0.15s ease;
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
		background: rgba(24, 24, 27, 0.98);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		padding: 0;
		pointer-events: auto;
		animation: tooltipFadeIn 0.15s ease-out;
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
		border: 2px solid #ef4444;
	}

	.fixed-tooltip.warning {
		border: 2px solid #eab308;
	}

	.tooltip-arrow {
		position: absolute;
		left: -8px;
		top: 20px;
		width: 0;
		height: 0;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
		border-right: 8px solid rgba(24, 24, 27, 0.98);
	}

	.tooltip-content {
		padding: 14px 16px;
		color: white;
	}

	.tooltip-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		margin-bottom: 6px;
	}

	.tooltip-title.danger {
		color: #fca5a5;
	}

	.tooltip-title.warning {
		color: #fde047;
	}

	.tooltip-content p {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: rgba(255, 255, 255, 0.9);
	}
</style>
/style>

