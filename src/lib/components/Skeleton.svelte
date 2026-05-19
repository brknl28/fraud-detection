<script lang="ts">
	interface Props {
		variant?: 'image' | 'text' | 'rect';
		width?: string;
		height?: string;
		borderRadius?: string;
	}

	let {
		variant = 'rect',
		width = '100%',
		height = '1rem',
		borderRadius = '4px',
	}: Props = $props();

	const defaultDimensions = {
		image: { width: '100%', height: '300px', borderRadius: '8px' },
		text: { width: '100%', height: '1rem', borderRadius: '4px' },
		rect: { width: '100%', height: '100%', borderRadius: '4px' },
	};

	const finalWidth = $derived(width || defaultDimensions[variant].width);
	const finalHeight = $derived(height || defaultDimensions[variant].height);
	const finalRadius = $derived(borderRadius || defaultDimensions[variant].borderRadius);
</script>

<div
	class="skeleton skeleton-{variant}"
	style:width={finalWidth}
	style:height={finalHeight}
	style:border-radius={finalRadius}
	aria-hidden="true"
></div>

<style>
	.skeleton {
		background: linear-gradient(
			90deg,
			var(--fills-tertiary) 25%,
			var(--fills-quaternary) 50%,
			var(--fills-tertiary) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.skeleton-image {
		min-height: 200px;
	}

	.skeleton-text {
		min-height: 1rem;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}

		100% {
			background-position: -200% 0;
		}
	}
</style>
