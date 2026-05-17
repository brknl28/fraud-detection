<script lang="ts">
	import { documentStore } from "$lib/stores/document.svelte";
	import { Upload, Loader2 } from "lucide-svelte";

	let fileInput: HTMLInputElement;
	let isDragOver = $state(false);

	function handleClick() {
		if (documentStore.isProcessingUpload) return;
		fileInput?.click();
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			processFile(file);
		}

		if (target) target.value = "";
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!documentStore.isProcessingUpload) {
			isDragOver = true;
		}
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;

		if (documentStore.isProcessingUpload) return;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.type.startsWith("image/")) {
				processFile(file);
			} else {
				alert("Please select an image file (JPG or PNG)");
			}
		}
	}

	async function processFile(file: File) {
		if (file.size > 10 * 1024 * 1024) {
			alert("File too large. Maximum size is 10MB.");
			return;
		}

		if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
			alert(
				"Unsupported file format. Please upload JPG or PNG.",
			);
			return;
		}

		if (documentStore.isDuplicateDocument(file.name, file.size)) {
			const confirmed = confirm(
				`A document named "${file.name}" already exists.\n\nDo you want to continue?`,
			);
			if (!confirmed) {
				return;
			}
		}

		await documentStore.uploadDocument(file);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleClick();
		}
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
<button
	type="button"
	class="upload-button"
	class:drag-over={isDragOver}
	class:processing={documentStore.isProcessingUpload}
	onclick={handleClick}
	onkeydown={handleKeydown}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	aria-label="Select file or drag here"
	disabled={documentStore.isProcessingUpload}
>
	{#if documentStore.isProcessingUpload}
		<Loader2 size={18} class="upload-icon spinning" />
		<span class="upload-text">Processing...</span>
	{:else}
		<Upload size={18} class="upload-icon" />
		<span class="upload-text">Upload Document</span>
	{/if}
</button>
