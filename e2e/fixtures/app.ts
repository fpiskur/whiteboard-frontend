import type { Page } from '@playwright/test';

/**
 * Navigate to the app and wait until it is hydrated and interactive. The app
 * fetches GET /notes from onMount (which only runs after hydration), so awaiting
 * that response guarantees event handlers on SSR-static chrome (the FAB, the theme
 * toggle) are attached before a test clicks them. Without this, an immediate click
 * can land before hydration and silently no-op.
 */
export async function gotoApp(page: Page): Promise<void> {
	const mounted = page.waitForResponse(
		(r) => r.url().includes('/api/notes') && r.request().method() === 'GET'
	);
	await page.goto('/');
	await mounted;
}
