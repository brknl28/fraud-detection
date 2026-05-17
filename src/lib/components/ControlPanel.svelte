<script lang="ts">
	import { documentStore } from "$lib/stores/document.svelte";
	import { CheckSquare, XSquare } from "lucide-svelte";
</script>

<div class="side-panel control-panel">
	<div class="controls-container">
		<div class="toggles-group">
			<label class="toggle-switch">
				<span class="toggle-label">Show all fields</span>
				<span class="switch">
					<input
						type="checkbox"
						checked={documentStore.allAnomaliesVisible}
						onchange={() => documentStore.toggleAllAnomalies()}
						aria-label="Show/hide all suspicious fields"
					/>
					<span
						class="slider"
						class:active={documentStore.allAnomaliesVisible}
					></span>
				</span>
			</label>

			<label class="toggle-switch">
				<span class="toggle-label">OCR Text</span>
				<span class="switch">
					<input
						type="checkbox"
						checked={documentStore.ocrVisible}
						onchange={() => documentStore.toggleOcr()}
						aria-label="Show/hide OCR text"
					/>
					<span class="slider" class:active={documentStore.ocrVisible}
					></span>
				</span>
			</label>
		</div>

		<div class="actions-group">
			<button
				type="button"
				class="action-btn"
				class:active={documentStore.selectedOcrWordIds.size ===
					documentStore.ocrLines.length &&
					documentStore.ocrLines.length > 0}
				onclick={() => documentStore.selectAllOcrWords()}
				disabled={documentStore.ocrLines.length === 0}
				aria-label="Select all"
			>
				<CheckSquare size={16} />
				<span>Select all</span>
			</button>
			<button
				type="button"
				class="action-btn"
				onclick={() => documentStore.deselectAllOcrWords()}
				disabled={documentStore.selectedOcrWordIds.size === 0}
				aria-label="Reset"
			>
				<XSquare size={16} />
				<span>Reset</span>
			</button>
		</div>
	</div>
</div>
