<script lang="ts">
	import { documentStore } from "$lib/stores/document.svelte";
	import AnomalyOverlay from "./AnomalyOverlay.svelte";
	import OcrOverlay from "./OcrOverlay.svelte";
	import Skeleton from "./Skeleton.svelte";
	import {
		ChevronLeft,
		ChevronRight,
		Minus,
		Plus,
		MoveHorizontal,
		MoveVertical,
		FileText,
	} from "lucide-svelte";
	import { onMount, onDestroy } from "svelte";
	let isDocumentLoading = $derived(
		documentStore.isLoading || documentStore.isProcessingUpload,
	);
	let hasImage = $derived(!!documentStore.imageSrc);

	let imageElement = $state<HTMLImageElement>();
	let scrollContainer = $state<HTMLDivElement>();
	let zoomLevel = $state(1);
	let fitMode = $state<"contain" | "width" | "manual">("contain");
	let displayBaseScale = $state(1);

	let isPanning = $state(false);
	let startX = $state(0);
	let startY = $state(0);
	let scrollLeft = $state(0);
	let scrollTop = $state(0);
	let initialPinchDistance = $state(0);
	let initialZoom = $state(1);
	let resizeObserver: ResizeObserver;
	const zoomFactor = 1.2;
	const minZoomPercent = 0.5;
	const maxZoomPercent = 3.0;

	let minZoom = $derived(displayBaseScale * minZoomPercent);
	let maxZoom = $derived(displayBaseScale * maxZoomPercent);

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

		if (fitMode === "contain") {
			const scaleX = availWidth / documentStore.imageNaturalWidth;
			const scaleY = availHeight / documentStore.imageNaturalHeight;
			targetZoom = Math.min(scaleX, scaleY);

			displayBaseScale = targetZoom;
		} else if (fitMode === "width") {
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

			fitMode = "contain";

			updateZoomForFitMode();
		}
	}

	function setManualMode() {
		fitMode = "manual";
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
		const roundedPercent = roundToNearestTen(currentPercent);
		const targetPercent = roundedPercent + 10;

		const targetZoom = percentToZoom(targetPercent);
		zoomLevel = Math.min(targetZoom, maxZoom);
	}

	function zoomOut() {
		setManualMode();
		const currentPercent = getDisplayPercentage();
		const roundedPercent = roundToNearestTen(currentPercent);
		const targetPercent = roundedPercent - 10;

		const targetZoom = percentToZoom(targetPercent);
		zoomLevel = Math.max(targetZoom, minZoom);
	}

	function toggleFit() {
		if (fitMode === "contain") {
			fitMode = "width";
		} else {
			fitMode = "contain";
		}
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
			target.closest(".info-button") ||
			target.closest(".info-button-group") ||
			target.closest('[role="button"]') ||
			target.tagName === "circle" ||
			(target as SVGElement).classList?.contains("info-button");

		if (isInteractiveElement) {
			return;
		}

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

		if (!hasPanStarted && distance < panThreshold) {
			return;
		}

		if (!hasPanStarted) {
			hasPanStarted = true;
			scrollContainer.style.cursor = "grabbing";
		}

		e.preventDefault();
		scrollContainer.scrollLeft = scrollLeft - dx;
		scrollContainer.scrollTop = scrollTop - dy;
	}

	function handleGlobalMouseUp() {
		isPanning = false;
		hasPanStarted = false;
		if (scrollContainer) {
			scrollContainer.style.cursor = "grab";
		}
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
			const newZoom = initialZoom * scale;
			zoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoom));
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2) {
			initialPinchDistance = 0;
		}
	}

	function handleWheel(e: WheelEvent) {
		if (initialPinchDistance > 0) return;

		if (e.ctrlKey) {
			e.preventDefault();
			setManualMode();
			const delta = -e.deltaY * 0.02;
			const newZoom = zoomLevel + delta;
			zoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoom));
			return;
		}

		e.preventDefault();
		setManualMode();
		const delta = -e.deltaY * 0.002;
		const newZoom = zoomLevel + delta;
		zoomLevel = Math.max(minZoom, Math.min(maxZoom, newZoom));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "ArrowLeft") {
			e.preventDefault();
			documentStore.previousDocument();
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			documentStore.nextDocument();
		} else if (e.key === "+" || e.key === "=") {
			e.preventDefault();
			zoomIn();
		} else if (e.key === "-" || e.key === "_") {
			e.preventDefault();
			zoomOut();
		} else if (e.key === "Home") {
			e.preventDefault();
			fitMode = "contain";
			updateZoomForFitMode();
		}
	}

	onMount(() => {
		window.addEventListener("mousemove", handleGlobalMouseMove);
		window.addEventListener("mouseup", handleGlobalMouseUp);

		if (scrollContainer) {
			resizeObserver = new ResizeObserver(() => {
				requestAnimationFrame(() => {
					if (fitMode !== "manual") {
						updateZoomForFitMode();
					}
				});
			});
			resizeObserver.observe(scrollContainer);
		}

		return () => {
			window.removeEventListener("mousemove", handleGlobalMouseMove);
			window.removeEventListener("mouseup", handleGlobalMouseUp);
			if (resizeObserver) resizeObserver.disconnect();
		};
	});
</script>

<div class="document-viewer-wrapper">
	<div class="document-header">
		<div class="document-nav-group">
			<button
				class="document-button"
				onclick={() => documentStore.previousDocument()}
				aria-label="Vorheriges Dokument"
			>
				<ChevronLeft size={20} />
			</button>
			<span class="document-label">{documentStore.currentLabel}</span>
			<button
				class="document-button"
				onclick={() => documentStore.nextDocument()}
				aria-label="Nächstes Dokument"
			>
				<ChevronRight size={20} />
			</button>
		</div>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="document-scroll-container"
		class:panning={isPanning}
		bind:this={scrollContainer}
		role="application"
		aria-label="Dokumentenansicht - Verwenden Sie +/- zum Zoomen und die Pfeiltasten zum Navigieren"
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
			class:fit-center={fitMode === "contain"}
			role="img"
			aria-label="Dokumentenansicht mit Anomalie-Hervorhebungen"
		>
			{#if isDocumentLoading && !hasImage}
				<div class="skeleton-container">
					<Skeleton variant="image" width="100%" height="100%" />
					<div class="skeleton-overlay">
						<div class="loading-spinner"></div>
						<span>Dokumente werden geladen...</span>
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
								: "auto"}
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
								onToggle={(id) =>
									documentStore.toggleAnomaly(id)}
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
							<FileText size={40} />
							<p>Bitte laden Sie ein Dokument hoch</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<div class="zoom-controls">
		<div class="zoom-group">
			<button
				class="document-button"
				onclick={zoomOut}
				disabled={zoomLevel <= minZoom}
			>
				<Minus size={20} />
			</button>
			<span class="document-stats">{getDisplayPercentage()}%</span>
			<button
				class="document-button"
				onclick={zoomIn}
				disabled={zoomLevel >= maxZoom}
			>
				<Plus size={20} />
			</button>
		</div>
	</div>

	<div class="fit-control">
		<button class="document-button" onclick={toggleFit}>
			{#if fitMode === "width"}
				<MoveVertical size={20} />
			{:else}
				<MoveHorizontal size={20} />
			{/if}
		</button>
	</div>

	{#if documentStore.isProcessingUpload}
		<div class="processing-overlay">
			<div class="loading-spinner"></div>
			<span>OCR wird verarbeitet...</span>
		</div>
	{/if}
</div>
