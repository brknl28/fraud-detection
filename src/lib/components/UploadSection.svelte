<script lang="ts">
	import { documentStore } from '$lib/stores/document.svelte';
	import {
		Version26Button,
		Version26ActionSheet,
		Version26ActionSheetButton,
		RegularProgressIndicator,
	} from 'apple-svelte';

	let fileInput: HTMLInputElement;
	let actionSheetState = $state<'default' | 'hidden'>('hidden');

	function openSheet() {
		if (documentStore.isProcessingUpload) return;
		actionSheetState = 'default';
	}

	function pickFromDevice() {
		actionSheetState = 'hidden';
		fileInput?.click();
	}

	function loadPreset(id: string) {
		actionSheetState = 'hidden';
		documentStore.setDocument(id);
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			processFile(file);
		}
		if (target) target.value = '';
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (documentStore.isProcessingUpload) return;
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.type.startsWith('image/')) {
				processFile(file);
			} else {
				alert('Please select an image file (JPG or PNG)');
			}
		}
	}

	async function processFile(file: File) {
		if (file.size > 10 * 1024 * 1024) {
			alert('File too large. Maximum size is 10MB.');
			return;
		}
		if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
			alert('Unsupported file format. Please upload JPG or PNG.');
			return;
		}
		if (documentStore.isDuplicateDocument(file.name, file.size)) {
			const confirmed = confirm(
				`A document named "${file.name}" already exists.\n\nDo you want to continue?`,
			);
			if (!confirmed) return;
		}
		await documentStore.uploadDocument(file);
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/jpeg,image/png,image/jpg"
	onchange={handleFileChange}
	aria-label="Upload document image"
	class="file-input"
	disabled={documentStore.isProcessingUpload}
/>

<div
	class="upload-wrapper app-liquid-surface liquid-glass liquid-glass-medium"
	role="presentation"
	ondragover={handleDragOver}
	ondrop={handleDrop}
>
	{#if documentStore.isProcessingUpload}
		<div class="processing-state">
			<RegularProgressIndicator showLabel={true} label="Processing…" />
		</div>
	{:else}
		<Version26Button
			labelType="symbol-and-text"
			symbol="upload"
			label="Upload image"
			size="medium"
			onPress={openSheet}
		/>
	{/if}
</div>

<Version26ActionSheet
	bind:state={actionSheetState}
	showHeader={true}
	headerTitle="Load document"
	showDescription={true}
	headerDescription="Choose a JPG/PNG image or load a tracked fixture."
>
	<Version26ActionSheetButton
		state="primary"
		label="Choose image"
		onPress={pickFromDevice}
	/>
	{#each documentStore.documents as preset (preset.id)}
		<Version26ActionSheetButton
			state="secondary"
			label={preset.label}
			onPress={() => loadPreset(preset.id)}
		/>
	{/each}
</Version26ActionSheet>

<style>
	.file-input {
		display: none;
	}

	.upload-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding: 14px;
		border-radius: 18px;
	}

	.upload-wrapper :global(button) {
		width: 100%;
		justify-content: center;
	}

	.processing-state {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 8px 0;
		width: 100%;
	}
</style>
