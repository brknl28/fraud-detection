<script lang="ts">
	interface Props {
		name: string;
		size?: 'small' | 'medium' | 'large';
		color?: string;
		label?: string;
	}

	let { name, size = 'medium', color, label }: Props = $props();
</script>

<p
	class="symbol"
	class:small={size === 'small'}
	class:medium={size === 'medium'}
	class:large={size === 'large'}
	style:color={color ?? 'inherit'}
	aria-hidden={label ? undefined : 'true'}
	aria-label={label}
>{name}</p>

<style>
	.symbol {
		font-family: 'Material Symbols Rounded';
		font-weight: 400;
		font-style: normal;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		letter-spacing: normal;
		text-transform: none;
		white-space: nowrap;
		direction: ltr;
		-webkit-font-feature-settings: 'liga';
		font-feature-settings: 'liga';
	}

	.small {
		font-size: 16px;
	}

	.medium {
		font-size: 20px;
	}

	.large {
		font-size: 28px;
	}
</style>
