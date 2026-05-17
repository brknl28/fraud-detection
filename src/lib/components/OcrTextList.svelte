<script lang="ts">
    import { documentStore } from "$lib/stores/document.svelte";
    import {
        ChevronDown,
        ChevronRight,
        Eye,
        EyeOff,
        CheckCircle2,
        Circle,
    } from "lucide-svelte";

    let isRedOpen = $state(true);
    let isYellowOpen = $state(true);
    let isGreenOpen = $state(false);

    let redItems = $derived(
        documentStore.ocrLines
            .map((line, index) => ({ line, index }))
            .filter(
                (item) =>
                    (item.line as any).severity === "DANGER" ||
                    (item.line as any).category === "critical",
            ),
    );
    let yellowItems = $derived(
        documentStore.ocrLines
            .map((line, index) => ({ line, index }))
            .filter(
                (item) =>
                    !(
                        (item.line as any).severity === "DANGER" ||
                        (item.line as any).category === "critical"
                    ) && (item.line as any).severity !== "SAFE",
            ),
    );
    let greenItems = $derived(
        documentStore.ocrLines
            .map((line, index) => ({ line, index }))
            .filter((item) => (item.line as any).severity === "SAFE"),
    );

    function toggleRed() {
        isRedOpen = !isRedOpen;
    }
    function toggleYellow() {
        isYellowOpen = !isYellowOpen;
    }
    function toggleGreen() {
        isGreenOpen = !isGreenOpen;
    }
</script>

<div class="quick-controls">
    <button
        type="button"
        class="control-chip"
        class:active={documentStore.allAnomaliesVisible}
        onclick={() => documentStore.toggleAllAnomalies()}
        title="Show all fields"
    >
        {#if documentStore.allAnomaliesVisible}
            <Eye size={14} />
        {:else}
            <EyeOff size={14} />
        {/if}
        <span>Fields</span>
    </button>

    <button
        type="button"
        class="control-chip"
        class:active={documentStore.ocrVisible}
        onclick={() => documentStore.toggleOcr()}
        title="Show OCR text"
    >
        {#if documentStore.ocrVisible}
            <Eye size={14} />
        {:else}
            <EyeOff size={14} />
        {/if}
        <span>OCR</span>
    </button>
</div>

<div class="ocr-words-container" role="list" aria-label="OCR word list">
    {#if documentStore.ocrLines.length === 0}
        <p class="empty-state">No OCR data found</p>
    {:else}
        <div class="ocr-sections">
            {#if redItems.length > 0}
                <div class="accordion-section">
                    <div
                        class="accordion-header-row red"
                        class:active={documentStore.isTypeFullySelected(
                            "DANGER",
                        )}
                    >
                        <button
                            class="accordion-header red"
                            onclick={toggleRed}
                            aria-expanded={isRedOpen}
                            aria-controls="accordion-red-content"
                        >
                            <div class="header-left">
                                {#if isRedOpen}<ChevronDown
                                        size={14}
                                    />{:else}<ChevronRight size={14} />{/if}
                                <span>Forged</span>
                                <span class="count-badge red"
                                    >{redItems.length}</span
                                >
                            </div>
                        </button>
                        <button
                            type="button"
                            class="toggle-type-btn red"
                            class:active={documentStore.isTypeFullySelected(
                                "DANGER",
                            )}
                            onclick={(e) => {
                                e.stopPropagation();
                                documentStore.toggleOcrWordsByType("DANGER");
                            }}
                            title={documentStore.isTypeFullySelected("DANGER")
                                ? "Remove all"
                                : "Select all"}
                        >
                            {#if documentStore.isTypeFullySelected("DANGER")}
                                <CheckCircle2 size={18} />
                            {:else}
                                <Circle size={18} />
                            {/if}
                        </button>
                    </div>
                    {#if isRedOpen}
                        <div
                            id="accordion-red-content"
                            class="accordion-content"
                            role="region"
                            aria-label="Forged fields list"
                        >
                            {#each redItems as { line, index }}
                                {@const color = "#fb7185"}
                                <label
                                    class="ocr-word-row"
                                    class:selected={documentStore.isOcrWordSelected(
                                        index,
                                    )}
                                    style="--severity-color: {color};"
                                >
                                    <input
                                        type="checkbox"
                                        checked={documentStore.isOcrWordSelected(
                                            index,
                                        )}
                                        onchange={() =>
                                            documentStore.toggleOcrWord(index)}
                                        aria-label={`Select ${line.text}`}
                                    />
                                    <span class="word-text" title={line.text}
                                        >{line.text}</span
                                    >
                                </label>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            {#if yellowItems.length > 0}
                <div class="accordion-section">
                    <div
                        class="accordion-header-row yellow"
                        class:active={documentStore.isTypeFullySelected(
                            "WARNING",
                        )}
                    >
                        <button
                            class="accordion-header yellow"
                            onclick={toggleYellow}
                            aria-expanded={isYellowOpen}
                            aria-controls="accordion-yellow-content"
                        >
                            <div class="header-left">
                                {#if isYellowOpen}<ChevronDown
                                        size={14}
                                    />{:else}<ChevronRight size={14} />{/if}
                                <span>Suspicious</span>
                                <span class="count-badge yellow"
                                    >{yellowItems.length}</span
                                >
                            </div>
                        </button>
                        <button
                            type="button"
                            class="toggle-type-btn yellow"
                            class:active={documentStore.isTypeFullySelected(
                                "WARNING",
                            )}
                            onclick={(e) => {
                                e.stopPropagation();
                                documentStore.toggleOcrWordsByType("WARNING");
                            }}
                            title={documentStore.isTypeFullySelected("WARNING")
                                ? "Remove all"
                                : "Select all"}
                        >
                            {#if documentStore.isTypeFullySelected("WARNING")}
                                <CheckCircle2 size={18} />
                            {:else}
                                <Circle size={18} />
                            {/if}
                        </button>
                    </div>
                    {#if isYellowOpen}
                        <div
                            id="accordion-yellow-content"
                            class="accordion-content"
                            role="region"
                            aria-label="Suspicious fields list"
                        >
                            {#each yellowItems as { line, index }}
                                {@const color = "#fde047"}
                                <label
                                    class="ocr-word-row"
                                    class:selected={documentStore.isOcrWordSelected(
                                        index,
                                    )}
                                    style="--severity-color: {color};"
                                >
                                    <input
                                        type="checkbox"
                                        checked={documentStore.isOcrWordSelected(
                                            index,
                                        )}
                                        onchange={() =>
                                            documentStore.toggleOcrWord(index)}
                                        aria-label={`Select ${line.text}`}
                                    />
                                    <span class="word-text" title={line.text}
                                        >{line.text}</span
                                    >
                                </label>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}

            {#if greenItems.length > 0}
                <div class="accordion-section">
                    <div
                        class="accordion-header-row green"
                        class:active={documentStore.isTypeFullySelected("SAFE")}
                    >
                        <button
                            class="accordion-header green"
                            onclick={toggleGreen}
                            aria-expanded={isGreenOpen}
                            aria-controls="accordion-green-content"
                        >
                            <div class="header-left">
                                {#if isGreenOpen}<ChevronDown
                                        size={14}
                                    />{:else}<ChevronRight size={14} />{/if}
                                <span>Safe</span>
                                <span class="count-badge green"
                                    >{greenItems.length}</span
                                >
                            </div>
                        </button>
                        <button
                            type="button"
                            class="toggle-type-btn green"
                            class:active={documentStore.isTypeFullySelected(
                                "SAFE",
                            )}
                            onclick={(e) => {
                                e.stopPropagation();
                                documentStore.toggleOcrWordsByType("SAFE");
                            }}
                            title={documentStore.isTypeFullySelected("SAFE")
                                ? "Remove all"
                                : "Select all"}
                        >
                            {#if documentStore.isTypeFullySelected("SAFE")}
                                <CheckCircle2 size={18} />
                            {:else}
                                <Circle size={18} />
                            {/if}
                        </button>
                    </div>
                    {#if isGreenOpen}
                        <div
                            id="accordion-green-content"
                            class="accordion-content"
                            role="region"
                            aria-label="Safe fields list"
                        >
                            {#each greenItems as { line, index }}
                                {@const color = "#86efac"}
                                <label
                                    class="ocr-word-row"
                                    class:selected={documentStore.isOcrWordSelected(
                                        index,
                                    )}
                                    style="--severity-color: {color};"
                                >
                                    <input
                                        type="checkbox"
                                        checked={documentStore.isOcrWordSelected(
                                            index,
                                        )}
                                        onchange={() =>
                                            documentStore.toggleOcrWord(index)}
                                        aria-label={`Select ${line.text}`}
                                    />
                                    <span class="word-text" title={line.text}
                                        >{line.text}</span
                                    >
                                </label>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
</div>
