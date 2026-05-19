<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		NavigationBar,
		NavigationBarTrailing,
		Collection,
		Version26Button,
		Version26List,
		Version26ListRow,
		RegularProgressIndicator,
	} from 'apple-svelte';
	import Symbol from '$lib/components/Symbol.svelte';
	import { documentStore } from '$lib/stores/document.svelte';

	let viewportWidth = $state(0);
	let activeCategory = $state<'all' | 'identity' | 'financial' | 'legal'>('all');

	let isCompact = $derived(viewportWidth > 0 && viewportWidth <= 768);
	let isNarrow = $derived(viewportWidth > 0 && viewportWidth <= 1024);
	let primarySample = $derived(documentStore.documents[0]);
	let filteredSamples = $derived(
		activeCategory === 'all'
			? documentStore.documents
			: documentStore.documents.filter((preset) => sampleCategory(preset) === activeCategory),
	);
	let anomalyTotal = $derived(
		documentStore.documents.reduce((total, preset) => total + preset.anomalies.length, 0),
	);
	let totalOcrWords = $derived(
		documentStore.documents.reduce((total, preset) => total + fieldCount(preset), 0),
	);
	let flaggedRegions = $derived(
		documentStore.documents.reduce(
			(total, preset) => total + preset.anomalies.filter((a) => a.type === 'forged').length,
			0,
		),
	);

	const categoryFilters = [
		{ id: 'all', label: 'All', symbol: 'apps' },
		{ id: 'identity', label: 'Identity', symbol: 'badge' },
		{ id: 'financial', label: 'Financial', symbol: 'account_balance' },
		{ id: 'legal', label: 'Legal', symbol: 'gavel' },
	] as const;

	const workflow = [
		{
			symbol: 'upload_file',
			title: 'Load an image',
			body: 'Start with a JPG or PNG upload, or open one of the tracked document fixtures.',
			tint: 'var(--colors-blue)',
		},
		{
			symbol: 'document_scanner',
			title: 'Run OCR',
			body: 'Tesseract.js extracts words and confidence values through SvelteKit API routes.',
			tint: 'var(--colors-indigo)',
		},
		{
			symbol: 'verified_user',
			title: 'Review signals',
			body: 'The UI groups low-confidence OCR words and annotated regions for manual inspection.',
			tint: 'var(--colors-green)',
		},
	];

	const reviewSignals = [
		{
			symbol: 'document_scanner',
			title: 'OCR confidence',
			body: 'Words below confidence thresholds are grouped with deterministic review labels.',
			tint: 'var(--colors-blue)',
		},
		{
			symbol: 'select_all',
			title: 'Annotated regions',
			body: 'Fixture metadata can mark document regions as suspicious or forged for overlay review.',
			tint: 'var(--colors-orange)',
		},
		{
			symbol: 'fact_check',
			title: 'Manual verdict',
			body: 'The final forged/genuine state is a reviewer action, not an automatic legal decision.',
			tint: 'var(--colors-green)',
		},
	];

	const projectNotes = [
		{
			title: 'SvelteKit workspace',
			subtitle: 'UI routes, API endpoints, and stores live under src/.',
			symbol: 'terminal',
			tint: 'var(--colors-blue)',
		},
		{
			title: 'Tesseract.js OCR',
			subtitle: 'Uploads are processed through the local /api/ocr endpoint.',
			symbol: 'text_fields',
			tint: 'var(--colors-indigo)',
		},
		{
			title: 'Document fixtures',
			subtitle: 'Sample images and OCR JSON files are tracked with the app.',
			symbol: 'folder_open',
			tint: 'var(--colors-orange)',
		},
		{
			title: 'Deterministic scoring',
			subtitle: 'Severity comes from OCR confidence and anomaly metadata.',
			symbol: 'rule',
			tint: 'var(--colors-green)',
		},
	];

	let projectMetrics = $derived([
		{
			label: 'Fixture documents',
			value: String(documentStore.documents.length),
			detail: 'Loaded from src/lib/assets/documents',
			tint: 'var(--colors-blue)',
			symbol: 'folder_open',
		},
		{
			label: 'OCR words',
			value: String(totalOcrWords),
			detail: 'Parsed from cached OCR JSON and uploads',
			tint: 'var(--colors-indigo)',
			symbol: 'text_fields',
		},
		{
			label: 'Annotated regions',
			value: String(anomalyTotal),
			detail: `${flaggedRegions} marked forged in metadata`,
			tint: 'var(--colors-orange)',
			symbol: 'select_all',
		},
		{
			label: 'Input formats',
			value: 'JPG / PNG',
			detail: 'Accepted by the upload endpoint',
			tint: 'var(--colors-green)',
			symbol: 'image',
		},
	]);

	function presetSearchText(preset: (typeof documentStore.documents)[number]) {
		return `${preset.label} ${preset.ocrText ?? ''} ${(preset as any).ocrData?.fullText ?? ''}`.toLowerCase();
	}

	function displayLabel(preset: (typeof documentStore.documents)[number]) {
		const text = presetSearchText(preset);
		if (text.includes('spotify')) return 'Spotify receipt';
		if (text.includes('invoice')) return 'Content Pass invoice';
		if (text.includes('passport')) return 'Passport scan';
		if (text.includes('driver')) return 'Driver license';
		return preset.label;
	}

	function fieldCount(preset: (typeof documentStore.documents)[number]) {
		return preset.ocrLines?.length || (preset as any).ocrData?.words?.length || 0;
	}

	function sampleCategory(preset: (typeof documentStore.documents)[number]): 'identity' | 'financial' | 'legal' {
		const normalized = presetSearchText(preset);
		if (/(invoice|tax|bank|receipt|statement)/.test(normalized)) return 'financial';
		if (/(contract|deed|permit|form|certificate)/.test(normalized)) return 'legal';
		return 'identity';
	}

	function startNewAnalysis() {
		documentStore.reset();
		goto('/analyze');
	}

	async function openSample(presetId: string) {
		await documentStore.init();
		documentStore.setDocument(presetId);
		goto('/analyze');
	}

	async function tryFirstSample() {
		await documentStore.init();
		const first = documentStore.documents[0];
		if (first) await openSample(first.id);
		else startNewAnalysis();
	}

	onMount(() => {
		documentStore.init();
	});
</script>

<svelte:head>
	<title>Fraud Detection</title>
	<meta name="description" content="Local document fraud review workspace." />
</svelte:head>

<svelte:window bind:innerWidth={viewportWidth} />

<div class="dashboard" class:compact={isCompact} class:narrow={isNarrow}>
	<header class="topbar">
		<NavigationBar showBackground={true} title="Fraud Detection" size="default">
			<svelte:fragment slot="trailing-1">
				<NavigationBarTrailing
					type="symbol"
					symbol="help_outline"
					label="Apple Svelte"
					onPress={() => window.open('https://apple-svelte.vercel.app/', '_blank')}
				/>
			</svelte:fragment>
			<svelte:fragment slot="trailing-2">
				<NavigationBarTrailing
					type="text-emphasized"
					symbol="play_arrow"
					label="Analyze"
					onPress={startNewAnalysis}
				/>
			</svelte:fragment>
		</NavigationBar>
	</header>

	<main id="main-content" class="workspace" aria-label="Fraud Detection project overview">
		<section class="overview-panel">
			<div class="overview-copy">
				<p class="footnote-emphasized eyebrow">Document inspection</p>
				<h1 class="large-title-emphasized">Fraud Detection</h1>
				<p class="body overview-text">
					A SvelteKit workspace for running OCR on document images, reviewing confidence-based
					signals, and checking annotated regions in context.
				</p>

				<div class="overview-actions">
					<Version26Button
						labelType="symbol-and-text"
						symbol="bolt"
						label="Open analyzer"
						size="large"
						onPress={startNewAnalysis}
					/>
					<Version26Button
						labelType="symbol-and-text"
						symbol="play_circle"
						label="Load fixture"
						size="large"
						style="--colors-accent: var(--colors-green); --colors-accent-2: var(--colors-green-2);"
						onPress={tryFirstSample}
					/>
				</div>

				<div class="workspace-summary" aria-label="Workspace summary">
					<div class="summary-item">
						<span class="summary-value">{documentStore.documents.length}</span>
						<span class="footnote summary-label">Fixtures</span>
					</div>
					<div class="summary-divider" aria-hidden="true"></div>
					<div class="summary-item">
						<span class="summary-value">{totalOcrWords}</span>
						<span class="footnote summary-label">OCR words</span>
					</div>
					<div class="summary-divider" aria-hidden="true"></div>
					<div class="summary-item">
						<span class="summary-value">{anomalyTotal}</span>
						<span class="footnote summary-label">Regions</span>
					</div>
				</div>
			</div>

			<div class="overview-preview">
				{#if documentStore.isLoading && !primarySample}
					<div class="loading-panel">
						<RegularProgressIndicator showLabel={true} label="Loading fixtures..." />
					</div>
				{:else if primarySample}
					<button
						type="button"
						class="document-preview"
						onclick={() => openSample(primarySample.id)}
						aria-label="Open fixture document {primarySample.label}"
					>
						<img src={primarySample.imageSrc} alt={primarySample.imageAlt} />
						<span class="preview-badge caption2-emphasized">Fixture 01</span>
						<span class="preview-status">
							<Symbol name="warning" size="small" color="var(--colors-red)" />
							<span class="caption2-emphasized">
								{primarySample.anomalies.filter((a) => a.type === 'forged').length} flagged
							</span>
						</span>
					</button>

					<div class="preview-details">
						<div class="detail-row">
							<div class="detail-icon" style:--detail-color="var(--colors-blue)">
								<Symbol name="description" size="small" />
							</div>
							<div>
								<p class="footnote-emphasized">{displayLabel(primarySample)}</p>
								<p class="caption1 detail-muted">Current fixture</p>
							</div>
						</div>
						<div class="detail-row">
							<div class="detail-icon" style:--detail-color="var(--colors-green)">
								<Symbol name="fact_check" size="small" />
							</div>
							<div>
								<p class="footnote-emphasized">{fieldCount(primarySample)} OCR fields</p>
								<p class="caption1 detail-muted">Ready to inspect</p>
							</div>
						</div>
					</div>
				{:else}
					<div class="empty-preview">
						<Symbol name="folder_open" size="large" color="var(--labels-tertiary)" />
						<p class="headline">No document fixtures</p>
						<p class="footnote">Add images and OCR JSON files to populate this view.</p>
					</div>
				{/if}
			</div>
		</section>

		<section class="section">
			<div class="section-header">
				<div>
					<p class="footnote-emphasized eyebrow">Repository state</p>
					<h2 class="title2-emphasized">Project overview</h2>
				</div>
			</div>

			<Collection style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); row-gap: 16px;">
				{#each projectMetrics as metric (metric.label)}
					<article class="metric-card" style:--metric-tint={metric.tint}>
						<div class="metric-head">
							<div class="metric-icon">
								<Symbol name={metric.symbol} size="medium" color={metric.tint} />
							</div>
						</div>
						<p class="footnote metric-label">{metric.label}</p>
						<p class="title1-emphasized metric-value">{metric.value}</p>
						<p class="footnote metric-detail">{metric.detail}</p>
					</article>
				{/each}
			</Collection>
		</section>

		<section class="split-section">
			<div class="split-col">
				<div class="section-header">
					<div>
						<p class="footnote-emphasized eyebrow">Signals</p>
						<h2 class="title2-emphasized">What the app checks</h2>
					</div>
				</div>

				<div class="workflow-list">
					{#each reviewSignals as item (item.title)}
						<div class="workflow-row" style:--step-tint={item.tint}>
							<div class="workflow-icon">
								<Symbol name={item.symbol} size="medium" color={item.tint} />
							</div>
							<div class="workflow-text">
								<p class="headline">{item.title}</p>
								<p class="footnote muted">{item.body}</p>
							</div>
							<Symbol name="chevron_right" size="small" color="var(--labels-tertiary)" />
						</div>
						{/each}
					</div>
			</div>

			<div class="split-col">
				<div class="section-header">
					<div>
						<p class="footnote-emphasized eyebrow">Pipeline</p>
						<h2 class="title2-emphasized">How it runs</h2>
					</div>
				</div>

				<div class="workflow-list">
					{#each workflow as item (item.title)}
						<div class="workflow-row" style:--step-tint={item.tint}>
							<div class="workflow-icon">
								<Symbol name={item.symbol} size="medium" color={item.tint} />
							</div>
							<div class="workflow-text">
								<p class="headline">{item.title}</p>
								<p class="footnote muted">{item.body}</p>
							</div>
							<Symbol name="chevron_right" size="small" color="var(--labels-tertiary)" />
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="section">
			<div class="section-header">
				<div>
					<p class="footnote-emphasized eyebrow">Fixtures</p>
					<h2 class="title2-emphasized">Tracked documents</h2>
				</div>
				<div class="category-rail" aria-label="Fixture filters">
					{#each categoryFilters as cat (cat.id)}
						<button
							type="button"
							class="cat-chip"
							class:active={activeCategory === cat.id}
							onclick={() => (activeCategory = cat.id)}
						>
							<Symbol name={cat.symbol} size="small" />
							<span class="footnote-emphasized">{cat.label}</span>
						</button>
					{/each}
				</div>
			</div>

			{#if documentStore.isLoading && documentStore.documents.length === 0}
				<div class="samples-loading">
					<RegularProgressIndicator showLabel={true} label="Loading fixtures..." />
				</div>
			{:else if filteredSamples.length === 0}
				<div class="empty-panel">
					<Symbol name="folder_open" size="large" color="var(--labels-tertiary)" />
					<p class="headline">No fixtures in this category</p>
					<p class="footnote muted">Switch filters or add another document image.</p>
				</div>
			{:else}
				<Collection style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); row-gap: 16px;">
					{#each filteredSamples as preset, i (preset.id)}
						<button
							type="button"
							class="sample-card"
							onclick={() => openSample(preset.id)}
							aria-label="Open {preset.label} in analyzer"
						>
							<div class="sample-thumb">
								<img src={preset.imageSrc} alt={preset.imageAlt} loading="lazy" />
								<span class="sample-index caption2-emphasized">
									Fixture {String(i + 1).padStart(2, '0')}
								</span>
							</div>
							<div class="sample-body">
								<p class="headline sample-title">{displayLabel(preset)}</p>
								<p class="footnote sample-meta">
									<Symbol name="warning" size="small" color="var(--colors-red)" />
									<span>{preset.anomalies.filter((a) => a.type === 'forged').length} flagged</span>
									<span class="dot-sep">/</span>
									<Symbol name="text_fields" size="small" color="var(--labels-tertiary)" />
									<span>{fieldCount(preset)} fields</span>
								</p>
							</div>
							<div class="sample-cta">
								<span class="footnote-emphasized">Open in analyzer</span>
								<Symbol name="chevron_right" size="small" color="var(--colors-accent)" />
							</div>
						</button>
					{/each}
				</Collection>
			{/if}
		</section>

		<section class="split-section">
			<div class="split-col">
				<div class="section-header">
					<div>
						<p class="footnote-emphasized eyebrow">Implementation</p>
						<h2 class="title2-emphasized">Project notes</h2>
					</div>
					<button type="button" class="link-btn" onclick={() => goto('/analyze')}>
						<span class="footnote-emphasized">Open analyzer</span>
						<Symbol name="arrow_forward" size="small" />
					</button>
				</div>

				<Version26List>
					{#each projectNotes as note (note.title)}
						<Version26ListRow
							title={note.title}
							showSubtitle={true}
							subtitle={note.subtitle}
						>
							<svelte:fragment slot="trailing">
								<div class="recent-trailing">
									<Symbol name={note.symbol} size="small" color={note.tint} />
									<Symbol name="chevron_right" size="small" color="var(--labels-tertiary)" />
								</div>
							</svelte:fragment>
						</Version26ListRow>
					{/each}
				</Version26List>
			</div>

			<div class="split-col">
				<div class="section-header">
					<div>
						<p class="footnote-emphasized eyebrow">Run locally</p>
						<h2 class="title2-emphasized">Analyzer workspace</h2>
					</div>
				</div>

				<div class="action-panel">
					<div class="action-icon">
						<Symbol name="shield_person" size="large" color="var(--colors-blue)" />
					</div>
					<div class="action-copy">
						<p class="headline">Use the analyzer to validate fixtures or uploaded images.</p>
						<p class="footnote muted">
							The canvas, OCR confidence groups, annotated regions, and verdict controls stay
							together for repeatable local testing.
						</p>
					</div>
					<Version26Button
						labelType="symbol-and-text"
						symbol="open_in_new"
						label="Analyze document"
						size="medium"
						onPress={startNewAnalysis}
					/>
				</div>
			</div>
		</section>

		<footer class="footer-row">
			<p class="footnote">SvelteKit / Svelte 5 / apple-svelte / Tesseract.js</p>
		</footer>
	</main>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: var(--bg-grouped-primary);
		overflow-y: auto;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 5;
		background: var(--materials-chrome);
		backdrop-filter: blur(25px);
		-webkit-backdrop-filter: blur(25px);
	}

	.workspace {
		width: min(100%, 1280px);
		margin: 0 auto;
		padding: 28px var(--app-page-inset) 96px;
		display: flex;
		flex-direction: column;
		gap: 36px;
	}

	.overview-panel {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
		gap: 24px;
		align-items: stretch;
		padding: 24px;
		border-radius: 20px;
		background: var(--bg-grouped-secondary);
		border: 0.5px solid var(--separators-non-opaque);
	}

	.overview-copy {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 14px;
		min-width: 0;
	}

	.eyebrow {
		color: var(--colors-accent);
		letter-spacing: 0;
	}

	.overview-text {
		max-width: 54ch;
		color: var(--labels-secondary);
	}

	.overview-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 4px;
	}

	.workspace-summary {
		display: flex;
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
		margin-top: 8px;
		padding-top: 18px;
		border-top: 0.5px solid var(--separators-non-opaque);
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 104px;
	}

	.summary-value {
		font-size: 24px;
		font-weight: 700;
		line-height: 29px;
		letter-spacing: 0;
		color: var(--labels-primary);
	}

	.summary-label,
	.muted {
		color: var(--labels-secondary);
	}

	.summary-divider {
		width: 0.5px;
		height: 34px;
		background: var(--separators-non-opaque);
	}

	.overview-preview {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 190px;
		gap: 14px;
		min-height: 300px;
	}

	.document-preview {
		position: relative;
		display: block;
		min-width: 0;
		overflow: hidden;
		border-radius: 16px;
		background: var(--fills-tertiary);
		border: 0.5px solid var(--separators-non-opaque);
		text-align: left;
	}

	.document-preview img {
		width: 100%;
		height: 100%;
		min-height: 300px;
		object-fit: cover;
		display: block;
		transition: transform 0.2s ease;
	}

	.document-preview:hover img,
	.document-preview:focus-visible img {
		transform: scale(1.015);
	}

	.preview-badge,
	.preview-status,
	.sample-index {
		position: absolute;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 9px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--materials-chrome) 82%, transparent);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		color: var(--labels-primary);
	}

	.preview-badge {
		top: 12px;
		left: 12px;
	}

	.preview-status {
		right: 12px;
		bottom: 12px;
	}

	.preview-details {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.detail-row,
	.workflow-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px;
		border-radius: 16px;
		background: var(--bg-grouped-tertiary);
	}

	.detail-icon,
	.workflow-icon,
	.metric-icon,
	.action-icon {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: color-mix(in srgb, var(--detail-color, var(--colors-accent)) 14%, transparent);
		color: var(--detail-color, var(--colors-accent));
	}

	.detail-muted {
		color: var(--labels-secondary);
	}

	.loading-panel,
	.empty-preview,
	.empty-panel,
	.samples-loading {
		min-height: 180px;
		padding: 28px;
		border-radius: 16px;
		background: var(--bg-grouped-secondary);
		border: 0.5px solid var(--separators-non-opaque);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-align: center;
	}

	.empty-preview {
		grid-column: 1 / -1;
	}

	.section,
	.split-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 16px;
		flex-wrap: wrap;
	}

	.section-header > div:first-child {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.metric-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		border-radius: 16px;
		background: var(--bg-grouped-secondary);
		border: 0.5px solid var(--separators-non-opaque);
	}

	.metric-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.metric-icon {
		background: color-mix(in srgb, var(--metric-tint) 14%, transparent);
	}

	.metric-label {
		color: var(--labels-secondary);
	}

	.metric-detail {
		color: var(--labels-secondary);
		min-height: 36px;
	}

	.metric-value {
		color: var(--labels-primary);
	}

	.split-section {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 24px;
	}

	.action-panel {
		padding: 18px;
		border-radius: 16px;
		background: var(--bg-grouped-secondary);
		border: 0.5px solid var(--separators-non-opaque);
	}

	.workflow-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.workflow-row {
		background: var(--bg-grouped-secondary);
		border: 0.5px solid var(--separators-non-opaque);
	}

	.workflow-icon {
		--detail-color: var(--step-tint);
	}

	.workflow-text {
		flex: 1;
		min-width: 0;
	}

	.category-rail {
		display: inline-flex;
		gap: 4px;
		padding: 4px;
		border-radius: 999px;
		background: var(--fills-tertiary);
	}

	.cat-chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 6px 12px;
		border-radius: 999px;
		color: var(--labels-secondary);
		background: transparent;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.cat-chip:hover,
	.cat-chip.active {
		color: var(--labels-primary);
		background: var(--bg-grouped-secondary);
	}

	.sample-card {
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		border-radius: 16px;
		background: var(--bg-grouped-secondary);
		border: 0.5px solid var(--separators-non-opaque);
		text-align: left;
		transition: transform 0.2s ease, border-color 0.2s ease;
	}

	.sample-card:hover,
	.sample-card:focus-visible {
		transform: translateY(-2px);
		border-color: color-mix(in srgb, var(--colors-accent) 45%, var(--separators-non-opaque));
	}

	.sample-thumb {
		position: relative;
		aspect-ratio: 4 / 3;
		background: var(--fills-tertiary);
		overflow: hidden;
	}

	.sample-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.sample-index {
		left: 10px;
		bottom: 10px;
	}

	.sample-body {
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 14px 16px 10px;
	}

	.sample-title {
		color: var(--labels-primary);
		word-break: break-word;
	}

	.sample-meta {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--labels-secondary);
		flex-wrap: wrap;
	}

	.dot-sep {
		color: var(--labels-tertiary);
	}

	.sample-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 11px 16px;
		border-top: 0.5px solid var(--separators-non-opaque);
		color: var(--colors-accent);
	}

	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 10px;
		border-radius: 999px;
		color: var(--colors-accent);
	}

	.link-btn:hover {
		background: color-mix(in srgb, var(--colors-accent) 12%, transparent);
	}

	.recent-trailing {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.action-panel {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 14px;
		align-items: center;
	}

	.action-copy {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.action-panel :global(button) {
		grid-column: 1 / -1;
		justify-content: center;
		width: 100%;
	}

	.footer-row {
		display: flex;
		justify-content: center;
		padding: 4px 0;
		color: var(--labels-tertiary);
		text-align: center;
	}

	@media (max-width: 1024px) {
		.workspace {
			padding-top: 22px;
			gap: 30px;
		}

		.overview-panel {
			grid-template-columns: 1fr;
		}

		.overview-preview {
			grid-template-columns: minmax(0, 1fr);
		}

		.preview-details {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.split-section {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.workspace {
			padding: 18px 14px 80px;
			gap: 26px;
		}

		.overview-panel {
			padding: 18px;
			border-radius: 18px;
		}

		.overview-actions {
			flex-direction: column;
		}

		.overview-actions :global(button) {
			width: 100%;
			justify-content: center;
		}

		.workspace-summary {
			align-items: stretch;
			gap: 12px;
		}

		.summary-divider {
			display: none;
		}

		.summary-item {
			min-width: 0;
			flex: 1 1 120px;
			padding: 10px 12px;
			border-radius: 14px;
			background: var(--bg-grouped-tertiary);
		}

		.preview-details {
			grid-template-columns: 1fr;
		}

		.section-header {
			align-items: flex-start;
			flex-direction: column;
		}

		.section-header > * {
			width: 100%;
		}

		.category-rail {
			overflow-x: auto;
			justify-content: flex-start;
		}

	}
</style>
