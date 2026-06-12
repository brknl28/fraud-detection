<script lang="ts">
	import { documentStore } from '$lib/stores/document.svelte';
	import {
		Version26SegmentedControl,
		Version26SegmentedControlButton,
		Version26List,
		Version26ListRow,
	} from 'apple-svelte';
	import Symbol from './Symbol.svelte';

	type Severity = 'DANGER' | 'WARNING' | 'SAFE';

	let isRedOpen = $state(true);
	let isYellowOpen = $state(true);
	let isGreenOpen = $state(false);

	let redItems = $derived(
		documentStore.ocrLines
			.map((line, index) => ({ line, index }))
			.filter(
				(item) =>
					((item.line as any).severity === 'DANGER' ||
						(item.line as any).category === 'critical'),
			),
	);
	let yellowItems = $derived(
		documentStore.ocrLines
			.map((line, index) => ({ line, index }))
			.filter(
				(item) =>
					!(
						(item.line as any).severity === 'DANGER' ||
						(item.line as any).category === 'critical'
					) && (item.line as any).severity !== 'SAFE',
			),
	);
	let greenItems = $derived(
		documentStore.ocrLines
			.map((line, index) => ({ line, index }))
			.filter((item) => (item.line as any).severity === 'SAFE'),
	);

	function severityColor(severity: Severity) {
		if (severity === 'DANGER') return 'var(--colors-red)';
		if (severity === 'WARNING') return 'var(--colors-yellow)';
		return 'var(--colors-green)';
	}

	function severityLabel(severity: Severity) {
		if (severity === 'DANGER') return 'Forged';
		if (severity === 'WARNING') return 'Suspicious';
		return 'Safe';
	}

	function severityIcon(severity: Severity) {
		if (severity === 'DANGER') return 'warning';
		if (severity === 'WARNING') return 'info';
		return 'check_circle';
	}

	function setFieldsVisible(value: boolean) {
		if (value !== documentStore.allAnomaliesVisible) {
			documentStore.toggleAllAnomalies();
		}
	}

	function setOcrVisible(value: boolean) {
		if (value !== documentStore.ocrVisible) {
			documentStore.toggleOcr();
		}
	}
</script>

<div class="ocr-panel">
	<Version26SegmentedControl>
		<Version26SegmentedControlButton
			label="Fields"
			state={documentStore.allAnomaliesVisible ? 'selected' : 'default'}
			onPress={() => setFieldsVisible(!documentStore.allAnomaliesVisible)}
		/>
		<Version26SegmentedControlButton
			label="OCR Text"
			state={documentStore.ocrVisible ? 'selected' : 'default'}
			onPress={() => setOcrVisible(!documentStore.ocrVisible)}
		/>
	</Version26SegmentedControl>

	<div class="words-scroll" role="list" aria-label="OCR word list">
		{#if documentStore.ocrLines.length === 0}
			<p class="empty-state">No OCR data found</p>
		{:else}
			{#if redItems.length > 0}
				<section class="severity-section">
					<div class="severity-header" style:--severity-color="var(--colors-red)">
						<button
							type="button"
							class="header-trigger"
							onclick={() => (isRedOpen = !isRedOpen)}
							aria-expanded={isRedOpen}
						>
							<div class="header-left">
								<Symbol
									name={isRedOpen ? 'expand_more' : 'chevron_right'}
									size="small"
									color="var(--colors-red)"
								/>
								<span class="severity-title">{severityLabel('DANGER')}</span>
								<span class="count-badge">{redItems.length}</span>
							</div>
						</button>
						<button
							type="button"
							class="select-all-btn"
							onclick={() => documentStore.toggleOcrWordsByType('DANGER')}
							aria-label={documentStore.isTypeFullySelected('DANGER')
								? 'Deselect all forged'
								: 'Select all forged'}
						>
							<Symbol
								name={documentStore.isTypeFullySelected('DANGER')
									? 'check_circle'
									: 'radio_button_unchecked'}
								size="small"
								color="var(--colors-red)"
							/>
						</button>
					</div>

					{#if isRedOpen}
						<Version26List>
							{#each redItems as { line, index } (index)}
								{@const checked = documentStore.isOcrWordSelected(index)}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="ocr-row-wrapper"
									role="button"
									tabindex="0"
									aria-pressed={checked}
									aria-label={`Select ${line.text}`}
									onclick={() => documentStore.toggleOcrWord(index)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											documentStore.toggleOcrWord(index);
										}
									}}
								>
									<Version26ListRow
										title={line.text}
										showEditButton={true}
										editButtonType="checkmark"
										checkmarkEditButtonState={checked ? 'selected' : 'default'}
									>
										<svelte:fragment slot="trailing">
											<Symbol
												name={severityIcon('DANGER')}
												size="small"
												color="var(--colors-red)"
											/>
										</svelte:fragment>
									</Version26ListRow>
								</div>
							{/each}
						</Version26List>
					{/if}
				</section>
			{/if}

			{#if yellowItems.length > 0}
				<section class="severity-section">
					<div class="severity-header" style:--severity-color="var(--colors-yellow)">
						<button
							type="button"
							class="header-trigger"
							onclick={() => (isYellowOpen = !isYellowOpen)}
							aria-expanded={isYellowOpen}
						>
							<div class="header-left">
								<Symbol
									name={isYellowOpen ? 'expand_more' : 'chevron_right'}
									size="small"
									color="var(--colors-yellow)"
								/>
								<span class="severity-title">{severityLabel('WARNING')}</span>
								<span class="count-badge">{yellowItems.length}</span>
							</div>
						</button>
						<button
							type="button"
							class="select-all-btn"
							onclick={() => documentStore.toggleOcrWordsByType('WARNING')}
							aria-label={documentStore.isTypeFullySelected('WARNING')
								? 'Deselect all suspicious'
								: 'Select all suspicious'}
						>
							<Symbol
								name={documentStore.isTypeFullySelected('WARNING')
									? 'check_circle'
									: 'radio_button_unchecked'}
								size="small"
								color="var(--colors-yellow)"
							/>
						</button>
					</div>

					{#if isYellowOpen}
						<Version26List>
							{#each yellowItems as { line, index } (index)}
								{@const checked = documentStore.isOcrWordSelected(index)}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="ocr-row-wrapper"
									role="button"
									tabindex="0"
									aria-pressed={checked}
									aria-label={`Select ${line.text}`}
									onclick={() => documentStore.toggleOcrWord(index)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											documentStore.toggleOcrWord(index);
										}
									}}
								>
									<Version26ListRow
										title={line.text}
										showEditButton={true}
										editButtonType="checkmark"
										checkmarkEditButtonState={checked ? 'selected' : 'default'}
									>
										<svelte:fragment slot="trailing">
											<Symbol
												name={severityIcon('WARNING')}
												size="small"
												color="var(--colors-yellow)"
											/>
										</svelte:fragment>
									</Version26ListRow>
								</div>
							{/each}
						</Version26List>
					{/if}
				</section>
			{/if}

			{#if greenItems.length > 0}
				<section class="severity-section">
					<div class="severity-header" style:--severity-color="var(--colors-green)">
						<button
							type="button"
							class="header-trigger"
							onclick={() => (isGreenOpen = !isGreenOpen)}
							aria-expanded={isGreenOpen}
						>
							<div class="header-left">
								<Symbol
									name={isGreenOpen ? 'expand_more' : 'chevron_right'}
									size="small"
									color="var(--colors-green)"
								/>
								<span class="severity-title">{severityLabel('SAFE')}</span>
								<span class="count-badge">{greenItems.length}</span>
							</div>
						</button>
						<button
							type="button"
							class="select-all-btn"
							onclick={() => documentStore.toggleOcrWordsByType('SAFE')}
							aria-label={documentStore.isTypeFullySelected('SAFE')
								? 'Deselect all safe'
								: 'Select all safe'}
						>
							<Symbol
								name={documentStore.isTypeFullySelected('SAFE')
									? 'check_circle'
									: 'radio_button_unchecked'}
								size="small"
								color="var(--colors-green)"
							/>
						</button>
					</div>

					{#if isGreenOpen}
						<Version26List>
							{#each greenItems as { line, index } (index)}
								{@const checked = documentStore.isOcrWordSelected(index)}
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="ocr-row-wrapper"
									role="button"
									tabindex="0"
									aria-pressed={checked}
									aria-label={`Select ${line.text}`}
									onclick={() => documentStore.toggleOcrWord(index)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											documentStore.toggleOcrWord(index);
										}
									}}
								>
									<Version26ListRow
										title={line.text}
										showEditButton={true}
										editButtonType="checkmark"
										checkmarkEditButtonState={checked ? 'selected' : 'default'}
									>
										<svelte:fragment slot="trailing">
											<Symbol
												name={severityIcon('SAFE')}
												size="small"
												color="var(--colors-green)"
											/>
										</svelte:fragment>
									</Version26ListRow>
								</div>
							{/each}
						</Version26List>
					{/if}
				</section>
			{/if}
		{/if}
	</div>
</div>

<style>
	.ocr-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex: 1;
		min-height: 0;
	}

	.words-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.severity-section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.severity-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 12px;
		background: var(--bg-grouped-secondary);
		border: 0.5px solid var(--separators-non-opaque);
		border-radius: 14px;
		color: var(--severity-color, var(--labels-primary));
	}

	.header-trigger {
		flex: 1;
		display: flex;
		align-items: center;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
		color: inherit;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.severity-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--severity-color, var(--labels-primary));
	}

	.count-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--severity-color, var(--labels-tertiary)) 18%, transparent);
		color: var(--severity-color, var(--labels-secondary));
	}

	.select-all-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 2px;
	}

	.ocr-row-wrapper {
		cursor: pointer;
	}
</style>
