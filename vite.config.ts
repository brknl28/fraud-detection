import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'apple-svelte/styles.css': fileURLToPath(
				new URL('./node_modules/apple-svelte/dist/styles.css', import.meta.url)
			)
		}
	}
});
