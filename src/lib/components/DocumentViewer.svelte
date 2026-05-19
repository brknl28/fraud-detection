<script lang="ts">
	import { documentStore } from '$lib/stores/document.svelte';
	import {
		Version26ToolbarButton,
		Version26SegmentedControl,
		Version26SegmentedControlButton,
		RegularProgressIndicator,
	} from 'apple-svelte';
	import AnomalyOverlay from './AnomalyOverlay.svelte';
	import OcrOverlay from './OcrOverlay.svelte';
	import Skeleton from './Skeleton.svelte';
	import Symbol from './Symbol.svelte';
	import { onMount } from 'svelte';

	let isDocumentLoading = $derived(
		documentStore.isLoading || documentStore.isProcessingUpload,
	);
	let hasImage = $derived(!!documentStore.imageSrc);

	let imageElement = $state<HTMLImageElement>();
	let scrollContainer = $state<HTMLDivElement>();
	let zoomLevel = $state(1);
	let fitMode = $state<'contain' | 'width' | 'manual'>('contain');
	let displayBaseScale = $state(1);

	let isPanning = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let scrollLeft = $state(0);
	let scrollTop = $state(0);
	let initialPinchDistance = $state(0);
	let initialZoom = $state(1);
	let resizeObserver: ResizeObserver;
	const minZoomPercent = 0.5;
	const maxZoomPercent = 3.0;

	let minZoom = $derived(displayBaseScale * minZoomPercent);
	let maxZoom = $derived(displayBaseScale * maxZoomPercent);

	let canPrev = $derived(documentStore.documents.length > 1);
	let canNext = $derived(documentStore.documents.length > 1);

	function updateZoomForFitMode() {
		if (
			!scrollContainer ||
			!documentStore.imageNaturalWidth ||
			!documentStore.imageNaturalHeight
		)
			return;

		const containerWidth = scrollContainer.clientWidth;
		const containerHeight = scrollContainer.clientHeight;
		const padding = 24;
		const availWidth = containerWidth - padding;
		const availHeight = containerHeight - padding;

		let targetZoom = 1;

		if (fitMode === 'contain') {
			const scaleX = availWidth / documentStore.imageNaturalWidth;
			const scaleY = availHeight / documentStore.imageNaturalHeight;
			targetZoom = Math.min(scaleX, scaleY);
			displayBaseScale = targetZoom;
		} else if (fitMode === 'width') {
			targetZoom = availWidth / documentStore.imageNaturalWidth;
		}

		zoomLevel = targetZoom;
	}

	function handleImageLoad() {
		if (imageElement) {
			documentStore.setImageDimensions(
				imageElement.naturalWidth,
				imageElement.naturalHeight,
			);
			fitMode = 'contain';
			updateZoomForFitMode();
		}
	}

	function setManualMode() {
		fitMode = 'manual';
	}

	function percentToZoom(percent: number): number {
		const base = displayBaseScale > 0 ? displayBaseScale : 1;
		return (percent / 100) * base;
	}

	function roundToNearestTen(value: number): number {
		return Math.round(value / 10) * 10;
	}

	function zoomIn() {
		setManualMode();
		const currentPercent = getDisplayPercentage();
		const targetPercent = roundToNearestTen(currentPercent) + 10;
		zoomLevel = Math.min(percentToZoom(targetPercent), maxZoom);
	}

	function zoomOut() {
		setManualMode();
		const currentPercent = getDisplayPercentage();
		const targetPercent = roundToNearestTen(currentPercent) - 10;
		zoomLevel = Math.max(percentToZoom(targetPercent), minZoom);
	}

	function setFitMode(mode: 'contain' | 'width') {
		fitMode = mode;
		updateZoomForFitMode();
	}

	function getDisplayPercentage() {
		const base = displayBaseScale > 0 ? displayBaseScale : 1;
		return Math.round((zoomLevel / base) * 100);
	}

	const panThreshold = 5;
	let hasPanStarted = $state(false);

	function handleMouseDown(e: MouseEvent) {
		if (!scrollContainer || e.button !== 0) return;

		const target = e.target as HTMLElement | SVGElement;
		const isInteractiveElement =
			target.closest('.info-button') ||
			target.closest('.info-button-group') ||
			target.closest('[role="button"]') ||
			target.tagName === 'circle' ||
			(target as SVGElement).classList?.contains('info-button');

		if (isInteractiveElement) return;

		e.preventDefault();
		isPanning = true;
		hasPanStarted = false;
		startX = e.clientX;
		startY = e.clientY;
		scrollLeft = scrollContainer.scrollLeft;
		scrollTop = scrollContainer.scrollTop;
	}

	function handleGlobalMouseMove(e: MouseEvent) {
		if (!isPanning || !scrollContainer) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		if (!hasPanStarted && distance < panThreshold) return;
		if (!hasPanStarted) {
			hasPanStarted = true;
			scrollContainer.style.cursor = 'grabbing';
		}
		e.preventDefault();
		scrollContainer.scrollLeft = scrollLeft - dx;
		scrollContainer.scrollTop = scrollTop - dy;
	}

	function handleGlobalMouseUp() {
		isPanning = false;
		hasPanStarted = false;
		if (scrollContainer) scrollContainer.style.cursor = 'grab';
	}

	function getDistance(touches: TouchList) {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2) {
			setManualMode();
			initialPinchDistance = getDistance(e.touches);
			initialZoom = zoomLevel;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 2 && initialPinchDistance > 0) {
			e.preventDefault();
			const currentDistance = getDistance(e.touches);
			const scale = currentDistance / initialPinchDistance;
			zoomLevel = Math.max(minZoom, Math.min(maxZoom, initialZoom * scale));
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2) initialPinchDistance = 0;
	}

	function handleWheel(e: WheelEvent) {
		if (initialPinchDistance > 0) return;
		if (e.ctrlKey) {
			e.preventDefault();
			setManualMode();
			const delta = -e.deltaY * 0.02;
			zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));
			return;
		}
		e.preventDefault();
		setManualMode();
		const delta = -e.deltaY * 0.002;
		zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			documentStore.previousDocument();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			documentStore.nextDocument();
		} else if (e.key === '+' || e.key === '=') {
			e.preventDefault();
			zoomIn();
		} else if (e.key === '-' || e.key === '_') {
			e.preventDefault();
			zoomOut();
		} else if (e.key === 'Home') {
			e.preventDefault();
			fitMode = 'contain';
			updateZoomForFitMode();
		}
	}

	onMount(() => {
		window.addEventListener('mousemove', handleGlobalMouseMove);
		window.addEventListener('mouseup', handleGlobalMouseUp);

		if (scrollContainer) {
			resizeObserver = new ResizeObserver(() => {
				requestAnimationFrame(() => {
					if (fitMode !== 'manual') updateZoomForFitMode();
				});
			});
			resizeObserver.observe(scrollContainer);
		}

		return () => {
			window.removeEventListener('mousemove', handleGlobalMouseMove);
			window.removeEventListener('mouseup', handleGlobalMouseUp);
			if (resizeObserver) resizeObserver.disconnect();
		};
	});
</script>

<div class="document-viewer-wrapper">
	<div class="document-header liquid-glass liquid-glass-small">
		<div class="nav-group">
			<Version26ToolbarButton
				symbol="chevron_left"
				onPress={() => canPrev && documentStore.previousDocument()}
			/>
			<span class="document-label">{documentStore.currentLabel}</span>
			<Version26ToolbarButton
				symbol="chevron_right"
				onPress={() => canNext && documentStore.nextDocument()}
			/>
		</div>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="document-scroll-container"
		class:panning={isPanning}
		bind:this={scrollContainer}
		role="application"
		aria-label="Document view - Use +/- to zoom and arrow keys to navigate"
		tabindex="0"
		onmousedown={handleMouseDown}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		onwheel={handleWheel}
		onkeydown={handleKeydown}
	>
		<div
			class="document-container"
			class:fraud-alert={documentStore.fraudMarked}
			class:fit-center={fitMode === 'contain'}
			role="img"
			aria-label="Document view with anomaly highlights"
		>
			{#if isDocumentLoading && !hasImage}
				<div class="skeleton-container">
					<Skeleton variant="image" width="100%" height="100%" />
					<div class="skeleton-overlay liquid-glass liquid-glass-small">
						<RegularProgressIndicator showLabel={true} label="Loading documents…" />
					</div>
				</div>
			{:else}
				<div class="document-image-wrapper">
					{#if hasImage}
						<img
							bind:this={imageElement}
							src={documentStore.imageSrc}
							alt={documentStore.imageAlt}
							class="document-image"
							style:width={documentStore.imageNaturalWidth > 0
								? `${documentStore.imageNaturalWidth * zoomLevel}px`
								: 'auto'}
							style:height="auto"
							onload={handleImageLoad}
							draggable="false"
							ondragstart={(e) => e.preventDefault()}
						/>

						{#if documentStore.imageNaturalWidth > 0 && documentStore.imageNaturalHeight > 0}
							<AnomalyOverlay
								width={documentStore.imageNaturalWidth}
								height={documentStore.imageNaturalHeight}
								anomalies={documentStore.visibleAnomalies}
								checkedIds={documentStore.checkedAnomalyIds}
								onToggle={(id) => documentStore.toggleAnomaly(id)}
							/>

							<OcrOverlay
								showBoxes={documentStore.allAnomaliesVisible}
								showText={documentStore.ocrVisible}
								lines={documentStore.ocrLines}
								selectedIndices={documentStore.selectedOcrWordIds}
								width={documentStore.imageNaturalWidth}
								height={documentStore.imageNaturalHeight}
							/>
						{/if}
					{:else}
						<div class="no-document">
							<Symbol name="description" size="large" color="var(--labels-tertiary)" />
							<p>Please upload a document</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<div class="zoom-controls liquid-glass liquid-glass-small">
		<Version26ToolbarButton symbol="remove" onPress={zoomOut} />
		<span class="zoom-label">{getDisplayPercentage()}%</span>
		<Version26ToolbarButton symbol="add" onPress={zoomIn} />
	</div>

	<div class="fit-control">
		<Version26SegmentedControl>
			<Version26SegmentedControlButton
				label="Width"
				state={fitMode === 'width' ? 'selected' : 'default'}
				onPress={() => setFitMode('width')}
			/>
			<Version26SegmentedControlButton
				label="Height"
				state={fitMode === 'contain' ? 'selected' : 'default'}
				onPress={() => setFitMode('contain')}
			/>
		</Version26SegmentedControl>
	</div>

	{#if documentStore.isProcessingUpload && hasImage}
		<div class="processing-overlay liquid-glass liquid-glass-medium">
			<RegularProgressIndicator showLabel={true} label="Processing OCR…" />
		</div>
	{/if}
</div>

<style>
	.document-viewer-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;
		position: relative;
		background: color-mix(in srgb, var(--bg-grouped-primary) 72%, var(--bg-grouped-tertiary));
	}

	.document-header,
	.zoom-controls {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		z-index: 5;
		padding: 4px;
		border-radius: 999px;
		background: var(--app-glass-bg);
		border: 0.5px solid var(--app-glass-border);
		box-shadow: var(--app-floating-shadow);
		backdrop-filter: blur(24px) saturate(1.28);
		-webkit-backdrop-filter: blur(24px) saturate(1.28);
	}

	.document-header::before,
	.document-header::after,
	.zoom-controls::before,
	.zoom-controls::after,
	.skeleton-overlay::before,
	.skeleton-overlay::after,
	.processing-overlay::before,
	.processing-overlay::after {
		border-radius: inherit;
	}

	.document-header {
		top: 12px;
	}

	.zoom-controls {
		bottom: 12px;
	}

	.nav-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.document-label {
		min-width: 100px;
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--labels-primary);
		padding: 0 8px;
	}

	.zoom-label {
		min-width: 60px;
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		color: var(--labels-primary);
	}

	.fit-control {
		position: absolute;
		bottom: 12px;
		right: 12px;
		z-index: 5;
		min-width: 180px;
		padding: 3px;
		border-radius: 999px;
		background: var(--app-glass-bg);
		border: 0.5px solid var(--app-glass-border);
		box-shadow: var(--app-floating-shadow);
		backdrop-filter: blur(24px) saturate(1.28);
		-webkit-backdrop-filter: blur(24px) saturate(1.28);
	}

	.document-scroll-container {
		flex: 1;
		overflow: auto;
		min-height: 0;
		cursor: grab;
		user-select: none;
		display: flex;
		justify-content: flex-start;
		align-items: flex-start;
		background:
			linear-gradient(
				180deg,
				color-mix(in srgb, var(--bg-grouped-secondary) 72%, transparent),
				color-mix(in srgb, var(--bg-grouped-primary) 84%, transparent)
			);
	}

	.document-scroll-container.panning {
		cursor: grabbing;
	}

	.document-container {
		position: relative;
		display: block;
		margin: auto;
		flex-shrink: 0;
	}

	.document-container.fraud-alert {
		border: 4px solid var(--colors-red);
	}

	.document-container.fit-center {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.document-image-wrapper {
		position: relative;
		display: block;
		width: fit-content;
		margin: 0 auto;
	}

	.document-image {
		display: block;
		max-width: none;
		transition: width 0.2s ease;
		box-shadow: 0 18px 46px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
		border-radius: 4px;
	}

	.skeleton-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.skeleton-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 18px;
		border-radius: 18px;
		z-index: 10;
		background: var(--app-glass-bg);
		border: 0.5px solid var(--app-glass-border);
		box-shadow: var(--app-floating-shadow);
		backdrop-filter: blur(24px) saturate(1.28);
		-webkit-backdrop-filter: blur(24px) saturate(1.28);
	}

	.processing-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 24px 32px;
		border-radius: 18px;
		z-index: 20;
		background: var(--app-glass-bg);
		border: 0.5px solid var(--app-glass-border);
		box-shadow: var(--app-floating-shadow);
		backdrop-filter: blur(24px) saturate(1.28);
		-webkit-backdrop-filter: blur(24px) saturate(1.28);
	}

	.no-document {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		gap: 12px;
		color: var(--labels-secondary);
	}

	.no-document p {
		font-size: 15px;
		font-weight: 500;
	}
</style>
