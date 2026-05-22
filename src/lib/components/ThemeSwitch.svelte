<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import Symbol from './Symbol.svelte';

	const options = [
		{ mode: 'light' as const, icon: 'light_mode', label: 'Light' },
		{ mode: 'system' as const, icon: 'settings_brightness', label: 'System' },
		{ mode: 'dark' as const, icon: 'dark_mode', label: 'Dark' },
	];
</script>

<div class="theme-switch" role="radiogroup" aria-label="Appearance">
	{#each options as opt}
		<button
			type="button"
			class="theme-option"
			class:active={themeStore.mode === opt.mode}
			role="radio"
			aria-checked={themeStore.mode === opt.mode}
			aria-label={opt.label}
			onclick={() => themeStore.setMode(opt.mode)}
		>
			<Symbol name={opt.icon} size="small" />
		</button>
	{/each}
</div>

<style>
	.theme-switch {
		display: inline-flex;
		gap: 1px;
		padding: 3px;
		border-radius: 10px;
		background: var(--fills-tertiary);
	}

	.theme-option {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 8px;
		color: var(--labels-secondary);
		transition: background 0.2s ease, color 0.2s ease;
		flex-shrink: 0;
	}

	.theme-option:hover {
		color: var(--labels-primary);
		background: var(--fills-secondary);
	}

	.theme-option.active {
		color: var(--labels-primary);
		background: var(--bg-grouped-secondary);
	}
</style>
