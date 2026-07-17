import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					// Component and interaction tests: real Chromium, real pointer events.
					include: ['tests/**/*.svelte.{test,spec}.{js,ts}'],
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: 'chromium' }]
					}
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					// Pure logic tests: no DOM needed.
					environment: 'node',
					include: ['tests/**/*.{test,spec}.{js,ts}'],
					exclude: ['tests/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
