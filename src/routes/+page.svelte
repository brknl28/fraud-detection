<script lang="ts">
	import UploadSection from "$lib/components/UploadSection.svelte";
	import DocumentViewer from "$lib/components/DocumentViewer.svelte";
	import OcrTextList from "$lib/components/OcrTextList.svelte";
	import DecisionPanel from "$lib/components/DecisionPanel.svelte";
	import AnomalyCounts from "$lib/components/AnomalyCounts.svelte";
	import { documentStore } from "$lib/stores/document.svelte";
	import { onMount } from "svelte";

	onMount(() => {
		documentStore.init();
	});
</script>

<svelte:head>
	<title>Betrugserkennung</title>
	<meta
		name="description"
		content="Dokumenten-Betrugserkennung und Verifizierungssystem"
	/>
</svelte:head>

<div class="container">
	<section
		id="main-content"
		class="document-section"
		role="main"
		aria-label="Dokumentenansicht"
	>
		<DocumentViewer />
	</section>

	<div class="right-panel">
		<AnomalyCounts />

		<div class="button-row">
			<UploadSection />
		</div>

		<OcrTextList />

		<div class="button-row">
			<DecisionPanel />
		</div>
	</div>
</div>
