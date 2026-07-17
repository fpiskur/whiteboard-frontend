import { defineConfig, devices } from '@playwright/test';

// End-to-end tests live in ./e2e and drive the whole app in a real browser. They
// never talk to a real backend — each test stubs the Rails API with page.route
// (see e2e/fixtures/api.ts). testDir is kept separate from the Vitest `tests/`
// directory so the two Playwright usages (Vitest browser provider vs this runner)
// never scan the same files.
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: 'html',
	use: {
		baseURL: 'http://localhost:5173',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		command: 'pnpm dev',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
