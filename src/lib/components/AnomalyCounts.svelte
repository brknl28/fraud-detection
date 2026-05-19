<script lang="ts">
	import { documentStore } from '$lib/stores/document.svelte';
	import Symbol from './Symbol.svelte';

	let yellowCount = $derived(
		documentStore.anomalies.filter((a) => a.type === 'original').length,
	);
	let redCount = $derived(
		documentStore.anomalies.filter((a) => a.type === 'forged').length,
	);
	let totalAnomalies = $derived(yellowCount + redCount);

	let score = $derived(documentStore.fraudScore);
	let status = $derived(documentStore.authenticityStatus);

	let isExpanded = $state(false);

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function getStatusToken(s: string) {
		if (s === 'SAFE') return 'var(--colors-green)';
		if (s === 'CAUTION') return 'var(--colors-yellow)';
		return 'var(--colors-red)';
	}

	function getStatusText(s: string) {
		if (s === 'SAFE') return 'Safe';
		if (s === 'CAUTION') return 'Caution';
		return 'Critical';
	}
</script>

<div
	class="anomaly-card liquid-glass liquid-glass-small"
	role="button"
	tabindex="0"
	onclick={toggleExpand}
	onkeydown={(e) =>
		(e.key === 'Enter' || e.key === ' ') &&
		(e.preventDefault(), toggleExpand())}
	aria-label="Review Score - {score} points, {getStatusText(status)}"
	aria-expanded={isExpanded}
	style:--score-color={getStatusToken(status)}
>
	<div class="card-header">
		<div class="score-ring">
			<svg viewBox="0 0 36 36" class="circular-chart">
				<path
					class="circle-bg"
					d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
				/>
				<path
					class="circle"
					stroke-dasharray="{score}, 100"
					d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
				/>
			</svg>
			<span class="score-text">{score}</span>
		</div>

		<div class="header-info">
			<div class="status-title" style:color={getStatusToken(status)}>
				{getStatusText(status)}
			</div>
			<div class="status-subtitle">Review Score</div>
		</div>

		<div class="expand-icon">
			<Symbol name={isExpanded ? 'expand_less' : 'expand_more'} size="small" />
		</div>
	</div>

	{#if isExpanded}
		<div class="card-details">
			<div class="divider"></div>
			<p class="count-description">
				<strong>{redCount}</strong> forged ·
				<strong>{yellowCount}</strong> suspicious ·
				<strong>{totalAnomalies}</strong> total
			</p>
		</div>
	{/if}
</div>

<style>
	.anomaly-card {
		padding: 14px 16px;
		border-radius: 16px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: var(--app-card-bg);
		border: 0.5px solid var(--app-glass-border);
		box-shadow: inset 0 1px color-mix(in srgb, var(--grays-white) 36%, transparent);
		backdrop-filter: blur(18px) saturate(1.18);
		-webkit-backdrop-filter: blur(18px) saturate(1.18);
	}

	.anomaly-card::before,
	.anomaly-card::after {
		border-radius: inherit;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.score-ring {
		position: relative;
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.circular-chart {
		display: block;
		width: 100%;
		height: 100%;
	}

	.circle-bg {
		fill: none;
		stroke: var(--fills-tertiary);
		stroke-width: 3.8;
	}

	.circle {
		fill: none;
		stroke: var(--score-color);
		stroke-width: 3.8;
		stroke-linecap: round;
	}

	.score-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 14px;
		font-weight: 600;
		color: var(--labels-primary);
	}

	.header-info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.status-title {
		font-size: 17px;
		font-weight: 600;
		line-height: 22px;
	}

	.status-subtitle {
		font-size: 13px;
		color: var(--labels-secondary);
	}

	.expand-icon {
		color: var(--labels-secondary);
	}

	.card-details {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.divider {
		height: 0.5px;
		background: var(--separators-non-opaque);
	}

	.count-description {
		font-size: 13px;
		color: var(--labels-secondary);
		text-align: center;
	}
</style>
