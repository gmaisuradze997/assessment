import { expect, test } from '@playwright/test';

test.describe('authenticated optimistic edit → rollback', () => {
	test('viewer login, optimistic budget patch, then 403 rollback', async ({ page }) => {
		await page.goto('/en/login');
		await page.getByRole('button', { name: /viewer@demo\.test/i }).click();
		await expect(page.getByLabel('Email')).toHaveValue('viewer@demo.test');
		await page.locator('form').getByRole('button', { name: 'Sign in' }).click();

		await expect(page).toHaveURL(/\/en\/dashboard/);
		await page.goto('/en/dashboard/items');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

		const firstRow = page.locator('table tbody tr').first();
		await expect(firstRow).toBeVisible({ timeout: 15_000 });

		const budgetCell = firstRow.locator('td').nth(4);
		const originalBudget = (await budgetCell.innerText()).trim();
		expect(originalBudget.length).toBeGreaterThan(0);

		await firstRow.getByRole('button').click();
		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();

		const budgetInput = dialog.locator('input[name="budget"]');
		// Must respect step="100" or native constraint validation blocks submit.
		const current = Number(await budgetInput.inputValue());
		const nextBudget = String(current === 10_000 ? 20_000 : 10_000);
		await budgetInput.fill(nextBudget);

		const save = dialog.getByRole('button', { name: 'Save' });
		await expect(save).toBeEnabled({ timeout: 5_000 });

		const formatted = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(Number(nextBudget));

		// Assert the optimistic table update during the simulated latency window.
		await Promise.all([
			expect(budgetCell).toHaveText(formatted, { timeout: 3_000 }),
			budgetInput.press('Enter')
		]);

		await expect(page.getByText(/rolled back/i)).toBeVisible({ timeout: 15_000 });
		await expect(page.getByText(/does not allow editing/i)).toBeVisible();
		await expect(budgetCell).toHaveText(originalBudget);
	});
});
