<script lang="ts">
	import { documentStore } from "$lib/stores/document.svelte";
	import { CheckSquare, XSquare } from "lucide-svelte";
</script>

<div class="side-panel control-panel">
	<div class="controls-container">
		<div class="toggles-group">
			<label class="toggle-switch">
				<span class="toggle-label">Alle Bereiche anzeigen</span>
				<span class="switch">
					<input
						type="checkbox"
						checked={documentStore.allAnomaliesVisible}
						onchange={() => documentStore.toggleAllAnomalies()}
						aria-label="Alle verdächtigen Bereiche anzeigen/ausblenden"
					/>
					<span
						class="slider"
						class:active={documentStore.allAnomaliesVisible}
					></span>
				</span>
			</label>

			<label class="toggle-switch">
				<span class="toggle-label">OCR-Text</span>
				<span class="switch">
					<input
						type="checkbox"
						checked={documentStore.ocrVisible}
						onchange={() => documentStore.toggleOcr()}
						aria-label="OCR-Text anzeigen/ausblenden"
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
				aria-label="Alle auswählen"
			>
				<CheckSquare size={16} />
				<span>Alle auswählen</span>
			</button>
			<button
				type="button"
				class="action-btn"
				onclick={() => documentStore.deselectAllOcrWords()}
				disabled={documentStore.selectedOcrWordIds.size === 0}
				aria-label="Zurücksetzen"
			>
				<XSquare size={16} />
				<span>Zurücksetzen</span>
			</button>
		</div>
	</div>
</div>
