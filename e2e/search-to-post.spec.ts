import { expect, test } from '@playwright/test';

test.describe('anonymous search → post', () => {
	test('search finds a post and opens its detail page', async ({ page }) => {
		await page.goto('/en/blog');
		await expect(page.getByRole('heading', { level: 1, name: 'Writing' })).toBeVisible();

		const search = page.getByRole('searchbox');
		await search.fill('LCP');
		await expect(page).toHaveURL(/q=LCP/, { timeout: 10_000 });

		const postLink = page.getByRole('link', { name: /Sub-second LCP on a content site/i });
		await expect(postLink).toBeVisible({ timeout: 15_000 });
		await postLink.click();

		await expect(page).toHaveURL(/\/en\/blog\/sub-second-lcp-on-a-content-site/);
		await expect(
			page.getByRole('heading', { level: 1, name: 'Sub-second LCP on a content site' })
		).toBeVisible();
		await expect(page.locator('article')).toBeVisible();
		await expect(page.locator('article .prose')).not.toBeEmpty();
	});
});
