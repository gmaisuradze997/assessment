import { expect, test } from '@playwright/test';
import { expectNoSeriousAxeViolations, setTheme, type ThemeClass } from './helpers/axe';
import { mintSessionCookie } from './helpers/session';

const PUBLIC_ROUTES = ['/en', '/en/blog', '/en/login'] as const;
const THEMES: ThemeClass[] = ['theme-light', 'theme-dark'];

test.describe('axe — public pages', () => {
	for (const route of PUBLIC_ROUTES) {
		for (const theme of THEMES) {
			test(`${route} (${theme}) has no serious/critical violations`, async ({ page }) => {
				await page.goto(route);
				await setTheme(page, theme);
				await expectNoSeriousAxeViolations(page, `${route} ${theme}`);
			});
		}
	}
});

test.describe('axe — dashboard', () => {
	test.beforeEach(async ({ context }) => {
		await context.addCookies([
			{
				name: 'session',
				value: mintSessionCookie('demo_editor').replace(/^session=/, ''),
				url: 'http://localhost:4173'
			}
		]);
	});

	for (const theme of THEMES) {
		test(`/en/dashboard/items (${theme}) has no serious/critical violations`, async ({ page }) => {
			await page.goto('/en/dashboard/items');
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			// Wait for streamed rows so the table body is in the axe tree.
			await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
			await setTheme(page, theme);
			await expectNoSeriousAxeViolations(page, `/en/dashboard/items ${theme}`);
		});
	}
});

test.describe('landmarks & skip link', () => {
	test('skip link moves focus into main', async ({ page }) => {
		await page.goto('/en');
		await page.keyboard.press('Tab');
		const skip = page.getByRole('link', { name: 'Skip to content' });
		await expect(skip).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.locator('#main')).toBeFocused();
	});

	test('document exposes banner, main, contentinfo landmarks', async ({ page }) => {
		await page.goto('/en');
		await expect(page.getByRole('banner')).toBeVisible();
		await expect(page.getByRole('main')).toBeVisible();
		await expect(page.getByRole('contentinfo')).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
	});
});
