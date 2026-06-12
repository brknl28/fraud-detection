<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		NavigationBar,
		NavigationBarLeading,
		NavigationBarTrailing,
		Version26Sidebar,
		Version26TabBar,
		Version26TabBarButton,
	} from 'apple-svelte';
	import UploadSection from '$lib/components/UploadSection.svelte';
	import DocumentViewer from '$lib/components/DocumentViewer.svelte';
	import OcrTextList from '$lib/components/OcrTextList.svelte';
	import DecisionPanel from '$lib/components/DecisionPanel.svelte';
	import AnomalyCounts from '$lib/components/AnomalyCounts.svelte';
	import IssuesList from '$lib/components/IssuesList.svelte';
	import { documentStore } from '$lib/stores/document.svelte';

	let viewportWidth = $state(0);
	let mobileTab = $state<'document' | 'issues' | 'decision'>('document');

	let isMobile = $derived(viewportWidth > 0 && viewportWidth <= 768);
	let isTablet = $derived(viewportWidth > 768 && viewportWidth <= 1024);
	let isDesktop = $derived(viewportWidth > 1024);

	onMount(() => {
		documentStore.init();
	});
</script>

<svelte:head>
	<title>Fraud Detection · Analyzer</title>
	<meta name="description" content="Document OCR and anomaly review workspace" />
</svelte:head>

<svelte:window bind:innerWidth={viewportWidth} />

<div class="app-shell" class:mobile={isMobile} class:tablet={isTablet} class:desktop={isDesktop}>
	<header class="topbar">
		<div class="topbar-inner app-frame">
			<NavigationBar showBackground={false} title="Fraud Detection" size="default">
				<svelte:fragment slot="leading">
					<NavigationBarLeading
						symbol="arrow_back_ios_new"
						label="Project"
						onPress={() => goto('/')}
					/>
				</svelte:fragment>
				<svelte:fragment slot="trailing-1">
					<NavigationBarTrailing
						type="symbol"
						symbol="restart_alt"
						label="Reset"
						onPress={() => documentStore.reset()}
					/>
				</svelte:fragment>
			</NavigationBar>
		</div>
	</header>

	<div class="layout app-frame">
		{#if !isMobile || mobileTab === 'document'}
			<section
				id="main-content"
				class="document-section"
				role="main"
				aria-label="Document view"
			>
				<DocumentViewer />
			</section>
		{/if}

		{#if isDesktop}
			<aside class="sidebar-host">
				<Version26Sidebar>
					<div class="sidebar-content">
						<AnomalyCounts />
						<UploadSection />
						<OcrTextList />
						<IssuesList />
						<DecisionPanel />
					</div>
				</Version26Sidebar>
			</aside>
		{:else if isTablet}
			<aside class="stacked-panel">
				<AnomalyCounts />
				<UploadSection />
				<OcrTextList />
				<IssuesList />
				<DecisionPanel />
			</aside>
		{:else if isMobile && mobileTab === 'issues'}
			<section class="mobile-panel">
				<AnomalyCounts />
				<OcrTextList />
				<IssuesList />
			</section>
		{:else if isMobile && mobileTab === 'decision'}
			<section class="mobile-panel">
				<UploadSection />
				<DecisionPanel />
			</section>
		{/if}
	</div>

	{#if isMobile}
		<Version26TabBar>
			<Version26TabBarButton
				symbol="description"
				label="Document"
				state={mobileTab === 'document' ? 'selected' : 'default'}
				onPress={() => (mobileTab = 'document')}
			/>
			<Version26TabBarButton
				symbol="warning"
				label="Issues"
				state={mobileTab === 'issues' ? 'selected' : 'default'}
				onPress={() => (mobileTab = 'issues')}
			/>
			<Version26TabBarButton
				symbol="verified_user"
				label="Decision"
				state={mobileTab === 'decision' ? 'selected' : 'default'}
				onPress={() => (mobileTab = 'decision')}
			/>
		</Version26TabBar>
	{/if}
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		background: var(--bg-grouped-primary);
	}

	.topbar {
		flex-shrink: 0;
		background: var(--materials-chrome);
		backdrop-filter: blur(25px);
		-webkit-backdrop-filter: blur(25px);
		z-index: 5;
	}

	.topbar-inner {
		position: relative;
	}

	.layout {
		flex: 1;
		min-height: 0;
		display: flex;
		align-items: stretch;
		gap: var(--app-panel-gap);
		padding-block: var(--app-page-inset);
		background: var(--bg-grouped-primary);
		overflow: hidden;
	}

	.document-section {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		border: 0.5px solid var(--app-surface-border);
		border-radius: var(--app-panel-radius);
		background: var(--bg-grouped-secondary);
		box-shadow: var(--app-panel-shadow);
	}

	.sidebar-host {
		width: var(--app-sidebar-width);
		flex-shrink: 0;
		height: 100%;
		overflow: hidden;
		border: 0.5px solid var(--app-surface-border);
		border-radius: var(--app-panel-radius);
		background: var(--app-panel-bg);
		box-shadow: var(--app-panel-shadow);
	}

	.sidebar-host :global(aside) {
		width: 100% !important;
		max-width: 100% !important;
		height: 100% !important;
		border-radius: inherit;
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--colors-blue) 5%, var(--app-panel-bg)) 0%,
				var(--app-panel-bg) 48%,
				color-mix(in srgb, var(--bg-grouped-primary) 32%, var(--app-panel-bg)) 100%
			);
		box-shadow: none !important;
		backdrop-filter: blur(28px) saturate(1.24);
		-webkit-backdrop-filter: blur(28px) saturate(1.24);
		overflow: hidden;
		position: relative;
	}

	.sidebar-host :global(aside::before),
	.sidebar-host :global(aside::after) {
		border-radius: inherit;
	}

	.sidebar-content {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: var(--app-panel-gap);
		height: 100%;
		min-height: 0;
		overflow-y: auto;
	}

	.stacked-panel {
		width: var(--app-sidebar-width);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: var(--app-panel-gap);
		overflow-y: auto;
		background: var(--app-panel-bg);
		border: 0.5px solid var(--app-surface-border);
		border-radius: var(--app-panel-radius);
		box-shadow: var(--app-panel-shadow);
	}

	.mobile-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: var(--app-panel-gap);
		overflow-y: auto;
		background: var(--app-panel-bg);
		border: 0.5px solid var(--app-surface-border);
		border-radius: var(--app-panel-radius);
		box-shadow: var(--app-panel-shadow);
	}

	.app-shell.mobile .layout {
		padding-bottom: calc(96px + var(--app-page-inset));
	}

	@media (max-width: 1024px) {
		.layout {
			flex-direction: column;
		}

		.stacked-panel {
			width: 100%;
			border-left: none;
		}
	}

</style>
