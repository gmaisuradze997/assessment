import { expect, test } from '@playwright/test';

test.describe('visual regression', () => {
	test.use({ viewport: { width: 1280, height: 720 } });

	test('login page matches baseline', async ({ page }) => {
		await page.goto('/en/login');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await page.evaluate(() => document.fonts.ready);
		// Slightly looser ratio so a macOS-authored baseline can still gate on
		// Linux CI (font AA differs); regenerate per-OS via Playwright Docker
		// when Docker is available: npx playwright test e2e/visual.spec.ts -u
		await expect(page).toHaveScreenshot('login.png', { maxDiffPixelRatio: 0.08 });
	});
});
